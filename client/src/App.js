import React, { useState, useRef, useEffect } from "react";
import "./App.css";

function humanizeResponse(text) {
  let newText = text;
  if (/error|fail|problem|issue/i.test(text)) newText = "😅 " + newText;
  if (/hello|hi|greetings/i.test(text)) newText = "👋 " + newText;
  if (/thank(s)?|appreciate/i.test(text)) newText += " 🙏";
  if (/great|good job|well done|awesome/i.test(text)) newText += " 🎉";
  if (/question|ask/i.test(text)) newText += " 🤔";
  if (/pdf/i.test(text)) newText += " 📄";
  if (newText.length < 40) newText = "Here's what I found! 😊\n" + newText;
  return newText;
}

function App() {
  const [pdfs, setPdfs] = useState([]); // Array of files
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false); // New: processing state
  const [uploaded, setUploaded] = useState(false);
  const [ready, setReady] = useState(false); // New: backend ready state
  const [question, setQuestion] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const chatEndRef = useRef(null);
  const statusInterval = useRef(null);
  const [pendingQuestions, setPendingQuestions] = useState([]); // New: queue for questions asked during processing

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chat]);

  useEffect(() => {
    // Poll backend for processing status if processing
    if (processing) {
      statusInterval.current = setInterval(async () => {
        try {
          const res = await fetch("https://pdf-q-a-learning-project-1.onrender.com/status");
          // const res = await fetch("http://localhost:3001/status");
          const data = await res.json();
          if (data.status === "ready") {
            setProcessing(false);
            setReady(true);
            clearInterval(statusInterval.current);
            // If there are pending questions, send them now
            if (pendingQuestions.length > 0) {
              pendingQuestions.forEach((q) => {
                sendQuestion(q);
              });
              setPendingQuestions([]);
            }
          }
        } catch (err) {
          // Optionally handle polling error
        }
      }, 1500);
    }
    return () => clearInterval(statusInterval.current);
  }, [processing, pendingQuestions]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setPdfs((prev) => [...prev, ...files]);
    setUploaded(false);
    setReady(false);
    setProcessing(false);
    setChat([]);
    setError("");
  };

  const handleRemovePdf = (index) => {
    setPdfs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearAll = () => {
    setPdfs([]);
    setUploaded(false);
    setReady(false);
    setProcessing(false);
    setChat([]);
    setError("");
  };

  const handleUpload = async () => {
    if (!pdfs.length) return;
    setUploading(true);
    setError("");
    setChat([]);
    setUploaded(false);
    setReady(false);
    setProcessing(false);
    const formData = new FormData();
    pdfs.forEach((pdf, idx) => {
      formData.append("pdfs", pdf);
    });
    try {
      const res = await fetch("https://pdf-q-a-learning-project-1.onrender.com/upload", {
      // const res = await fetch("http://localhost:3001/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setUploaded(true);
      setProcessing(true); // Start polling for processing
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const sendQuestion = async (questionText) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("https://pdf-q-a-learning-project-1.onrender.com/ask", {
      // const res = await fetch("http://localhost:3001/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: questionText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get answer");
      setChat((prev) => [
        ...prev.slice(0, -1), // Remove the loading spinner
        {
          role: "model",
          content: humanizeResponse(data.answer),
        },
      ]);
    } catch (err) {
      setError(err.message);
      setChat((prev) => [
        ...prev.slice(0, -1), // Remove the loading spinner
        { role: "model", content: `Error: ${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    const userMsg = { role: "user", content: question };
    setChat((prev) => [...prev, userMsg]);
    setQuestion("");
    // If processing, queue the question and show spinner
    if (processing) {
      setPendingQuestions((prev) => [...prev, question]);
      setChat((prev) => [
        ...prev,
        { role: "model", content: <span className="loading-spinner" style={{ display: 'inline-block', verticalAlign: 'middle' }}><svg width="20" height="20" viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" fill="none" stroke="#ffa500" strokeWidth="5" strokeDasharray="31.4 31.4" transform="rotate(-90 25 25)"><animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite"/></circle></svg> Waiting for PDF processing...</span> },
      ]);
      return;
    }
    // Otherwise, send immediately
    setLoading(true);
    setError("");
    setChat((prev) => [
      ...prev,
      { role: "model", content: <span className="loading-spinner" style={{ display: 'inline-block', verticalAlign: 'middle' }}><svg width="20" height="20" viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" fill="none" stroke="#ffa500" strokeWidth="5" strokeDasharray="31.4 31.4" transform="rotate(-90 25 25)"><animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite"/></circle></svg> Loading...</span> },
    ]);
    await sendQuestion(question);
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
            multiple
          />
          <label htmlFor="pdf-upload" className="upload-label">
            {pdfs.length ? `${pdfs.length} PDF${pdfs.length > 1 ? "s" : ""} selected` : "Choose PDF(s)"}
          </label>
          <button
            onClick={handleUpload}
            disabled={!pdfs.length || uploading}
            className="upload-btn"
          >
            {uploading ? "Uploading..." : "Upload PDF(s)"}
          </button>
          {pdfs.length > 0 && (
            <ul style={{ listStyle: "none", padding: 0, margin: "10px 0 0 0", width: "100%" }}>
              {pdfs.map((file, idx) => (
                <li key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, wordBreak: "break-all" }}>{file.name}</span>
                  <button
                    style={{ marginLeft: 8, background: "none", border: "none", color: "#ff6961", fontWeight: "bold", cursor: "pointer", fontSize: 16 }}
                    onClick={() => handleRemovePdf(idx)}
                    title="Remove"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
          {pdfs.length > 1 && (
            <button
              onClick={handleClearAll}
              style={{ marginTop: 8, background: "#393e46", color: "#fff", border: "1px solid #393e46", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 13 }}
            >
              Clear All
            </button>
          )}
          {processing && <div className="processing-msg" style={{ color: '#ffa500', marginTop: 8 }}>Processing PDF(s)...</div>}
          {ready && uploaded && <div className="upload-success">PDF(s) uploaded!</div>}
        </div>
        {error && <div className="error-msg">{error}</div>}
      </aside>
      <main className="chat-window">
        <div className="chat-history">
          {chat.length === 0 && (
            <div className="empty-chat">
              Upload PDF(s) and start asking questions!
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
              uploaded ? (ready ? "Type your question..." : "You can ask now, but PDF is still processing...") : "Upload PDF(s) first"
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
        {processing && (
          <div style={{ marginTop: 10, color: '#ffa500', fontWeight: 500 }}>
            Processing PDF(s)... You can ask questions, but answers may not be available until processing is done.
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
