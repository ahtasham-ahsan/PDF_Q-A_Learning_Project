# 📄 PDF Q&A with LangChain.js, Weaviate & OpenAI

This is a Retrieval-Augmented Generation (RAG) project that lets you **ask questions about any PDF file**. It uses:

- 🧠 **LangChain.js** for chaining language model and retrieval logic
- 🔍 **Weaviate** as the vector store to store & search document chunks
- 🤖 **OpenAI** for embeddings and GPT-powered answers

---

## ⚙️ Features

- Uploads a PDF file
- Splits it into text chunks
- Converts chunks to vector embeddings using OpenAI
- Stores them in a **Weaviate vector database**
- Uses semantic search + GPT to answer your questions
- Keeps embeddings reusable across sessions

---

## 📦 Tech Stack

- [LangChain.js](https://js.langchain.com/)
- [Weaviate (Cloud or Local)](https://weaviate.io/)
- [OpenAI](https://platform.openai.com/)
- Node.js (18+)

---

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/your-username/pdf-qa-weaviate-langchain.git
cd pdf-qa-weaviate-langchain
npm install
node index.js
```
