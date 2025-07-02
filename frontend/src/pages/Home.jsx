import React from "react";
import { Link } from "react-router-dom";
// import "./Home.css"; // Optional: for custom styles, or use App.css

const Home = () => {
  return (
    <div className="home-landing" style={{ minHeight: "100vh", background: "rgb(221, 230, 225)" }}>
      {/* Header */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "32px 8vw 24px 8vw",
          background: "transparent",
        }}
      >
        <div
          style={{
            fontSize: "2.2rem",
            fontWeight: "bold",
            letterSpacing: "2px",
            color: "#196138",
            fontFamily: "'Orbitron', 'Segoe UI', Arial, sans-serif",
          }}
        >
          Chikitsa
        </div>
        <div>
          <Link to="/login">
            <button className="send-btn" style={{ marginRight: 16 }}>Login</button>
          </Link>
          <Link to="/register">
            <button className="send-btn">Sign Up</button>
          </Link>
        </div>
      </header>

      {/* Body */}
      <main style={{ maxWidth: 700, margin: "0 auto", padding: "32px 16px" }}>
        <section style={{ marginBottom: 36 }}>
          <h1 style={{
            fontSize: "2.5rem",
            fontWeight: 700,
            color: "#1a3f1d",
            marginBottom: 12,
            letterSpacing: "1px"
          }}>
            Welcome to Chikitsa – Your Friendly Medical Chatbot
          </h1>
          <p style={{ fontSize: "1.2rem", color: "#234d2a", lineHeight: 1.7 }}>
            Chikitsa is an AI-powered medical assistant designed to help you get quick, reliable, and easy-to-understand answers to your health questions. Whether you’re curious about symptoms, medications, or general wellness, Chikitsa is here to support you 24/7.
          </p>
        </section>

        <section style={{ marginBottom: 36 }}>
          <h2 style={{ color: "#196138", fontSize: "1.5rem", fontWeight: 600, marginBottom: 10 }}>
            How does it work?
          </h2>
          <ul style={{ color: "#234d2a", fontSize: "1.1rem", lineHeight: 1.7, paddingLeft: 24 }}>
            <li>Type your medical question in simple language.</li>
            <li>Chikitsa searches trusted medical sources and uses advanced AI to provide clear, friendly answers.</li>
            <li>No medical jargon – just helpful, easy-to-understand information.</li>
            <li>Your privacy is respected: no personal data is stored or shared.</li>
          </ul>
        </section>

        <section style={{ marginBottom: 36 }}>
          <h2 style={{ color: "#196138", fontSize: "1.5rem", fontWeight: 600, marginBottom: 10 }}>
            Why use Chikitsa?
          </h2>
          <ul style={{ color: "#234d2a", fontSize: "1.1rem", lineHeight: 1.7, paddingLeft: 24 }}>
            <li>Instant answers to common health questions.</li>
            <li>Available anytime, anywhere.</li>
            <li>Empowers you to make informed decisions about your health.</li>
            <li>Designed to be supportive, non-judgmental, and easy to use.</li>
          </ul>
        </section>

        <section style={{
          background: "#eaffea",
          borderRadius: 12,
          padding: "24px 20px",
          marginTop: 40,
          boxShadow: "0 2px 12px #19613822"
        }}>
          <h3 style={{ color: "#196138", fontWeight: 700, marginBottom: 8 }}>
            About the Author
          </h3>
          <p style={{ color: "#234d2a", fontSize: "1.1rem", marginBottom: 8 }}>
            Hi, I'm <b>[Your Name]</b>, the creator of Chikitsa. I'm passionate about using technology to make healthcare more accessible and understandable for everyone. My goal is to bridge the gap between complex medical information and everyday people, empowering you to take charge of your health with confidence.
          </p>
          <p style={{ color: "#234d2a", fontSize: "1.1rem" }}>
            <b>About me:</b> I am a dedicated developer and lifelong learner, always exploring new ways to use AI for good. If you have feedback or suggestions, feel free to reach out!
          </p>
        </section>
      </main>
    </div>
  );
};

export default Home;