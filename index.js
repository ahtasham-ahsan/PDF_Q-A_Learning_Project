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
  new Promise((resolve) => rl.question(query, resolve));
};

(async () => {
  const pdfText = await loadPDF("./some.pdf");
  const chain = await createRAGChain(pdfText);

  while (true) {
    const query = await askQuestion("\n Ask Question ");
    if (query.toLowerCase() === "exit") break;
    const resp = await chain.call({ query });
    console.log("\n Answer: ", resp.text);
  }

  rl.close();
})();
