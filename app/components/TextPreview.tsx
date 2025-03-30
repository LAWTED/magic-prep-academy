"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Download } from "lucide-react";
import { generateTextPdf } from "./generateTextPdf";
import { toast } from "sonner";

interface TextPreviewProps {
  content: string;
  maxHeight?: string;
  className?: string;
  fileName?: string;
}

export default function TextPreview({
  content,
  maxHeight = "max-h-[500px]",
  className = "",
  fileName = "text-document.pdf",
}: TextPreviewProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!content) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No content available</p>
      </div>
    );
  }

  // Function to handle PDF download
  const handleDownloadPDF = async () => {
    try {
      setIsDownloading(true);
      await generateTextPdf(content, fileName);
      toast.success("PDF downloaded successfully");
    } catch (error) {
      console.error("Failed to download PDF:", error);
      toast.error("Failed to download PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="relative">
      {/* Header with download button */}
      <div className="flex justify-end">
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-full text-bronze"
          title="Download PDF"
          onClick={handleDownloadPDF}
          disabled={isDownloading}
        >
          <Download
            size={18}
            className={isDownloading ? "text-gray-400 animate-pulse" : ""}
          />
        </motion.button>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={`overflow-auto ${maxHeight} font-serif text-base leading-relaxed ${className}`}
      >
        {content.split("\n").map((paragraph, index) => (
          <p key={index} className={index > 0 ? "mt-4" : ""}>
            {paragraph}
          </p>
        ))}
      </motion.div>
    </div>
  );
}
