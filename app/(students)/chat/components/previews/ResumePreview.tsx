"use client";

import APAPreview from "../../../tools/resume/components/APAPreview";

interface ResumePreviewProps {
  resumeData: any;
  documentId?: string | null;
}

export default function ResumePreview({
  resumeData,
  documentId = null
}: ResumePreviewProps) {
  if (!resumeData) return null;

  return (
    <div className="mt-4 border-t pt-4 border-bronze">
      <APAPreview
        resumeData={resumeData.content || resumeData}
        fileName={"Resume"}
        defaultExpanded={false}
        documentId={documentId}
      />
    </div>
  );
}