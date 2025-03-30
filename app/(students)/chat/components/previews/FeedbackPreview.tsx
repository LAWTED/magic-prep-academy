"use client";

import { FileText, MessageSquare, ExternalLink, MessageCircle, Lightbulb } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface FeedbackPreviewProps {
  sopId: string;
  documentName: string;
  feedbackCount: number;
  mentorName: string;
  commentsCount: number;
  suggestionsCount: number;
}

export default function FeedbackPreview({
  sopId,
  documentName,
  feedbackCount,
  mentorName,
  commentsCount,
  suggestionsCount,
}: FeedbackPreviewProps) {
  return (
    <div className="mt-4 border-t pt-4 border-bronze/20">
      <div className="bg-sand rounded-lg p-4 border border-bronze/20 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <FileText size={18} className="text-skyblue mr-2" />
            <h3 className="text-black font-medium">{mentorName} revised your SOP</h3>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2">
            <MessageCircle size={14} className="text-bronze" />
            <span className="text-sm text-bronze">
              {commentsCount} comment{commentsCount > 1 ? 's' : ''} added
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Lightbulb size={14} className="text-bronze" />
            <span className="text-sm text-bronze">
              {suggestionsCount} suggestion{suggestionsCount > 1 ? 's' : ''} added
            </span>
          </div>
        </div>

        <p className="text-xs text-bronze/70 mb-3">
          Document: {documentName}
        </p>

        <Link href={`/tools/sop/${sopId}`} className="block w-full">
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="w-full py-2 rounded-lg font-medium bg-skyblue text-white text-sm flex items-center justify-center"
          >
            <ExternalLink size={14} className="mr-1" />
            View Feedback
          </motion.button>
        </Link>
      </div>
    </div>
  );
}