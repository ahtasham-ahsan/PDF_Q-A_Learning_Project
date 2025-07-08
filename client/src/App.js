import React, { useState } from "react";
import "./App.css";

function App() {
  const [pdf, setPdf] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    setPdf(e.target.files[0]);
    setUploaded(false);
    setAnswer("");
    setError("");
  };

  const handleUpload = async () => {
    if (!pdf) return;
    setUploading(true);
    setError("");
    setAnswer("");
    const formData = new FormData();
    formData.append("pdf", pdf);
    try {
      const res = await fetch(
        "https://pdf-q-a-learning-project-1.onrender.com/upload",
        {
          // const res = await fetch("http://localhost:3001/upload", {
          method: "POST",
          body: formData,
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setUploaded(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleAsk = async () => {
    if (!question) return;
    setLoading(true);
    setError("");
    setAnswer("");
    try {
      const res = await fetch(
        "https://pdf-q-a-learning-project-1.onrender.com/ask",
        {
          // const res = await fetch("http://localhost:3001/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get answer");
      setAnswer(data.answer);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h2>PDF Q&A</h2>
        <div style={{ marginBottom: 20 }}>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
          />
          <button
            onClick={handleUpload}
            disabled={!pdf || uploading}
            style={{ marginLeft: 10 }}
          >
            {uploading ? "Uploading..." : "Upload PDF"}
          </button>
        </div>
        {uploaded && (
          <div style={{ marginBottom: 20 }}>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question about the PDF..."
              style={{ width: 300, marginRight: 10 }}
            />
            <button onClick={handleAsk} disabled={loading || !question}>
              {loading ? "Getting answer..." : "Ask"}
            </button>
          </div>
        )}
        {answer && (
          <div style={{ marginTop: 20, color: "#90ee90" }}>
            <strong>Answer:</strong> {answer}
          </div>
        )}
        {error && (
          <div style={{ marginTop: 20, color: "#ff6961" }}>
            <strong>Error:</strong> {error}
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
