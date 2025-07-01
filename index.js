import { config } from "dotenv";
config();

import { loadPDF } from "./Loader/pdfLoader.js";
import { createRAGChain } from "./chains/ragChain.js";
import readline from "readline";

// import path from "path";
// import { fileURLToPath } from "url";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askQuestion = (query) => {
  return new Promise((resolve) => rl.question(query, resolve));
};

(async () => {
  //   const pdfPath = path.join(__dirname, "Sample.pdf");
  //   const pdfText = await loadPDF(pdfPath);

  const pdfText = await loadPDF("./Sample.pdf");
  const chain = await createRAGChain(pdfText);

  while (true) {
    const query = await askQuestion("\n Ask Question ");
    if (query.toLowerCase() === "exit") break;
    const resp = await chain.call({ query });
    console.log("\n Answer: ", resp.text);
  }

  rl.close();
})();
