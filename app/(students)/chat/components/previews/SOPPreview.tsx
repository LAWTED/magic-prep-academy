"use client";

import TextPreview from "../../../../components/TextPreview";

interface SOPPreviewProps {
  content: string;
}

export default function SOPPreview({ content }: SOPPreviewProps) {
  if (!content) return null;

  return (
    <div className="mt-4 border-t pt-4 border-bronze">
      <TextPreview
        content={content}
        fileName={"SOP"}
      />
    </div>
  );
}