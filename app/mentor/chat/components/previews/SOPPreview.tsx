"use client";

import TextPreview from "@/app/components/TextPreview";


interface SOPPreviewProps {
  content: string;
}

export default function SOPPreview({ content }: SOPPreviewProps) {
  if (!content) return null;

  return (
    <div className="mt-4 border-t pt-4">
      <TextPreview
        content={content}
        fileName={"SOP"}
      />
    </div>
  );
}