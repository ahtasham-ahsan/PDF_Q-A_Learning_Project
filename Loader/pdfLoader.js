import fs from "fs";
import pdf from "pdf-parse";

export async function loadPDF(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const pages = [];
  let pageNum = 1;
  // Use pagerender to collect text per page
  await pdf(dataBuffer, {
    pagerender: (pageData) => {
      pages.push({
        pageContent: pageData
          .getTextContent()
          .then((tc) => tc.items.map((i) => i.str).join(" ")),
        pageNumber: pageNum++,
      });
      // Return empty string to skip default text collection
      return "";
    },
  });
  // Resolve all pageContent promises
  for (const page of pages) {
    page.pageContent = await page.pageContent;
  }
  return pages;
}
