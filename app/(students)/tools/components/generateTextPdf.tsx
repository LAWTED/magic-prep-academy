import React from "react";
import { pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import TextPreviewPDF from "./TextPreviewPDF";

/**
 * Generate and download a PDF of the text content
 * @param content The text content to render in the PDF
 * @param fileName Optional custom file name (default: "text-document.pdf")
 */
export const generateTextPdf = async (
  content: string,
  fileName: string = "text-document.pdf"
) => {
  try {
    // Generate the PDF blob from the TextPreviewPDF component
    const blob = await pdf(
      <TextPreviewPDF content={content} />
    ).toBlob();

    // Save the PDF file
    saveAs(blob, fileName);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};