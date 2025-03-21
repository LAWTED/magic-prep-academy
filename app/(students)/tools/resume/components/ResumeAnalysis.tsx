"use client";

import { useState, useEffect } from "react";
import { FileText, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ResumeAnalysisData } from "@/app/types";

type ResumeAnalysisProps = {
  resumeContent: any;
  fileName?: string;
};

export default function ResumeAnalysis({
  resumeContent,
  fileName,
}: ResumeAnalysisProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<ResumeAnalysisData | null>(null);

  useEffect(() => {
    if (resumeContent) {
      analyzeResumeContent(resumeContent);
    }
  }, [resumeContent]);

  const analyzeResumeContent = async (content: any) => {
    if (!content) {
      setError("No resume content available for analysis.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/documentanalyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          type: "resume"
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze resume content");
      }

      const data = await response.json();
      console.log("Analysis response:", data);

      if (data.success) {
        setAnalysisData(data.analysis);
      } else {
        throw new Error(data.error || "Failed to analyze resume");
      }
    } catch (error) {
      console.error("Content analysis error:", error);
      setError(error instanceof Error ? error.message : "Content analysis failed");
      toast.error("Failed to analyze resume");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Analyzing your resume content...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-red-200 bg-red-50 rounded-xl p-6 my-4">
        <div className="flex items-start">
          <AlertCircle className="text-red-600 mr-3 mt-0.5 flex-shrink-0" size={20} />
          <div>
            <h3 className="font-semibold text-red-700 mb-1">Analysis Failed</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!analysisData) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="border rounded-xl p-6">
        <div className="flex items-center mb-4">
          <FileText className="text-blue-600 mr-3" size={24} />
          <div className="flex-1">
            <p className="font-medium">{fileName || "Resume Content Analysis"}</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Overall Score</h3>
            <span className="text-xl font-bold">
              {analysisData.overallScore}/100
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${analysisData.overallScore}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Content</p>
            <div className="flex items-center">
              <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${analysisData.scores.content.score}%` }}
                ></div>
              </div>
              <span className="text-xs font-medium">
                {analysisData.scores.content.score}
              </span>
            </div>
            <p className="text-xs mt-1 text-gray-600">{analysisData.scores.content.feedback}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Quality</p>
            <div className="flex items-center">
              <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full"
                  style={{ width: `${analysisData.scores.quality.score}%` }}
                ></div>
              </div>
              <span className="text-xs font-medium">
                {analysisData.scores.quality.score}
              </span>
            </div>
            <p className="text-xs mt-1 text-gray-600">{analysisData.scores.quality.feedback}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Impact</p>
            <div className="flex items-center">
              <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${analysisData.scores.impact.score}%` }}
                ></div>
              </div>
              <span className="text-xs font-medium">
                {analysisData.scores.impact.score}
              </span>
            </div>
            <p className="text-xs mt-1 text-gray-600">{analysisData.scores.impact.feedback}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Clarity</p>
            <div className="flex items-center">
              <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{ width: `${analysisData.scores.clarity.score}%` }}
                ></div>
              </div>
              <span className="text-xs font-medium">
                {analysisData.scores.clarity.score}
              </span>
            </div>
            <p className="text-xs mt-1 text-gray-600">{analysisData.scores.clarity.feedback}</p>
          </div>
        </div>

        <div className="mt-4 mb-2">
          <h3 className="font-semibold text-sm mb-2">Overall Feedback</h3>
          <p className="text-sm text-gray-700">{analysisData.overallFeedback}</p>
        </div>
      </div>

      {/* Action Steps */}
      <div className="border rounded-xl p-6">
        <h3 className="font-semibold mb-4">Improvement Suggestions</h3>
        <ul className="space-y-3">
          {analysisData.actionableSteps.map((step, index) => (
            <li key={index} className="flex items-start">
              <span className="w-6 h-6 flex items-center justify-center bg-amber-100 text-amber-600 rounded-full shrink-0 mr-3">
                {index + 1}
              </span>
              <p className="text-sm">{step}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}