import PDFDocument from "pdfkit";

/**
 * Convert interview transcript text to a PDF buffer for GridFS storage
 * @param {string} transcript
 * @param {string} title
 * @returns {Promise<Buffer>}
 */
export function transcriptToPdfBuffer(transcript, title = "Interview Transcript") {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(18).text(title, { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor("#666666").text(`Generated: ${new Date().toLocaleString()}`, { align: "center" });
    doc.moveDown(1.5);
    doc.fontSize(11).fillColor("#000000").text(transcript, {
      align: "left",
      lineGap: 4,
    });

    doc.end();
  });
}

/**
 * Build a PDF filename from a text interview title
 */
export function getPdfFilename(title) {
  const base = (title || "interview-transcript")
    .replace(/\.(txt|pdf)$/i, "")
    .replace(/[^a-z0-9-_]/gi, "_")
    .slice(0, 80);
  return `${base || "interview-transcript"}.pdf`;
}
