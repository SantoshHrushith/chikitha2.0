import os
from dotenv import load_dotenv, find_dotenv
from fastapi import FastAPI
from fastapi import UploadFile, File
import openai
import tempfile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
from langchain.chat_models import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings

# === Load environment variables ===
load_dotenv(find_dotenv())
os.environ["OPENAI_API_KEY"] = os.environ.get("GROQ_API_KEY")
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

# === FastAPI app setup ===
app = FastAPI()

client = Groq(api_key=GROQ_API_KEY)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Request schema ===
class ChatRequest(BaseModel):
    question: str

# === Prompt template ===
prompt = PromptTemplate(
    template="""
    You are a kind and helpful medical assistant designed to support patients.
    Use the information provided in the context to answer the patient’s question. If the question is not relateed to context just search for the question ,you may use general medical knowledge to help — but only if you are sure it’s accurate and safe. Never guess or assume.
    Speak in a clear and simple way that anyone can understand. Avoid medical terms unless absolutely necessary — and if you use them, explain them in plain, friendly language.
    Always aim to reassure the patient and provide helpful, safe information.
    If you dont know the answer, just say that you dont know, dont try to make up an answer. 
    If question given is small and relevant to your medical knowledge ask to elaborate.

    Context: {context}
    Question: {question}

    Start the answer directly without saying "Acoording to the context" or similar sentences.
""",
    input_variables=["context", "question"]
)
# Start the answer directly. No small talk please.

# === Load FAISS and embeddings ===
embedding_model = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
db = FAISS.load_local("newvector/db_faiss", embedding_model, allow_dangerous_deserialization=True)

# === Memory for multi-turn conversation ===
memory = ConversationBufferMemory(
    memory_key="chat_history",
    return_messages=True,
    output_key="answer"
)

# === Load Groq LLM ===
llm = ChatOpenAI(
    openai_api_base="https://api.groq.com/openai/v1",
    openai_api_key=GROQ_API_KEY,
    model="llama3-8b-8192",
    temperature=0.4,
    max_tokens=512
)

# === Build QA chain ===
qa_chain = ConversationalRetrievalChain.from_llm(
    llm=llm,
    retriever=db.as_retriever(search_kwargs={"k": 7}),
    memory=memory,
    return_source_documents=True,
    combine_docs_chain_kwargs={"prompt": prompt},
    output_key="answer"
)

# === Define POST endpoint ===
@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        result = qa_chain.invoke({"question": request.question})
        return {"answer": result["answer"]}
    except Exception as e:
        return {"error": str(e)}



@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            tmp.write(await audio.read())
            tmp.flush()
            temp_path = tmp.name

        with open(temp_path, "rb") as f:
            transcription = client.audio.transcriptions.create(
                file=(audio.filename, f, "audio/wav"),
                model="whisper-large-v3-turbo",
                response_format="text",
                language="en"
            )

        return {"transcript": transcription}
    except Exception as e:
        return {"error": str(e)}