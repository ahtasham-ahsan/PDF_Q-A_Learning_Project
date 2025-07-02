import { config } from "dotenv";
config();

import { loadPDF } from "./Loader/pdfLoader.js";
import { createRAGChain } from "./chains/ragChain.js";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askQuestion = (query) => {
  return new Promise((resolve) => rl.question(query, resolve));
};

(async () => {
  const pdfText = await loadPDF("./Sample.pdf");
  const chain = await createRAGChain(pdfText);
  if (!chain) {
    console.error("❌ Chain could not be created. Exiting.");
    rl.close();
    process.exit(1);
  }

  while (true) {
    const query = await askQuestion("\nAsk Question (or 'exit' to quit): ");
    if (query.toLowerCase() === "exit") break;

    const resp = await chain.call({ question: query });
    console.log("\nAnswer:", resp.content);
  }

  rl.close();
})();
