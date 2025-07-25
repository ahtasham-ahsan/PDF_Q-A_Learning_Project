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
let processingStatus = "idle"; // "idle" | "processing" | "ready"

app.post("/upload", upload.array("pdfs"), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }
    processingStatus = "processing";
    // Respond immediately
    res.json({ message: "Upload received, processing started" });
    // Process in background
    (async () => {
      let allPages = [];
      for (const file of req.files) {
        try {
          const pages = await loadPDF(file.path);
          allPages = allPages.concat(pages);
        } catch (err) {
          processingStatus = "idle";
          console.error(`Failed to process PDF '${file.originalname}': ${err.message}`);
          return;
        }
      }
      pdfText = allPages;
      try {
        chain = await createRAGChain(pdfText);
        processingStatus = "ready";
        console.log("chain ready");
      } catch (err) {
        processingStatus = "idle";
        console.error(`Chain creation failed: ${err.message}`);
      }
    })();
  } catch (err) {
    processingStatus = "idle";
    res.status(500).json({ error: `Unexpected error: ${err.message}` });
  }
});

app.get("/status", (req, res) => {
  res.json({ status: processingStatus });
});

app.post("/ask", async (req, res) => {
  try {
    if (processingStatus !== "ready" || !chain) {
      return res.status(400).json({ error: processingStatus === "processing" ? "PDF is still processing, please wait." : "No PDF uploaded yet" });
    }
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: "No question provided" });
    let resp;
    try {
      resp = await chain.invoke({ question });
    } catch (err) {
      return res.status(500).json({ error: `Failed to get answer: ${err.message}` });
    }
    res.json({ answer: resp.content });
  } catch (err) {
    res.status(500).json({ error: `Unexpected error: ${err.message}` });
  }
});

// Global error handler for any uncaught errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
