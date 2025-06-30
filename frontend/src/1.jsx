import { useState } from 'react';
import axios from 'axios';
import './App.css';
import { IoSend } from "react-icons/io5";
import { GrMicrophone } from "react-icons/gr";
import { useRef } from 'react';
import { useEffect } from 'react';

// Typewriter effect component
function Typewriter({ text, onDone }) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    setDisplayed(""); // Reset on new text
    if (!text || typeof text !== "string") return;
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        if (onDone) onDone();
      }
    }, 20); // Adjust speed here (ms per character)
    return () => clearInterval(interval);
  }, [text, onDone]);

  return <span>{displayed}</span>;
}


function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);
  const [speechRecognized, setSpeechRecognized] = useState(false);


  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { sender: "You", text: input }];
    setMessages([...newMessages, { sender: "Chikitsa", text: "", loading: true }]);
    setLoading(true);
    const Input = input.trim();
    setInput("");
    try {
      const res = await axios.post("http://localhost:8000/chat", {
        question: Input,
      });

      const answer = res.data.answer || "No response.";
      // Replace the last loading message with the answer
      setMessages([
        ...newMessages,
        { sender: "Chikitsa", text: answer }
      ]);
    } catch (err) {
      setMessages([
        ...newMessages,
        { sender: "Chikitsa", text: "Error: Could not connect." }
      ]);
    }
    setLoading(false);

  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech Recognition not supported in this browser.");
      return;
    }
    setSpeechRecognized(false);

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setSpeechRecognized(true);
      setIsRecording(false);
    };

    recognition.onerror = (event) => {
      console.error("Recognition error:", event.error);
      // alert("Could not recognize speech. Please try again.");
      setIsRecording(false);
    };

    recognition.onend = () => {
      if (!speechRecognized) {
        // alert("No speech detected. Please try again.");
        setIsRecording(false);
      }
    };

    recognitionRef.current = recognition;
    setIsRecording(true);
    recognition.start();
  };

  const handleStopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      console.log("Recording stopped.");
      console.log("Recognition instance:", recognitionRef.current);
      console.log("text", input);
    }
  };

  const handleCancelRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
    setIsRecording(false);
  };



  return (

    <div className="chat-container">
      <h1 className="title">🩺 Chikitsa - Medical Chatbot</h1>

      <div className="chat-window">
        {messages.length === 0 ? (
          <div className="empty-chat-message">
            Hi, How can I help you?
          </div>
        ) : (
          messages.map((msg, i) => {
            const isLastBot =
              msg.sender === "Chikitsa" &&
              i === messages.length - 1 &&
              !msg.loading;
            return (
              <div key={i} className={`chat-message ${msg.sender === "You" ? "user" : "bot"}`}>
                <img
                  src={msg.sender === "You" ? "/user.webp" : "/bot.png"}
                  alt={msg.sender}
                  className="avatar"
                />
                <div className="message-bubble">
                  {msg.loading ? (
                    <span className="loader"></span>
                  ) : isLastBot ? (
                    <Typewriter text={msg.text} />
                  ) : (
                    msg.text
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="input-bar">
        <textarea
          value={input}
          placeholder="Ask your medical question..."
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          className="input-textarea"
          rows={2}
          disabled={loading}
          style={{ resize: "none" }}
        />
        {input.trim() === "" ? (
          <button onClick={handleVoiceInput} className="mic-btn" disabled={loading}>
            <GrMicrophone />
          </button>
        ) : (
          <button onClick={sendMessage} className="send-btn" disabled={loading}>
            <IoSend />
          </button>
        )}
      </div>
      {
        isRecording && (
          <div className="voice-modal">
            <div className="voice-modal-content">
              <p className="recording-text">🎤 Recording... Speak now</p>
              <div className="voice-modal-actions">
                <button className="stop-btn" onClick={handleStopRecording} title="Stop Recording">
                  &#9632;
                </button>
                <button className="cancel-btn" onClick={handleCancelRecording} title="Cancel">
                  ✖
                </button>
              </div>
            </div>
          </div>
        )
      }

    </div>
  );
}

export default App;