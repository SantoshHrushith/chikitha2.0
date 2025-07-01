import os
from dotenv import load_dotenv, find_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
import openai
import tempfile

from groq import Groq
from langchain.chat_models import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings

# === Load environment variables ===
load_dotenv(find_dotenv())
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

# === Flask app setup ===
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)    
client = Groq(api_key=GROQ_API_KEY)

# === Prompt template ===
prompt = PromptTemplate(
    template="""
    You are a kind and helpful medical assistant designed to support patients.
    Use the information provided in the context to answer the patient’s question. If the question is not related to context just search for the question ,you may use general medical knowledge to help — but only if you are sure it’s accurate and safe. Never guess or assume.
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

# === /chat endpoint ===
@app.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json()
        question = data.get("question", "")
        result = qa_chain.invoke({"question": question})
        return jsonify({"answer": result["answer"]})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# === /transcribe endpoint ===
@app.route("/transcribe", methods=["POST"])
def transcribe():
    try:
        if "audio" not in request.files:
            print("No audio file uploaded")
            return jsonify({"error": "No audio file uploaded"}), 400
        audio = request.files["audio"]
        print("Audio file received:", audio.filename)

        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            audio.save(tmp)
            tmp.flush()
            temp_path = tmp.name

        print("Saved audio to:", temp_path)

        # Use Groq client for Whisper transcription
        with open(temp_path, "rb") as f:
            transcription = client.audio.transcriptions.create(
                file=(audio.filename, f, "audio/wav"),
                model="whisper-large-v3-turbo",
                response_format="text",
                language="en"
            )

        print("Transcript:", transcription)
        return jsonify({"transcript": transcription})  # transcription is already a string
    except Exception as e:
        print("Transcribe error:", e)
        return jsonify({"error": str(e)}), 500
    
@app.route("/reset", methods=["POST"])
def reset():
    try:
        memory.clear()
        return jsonify({"success": True, "message": "Memory reset."})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)