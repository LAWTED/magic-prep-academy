"use client";

import TextPreview from "../../../../components/TextPreview";

interface SOPPreviewProps {
  content: string;
  isUser: boolean;
}

export default function SOPPreview({ content, isUser }: SOPPreviewProps) {
  if (!content) return null;

  return (
    <div className="mt-4 border-t pt-4">
      <TextPreview
        content={content}
        fileName={isUser ? "Your SOP" : "Edited SOP"}
      />
    </div>
  );
}