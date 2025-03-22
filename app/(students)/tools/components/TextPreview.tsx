"use client";

import React from "react";
import { motion } from "framer-motion";

interface TextPreviewProps {
  content: string;
  maxHeight?: string;
  className?: string;
}

export default function TextPreview({
  content,
  maxHeight = "max-h-[500px]",
  className = "",
}: TextPreviewProps) {
  if (!content) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No content available</p>
      </div>
    );
  }

  return (
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
  );
}