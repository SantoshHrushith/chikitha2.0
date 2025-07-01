import { useState } from 'react';
import axios from 'axios';
import './App.css';
import { useRef } from 'react';
import { useEffect } from 'react';
import { IoSend } from "react-icons/io5";
import { GrMicrophone } from "react-icons/gr";
import { FaRegStopCircle } from "react-icons/fa";
import { GiCancel } from "react-icons/gi";



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
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

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

  const handleVoiceInput = async () => {
    if (!navigator.mediaDevices) {
      alert("Audio recording not supported in this browser.");
      return;
    }

    setIsRecording(true);

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });

    audioChunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        audioChunksRef.current.push(e.data);
      }
    };

    recorder.onstop = async () => {
      setIsRecording(false);

      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.wav');

      try {
        const res = await axios.post("http://localhost:8000/transcribe", formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setInput(res.data.transcript || "");
      } catch (err) {
        alert("Transcription failed.");
      }

      // Stop all audio tracks to free the microphone
      stream.getTracks().forEach((track) => track.stop());
    };

    recorder.start();
    mediaRecorderRef.current = recorder;
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const handleCancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  return (
    <div className="App">
      <video
          autoPlay
          loop
          muted
          playsInline
          className="chat-bg-video"
        >
          <source src="/b4.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
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
                <p className="recording-text">Recording... Speak now</p>
                <div className="voice-modal-actions">
                  <button className="stop-btn" onClick={handleStopRecording} title="Stop Recording">
                    <FaRegStopCircle />
                  </button>
                  <button className="cancel-btn" onClick={handleCancelRecording} title="Cancel">
                    <GiCancel />
                  </button>
                </div>
              </div>
            </div>
          )
        }

      </div>
    </div>
  );
}

export default App;