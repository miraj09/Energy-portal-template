import { domToPng } from "modern-screenshot";

/**
 * Renders a DOM element to a PDF file and triggers a browser download.
 * Uses modern-screenshot so Tailwind v4 lab()/oklab() colors render correctly.
 */
export async function downloadElementAsPdf(
  elementId: string,
  fileName: string
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error("Printable invoice content was not found.");
  }

  const { default: jsPDF } = await import("jspdf");

  const imageData = await domToPng(element, {
    scale: 2,
    backgroundColor: "#ffffff",
    filter: (node) => {
      if (!(node instanceof HTMLElement)) {
        return true;
      }
      return !node.classList.contains("invoice-no-print");
    },
  });

  const image = new Image();
  image.src = imageData;
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Failed to load invoice image for PDF export."));
  });

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imageWidth = pageWidth;
  const imageHeight = (image.height * imageWidth) / image.width;

  let heightRemaining = imageHeight;
  let yOffset = 0;

  pdf.addImage(imageData, "PNG", 0, yOffset, imageWidth, imageHeight);
  heightRemaining -= pageHeight;

  while (heightRemaining > 0) {
    yOffset -= pageHeight;
    pdf.addPage();
    pdf.addImage(imageData, "PNG", 0, yOffset, imageWidth, imageHeight);
    heightRemaining -= pageHeight;
  }

  const normalizedFileName = fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`;
  pdf.save(normalizedFileName);
}
