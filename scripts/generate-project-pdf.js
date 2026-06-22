import { mdToPdf } from "md-to-pdf";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const inputFile = path.join(rootDir, "docs", "PROJECT_SPECIFICATION.md");
const outputFile = path.join(rootDir, "docs", "Cursor_for_PMs_Project_Specification.pdf");
const stylesheet = path.join(rootDir, "docs", "pdf-styles.css");

async function generatePdf() {
  if (!fs.existsSync(inputFile)) {
    console.error(`Source file not found: ${inputFile}`);
    process.exit(1);
  }

  console.log("Generating PDF from:", inputFile);

  try {
    const pdf = await mdToPdf(
      { path: inputFile },
      {
        dest: outputFile,
        css: fs.readFileSync(stylesheet, "utf-8"),
        pdf_options: {
          format: "A4",
          margin: {
            top: "20mm",
            bottom: "20mm",
            left: "22mm",
            right: "22mm",
          },
          printBackground: true,
        },
        launch_options: {
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
        },
      }
    );

    if (pdf?.filename) {
      console.log("PDF generated successfully:", pdf.filename);
    } else {
      console.log("PDF generated successfully:", outputFile);
    }
  } catch (error) {
    console.error("PDF generation failed:", error.message);
    process.exit(1);
  }
}

generatePdf();
