import React from "react";
import { pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import APAPreviewPDF from "./APAPreviewPDF";
import { ResumeData } from "./APAPreview";

/**
 * Generate and download a PDF of the resume in APA format
 * @param resumeData The resume data to render in the PDF
 * @param fileName Optional custom file name (default: "resume-apa-format.pdf")
 */
export const generateAPAResumePdf = async (
  resumeData: ResumeData,
  fileName: string = "resume-apa-format.pdf"
) => {
  try {
    // Generate the PDF blob from the APAPreviewPDF component
    const blob = await pdf(
      <APAPreviewPDF resumeData={resumeData} />
    ).toBlob();

    // Save the PDF file
    saveAs(blob, fileName);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};