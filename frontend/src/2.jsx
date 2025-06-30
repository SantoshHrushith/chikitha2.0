import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import { IoSend } from "react-icons/io5";
import { GrMicrophone } from "react-icons/gr";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);

  // 🔁 Initialize Speech Recognition
  useEffect(() => {
    console.log("Initializing Speech Recognition...");

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        console.log("🎤 Voice recognition started...");
      };

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log("✅ Transcript received:", transcript);
        setInput((prev) => prev + transcript);
        setIsRecording(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("❌ Recognition error:", event.error);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        console.log("📴 Voice recognition ended.");
        setIsRecording(false);
      };
    } else {
      alert("Speech recognition is not supported in this browser.");
      console.warn("⚠️ Web Speech API not supported.");
    }
  }, []);

  // 🎙️ Start recording
  const handleVoiceInput = () => {
    if (recognitionRef.current) {
      console.log("🟢 Starting recording...");
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  // ⏹️ Stop and accept recording
  const stopRecording = () => {
    if (recognitionRef.current) {
      console.log("🛑 Stopping recording...");
      recognitionRef.current.stop();
    }
  };

  // ❌ Cancel and discard recording
  const cancelRecording = () => {
    if (recognitionRef.current) {
      console.log("❌ Cancelling recording...");
      recognitionRef.current.abort();
    }
    setIsRecording(false);
  };

  // 📨 Send the message
  const sendMessage = async () => {
    if (!input.trim()) {
      console.log("🚫 Empty message. Ignoring send.");
      return;
    }

    const Input = input.trim();
    console.log("📨 Sending message:", Input);

    const newMessages = [...messages, { sender: "You", text: Input }];
    setMessages([...newMessages, { sender: "Chikitsa", text: "", loading: true }]);
    setLoading(true);
    setInput("");

    try {
      const res = await axios.post("http://localhost:8000/chat", {
        question: Input,
      });

      const answer = res.data.answer || "No response.";
      console.log("✅ Response from server:", answer);

      setMessages([...newMessages, { sender: "Chikitsa", text: answer }]);
    } catch (err) {
      console.error("❌ Error while sending message:", err);
      setMessages([...newMessages, { sender: "Chikitsa", text: "Error: Could not connect." }]);
    }

    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !isRecording && !e.shiftKey) {
      e.preventDefault();
      console.log("↩️ Enter pressed. Sending message.");
      sendMessage();
    }
  };

  return (
    <div className="chat-container">
      <h1 className="title">🩺 Chikitsa - Medical Chatbot</h1>

      <div className="chat-window">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-message ${msg.sender === "You" ? "user" : "bot"}`}>
            <img
              src={msg.sender === "You" ? "/user.webp" : "/bot.png"}
              alt={msg.sender}
              className="avatar"
            />
            <div className="message-bubble">
              {msg.loading ? <span className="loader"></span> : msg.text}
            </div>
          </div>
        ))}
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
        <button 
          onClick={handleVoiceInput} 
          className={`mic-btn ${isRecording ? 'recording' : ''}`}
          disabled={loading}
          title={isRecording ? "Recording..." : "Start voice input"}
        >
          <GrMicrophone />
        </button>
        <button onClick={sendMessage} className="send-btn" disabled={loading}>
          <IoSend />
        </button>
      </div>

      {isRecording && (
        <div className="voice-modal">
          <div className="voice-modal-content">
            <p className="recording-text">🎤 Recording... Speak now</p>
            <div className="voice-actions">
              <button 
                className="stop-btn" 
                onClick={stopRecording}
                title="Stop Recording"
              >
                ⏹️
              </button>
              <button 
                className="cancel-btn" 
                onClick={cancelRecording}
                title="Cancel Recording"
              >
                ❌
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
