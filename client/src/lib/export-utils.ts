import PDFKit from "pdfkit/js/pdfkit.standalone";

export type ExportFormat = "txt" | "srt" | "pdf";

export async function formatTranscriptionForExport(
  text: string,
  format: ExportFormat,
  metadata: { title?: string; date?: Date } = {}
): Promise<Blob> {
  switch (format) {
    case "txt":
      return new Blob([text], { type: "text/plain" });

    case "srt":
      // Create SRT format with approximate timing (1 subtitle every 4 seconds)
      const lines = text.split(/[.!?]+\s+/);
      let srtContent = "";

      lines.forEach((line, index) => {
        if (!line.trim()) return;

        const startTime = index * 4;
        const endTime = startTime + 4;

        srtContent += `${index + 1}\n`;
        srtContent += `${formatSRTTime(startTime)} --> ${formatSRTTime(endTime)}\n`;
        srtContent += `${line.trim()}\n\n`;
      });

      return new Blob([srtContent], { type: "text/plain" });

    case "pdf":
      return new Promise((resolve) => {
        const doc = new PDFKit({
          margin: 50,
          size: "A4",
        });

        const chunks: Uint8Array[] = [];
        doc.on("data", (chunk: Uint8Array) => chunks.push(chunk));
        doc.on("end", () => {
          const pdfBlob = new Blob(chunks, {
            type: "application/pdf",
          });
          resolve(pdfBlob);
        });

        // Add metadata
        if (metadata.title) {
          doc.fontSize(24).text(metadata.title, { align: "center" });
          doc.moveDown();
        }

        if (metadata.date) {
          doc.fontSize(12)
            .text(`Generated on: ${metadata.date.toLocaleDateString()}`, {
              align: "center",
            });
          doc.moveDown();
        }

        // Add content
        doc.fontSize(12).text(text, {
          align: "left",
          lineGap: 5,
        });

        doc.end();
      });

    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

function formatSRTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  return `${pad(hours)}:${pad(minutes)}:${pad(secs)},${pad(ms, 3)}`;
}

function pad(num: number, size: number = 2): string {
  let str = num.toString();
  while (str.length < size) {
    str = "0" + str;
  }
  return str;
}