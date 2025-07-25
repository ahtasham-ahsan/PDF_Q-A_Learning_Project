# 📄 PDF Q&A Learning App

A full-stack Retrieval-Augmented Generation (RAG) project that lets you **ask questions about any PDF file** using OpenAI, LangChain.js, and Weaviate. Features a modern React frontend with a custom Navbar.

---

## ✨ Features

- Upload one or more PDF files
- Splits PDFs into text chunks and generates vector embeddings (OpenAI)
- Stores embeddings in a Weaviate vector database
- Semantic search + GPT-powered answers to your questions
- Chat interface with conversation history
- Responsive, modern UI
- **Navbar** with app title (left) and LinkedIn + author name (right)

---

## 🖥️ Demo UI

- **Navbar:**
  - Left: App title ("PDF Q&A Learning App")
  - Right: LinkedIn icon (links to [LinkedIn](https://www.linkedin.com/in/muhammadahtasham/)), and author name "Muhammad Ahtasham" (links to [ahtashamawan.com](https://atiiisham.vecel.app/))
- **Sidebar:**
  - Upload PDFs, see upload status, clear files
- **Main Chat:**
  - Ask questions about your PDFs, get answers from the AI

---

## 🛠️ Tech Stack

- **Frontend:** React (Create React App)
- **Backend:** Node.js, Express
- **AI/Embeddings:** OpenAI, LangChain.js
- **Vector DB:** Weaviate (Dockerized)

---

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/ahtasham-ahsan/PDF_Q-A_Learning_Project.git
cd PDF_Q-A_Learning_Project
```

### 2. Start Weaviate (Vector DB)

You can use Docker Compose:

```bash
docker-compose up -d
```

This starts Weaviate on port 8080.

### 3. Install backend dependencies

```bash
npm install
```

### 4. Install frontend dependencies

```bash
cd client
npm install
```

### 5. Start the backend server

```bash
npm run start
```

### 6. Start the frontend (React)

```bash
cd client
npm start
```

The app will be available at [http://localhost:3000](http://localhost:3000)

---

## ⚡ Usage

1. **Upload PDF(s):** Use the sidebar to select and upload one or more PDF files.
2. **Wait for processing:** The app will process and embed your PDFs.
3. **Ask questions:** Type your question in the chat input. The AI will answer based on your uploaded PDFs.
4. **Navbar:**
   - Click the LinkedIn icon to visit the author's LinkedIn.
   - Click "Muhammad Ahtasham" to visit the author's website.

---

## 📂 Project Structure

```
PDF_Q-A_Learning_Project/
  ├── chains/           # RAG chain logic
  ├── client/           # React frontend
  │   └── src/
  │       ├── App.js    # Main app
  │       ├── Navbar.js # Navbar component
  │       └── ...
  ├── Loader/           # PDF loader logic
  ├── langGraph/        # LangChain/graph logic
  ├── weaviate/         # Weaviate client setup
  ├── uploads/          # Uploaded PDFs
  ├── test/             # Test data
  ├── docker-compose.yml
  ├── index.js          # Backend entry
  └── README.md
```

---

## 🧑‍💻 Author

- [Muhammad Ahtasham](https://atiiisham.vercel.app/) ([LinkedIn](https://www.linkedin.com/in/muhammadahtasham/))

---

## 📜 License

MIT
