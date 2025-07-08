import express from "express";
import multer from "multer";
import cors from "cors";
import { config } from "dotenv";
config();

import { loadPDF } from "./Loader/pdfLoader.js";
import { createRAGChain } from "./chains/ragChain.js";

const app = express();
const upload = multer({ dest: "uploads/" });
app.use(cors());
app.use(express.json());

let chain = null;
let pdfText = null;

app.post("/upload", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    pdfText = await loadPDF(req.file.path);
    chain = await createRAGChain(pdfText);
    if (!chain) return res.status(500).json({ error: "Chain creation failed" });
    res.json({ message: "PDF uploaded and processed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/ask", async (req, res) => {
  try {
    if (!chain) return res.status(400).json({ error: "No PDF uploaded yet" });
    const { question } = req.body;
    if (!question)
      return res.status(400).json({ error: "No question provided" });
    const resp = await chain.invoke({ question });
    res.json({ answer: resp.content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
