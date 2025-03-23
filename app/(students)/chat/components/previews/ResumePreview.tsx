"use client";

import APAPreview from "../../../tools/resume/components/APAPreview";

interface ResumePreviewProps {
  resumeData: any;
  isUser: boolean;
  documentId?: string | null;
}

export default function ResumePreview({
  resumeData,
  isUser,
  documentId = null
}: ResumePreviewProps) {
  if (!resumeData) return null;

  return (
    <div className="mt-4 border-t pt-4">
      <APAPreview
        resumeData={resumeData.content || resumeData}
        fileName={isUser ? "Your Resume" : "Edited Resume"}
        defaultExpanded={false}
        documentId={documentId}
      />
    </div>
  );
}