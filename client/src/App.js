import React, { useState, useRef, useEffect } from "react";
import "./App.css";

function App() {
  const [pdf, setPdf] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [question, setQuestion] = useState("");
  const [chat, setChat] = useState([]); // {role: 'user'|'model', content: string}
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chat]);

  const handleFileChange = (e) => {
    setPdf(e.target.files[0]);
    setUploaded(false);
    setChat([]);
    setError("");
  };

  const handleUpload = async () => {
    if (!pdf) return;
    setUploading(true);
    setError("");
    setChat([]);
    const formData = new FormData();
    formData.append("pdf", pdf);
    try {
      // const res = await fetch(
      //   "https://pdf-q-a-learning-project-1.onrender.com/upload",
      //   {
      const res = await fetch("http://localhost:3001/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setUploaded(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    setError("");
    const userMsg = { role: "user", content: question };
    setChat((prev) => [...prev, userMsg]);
    setQuestion("");
    try {
      // const res = await fetch(
      //   "https://pdf-q-a-learning-project-1.onrender.com/ask",
      //   {
      const res = await fetch("http://localhost:3001/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get answer");
      setChat((prev) => [...prev, { role: "model", content: data.answer }]);
    } catch (err) {
      setError(err.message);
      setChat((prev) => [
        ...prev,
        { role: "model", content: `Error: ${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatgpt-root">
      <aside className="sidebar">
        <h2>PDF Q&A</h2>
        <div className="upload-section">
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            id="pdf-upload"
            style={{ display: "none" }}
          />
          <label htmlFor="pdf-upload" className="upload-label">
            {pdf ? pdf.name : "Choose PDF"}
          </label>
          <button
            onClick={handleUpload}
            disabled={!pdf || uploading}
            className="upload-btn"
          >
            {uploading ? "Uploading..." : "Upload PDF"}
          </button>
          {uploaded && <div className="upload-success">PDF uploaded!</div>}
        </div>
        {error && <div className="error-msg">{error}</div>}
      </aside>
      <main className="chat-window">
        <div className="chat-history">
          {chat.length === 0 && (
            <div className="empty-chat">
              Upload a PDF and start asking questions!
            </div>
          )}
          {chat.map((msg, idx) => (
            <div
              key={idx}
              className={`chat-bubble ${
                msg.role === "user" ? "user-bubble" : "model-bubble"
              }`}
            >
              <div className="bubble-role">
                {msg.role === "user" ? "You" : "AI"}
              </div>
              <div className="bubble-content">{msg.content}</div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <form className="chat-input-row" onSubmit={handleAsk}>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={
              uploaded ? "Type your question..." : "Upload a PDF first"
            }
            disabled={!uploaded || loading}
            className="chat-input"
          />
          <button
            type="submit"
            disabled={!uploaded || loading || !question.trim()}
            className="send-btn"
          >
            {loading ? "..." : "Send"}
          </button>
        </form>
      </main>
    </div>
  );
}

export default App;
