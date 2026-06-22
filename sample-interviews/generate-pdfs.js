import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { transcriptToPdfBuffer } from "../backend/src/utils/transcriptToPdf.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pdfSources = [
  { txt: "interview-1-sarah-food-app.txt", title: "Interview 1 — Sarah (Food App User)" },
  { txt: "interview-2-ahmed-food-app.txt", title: "Interview 2 — Ahmed (Student User)" },
];

async function main() {
  for (const { txt, title } of pdfSources) {
    const txtPath = path.join(__dirname, txt);
    const transcript = fs.readFileSync(txtPath, "utf-8");
    const pdfBuffer = await transcriptToPdfBuffer(transcript, title);
    const pdfName = txt.replace(".txt", ".pdf");
    fs.writeFileSync(path.join(__dirname, pdfName), pdfBuffer);
    console.log("Created:", pdfName);
  }
}

main().catch(console.error);
