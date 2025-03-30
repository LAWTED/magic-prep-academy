"use client";

import { useState, useEffect } from "react";
import { FileText, AlertCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { SOPAnalysisData } from "@/app/types";
import LoadingCard from "@/app/components/LoadingCard";

type SOPAnalysisProps = {
  sopContent: string;
  fileName?: string;
};

export default function SOPAnalysis({
  sopContent,
  fileName,
}: SOPAnalysisProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<SOPAnalysisData | null>(null);

  useEffect(() => {
    if (sopContent) {
      analyzeSOPContent(sopContent);
    }
  }, [sopContent]);

  const analyzeSOPContent = async (content: string) => {
    if (!content) {
      setError("No SOP content available for analysis.");
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
          type: "sop"
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze SOP");
      }

      const data = await response.json();

      if (data.success && data.analysis) {
        setAnalysisData(data.analysis);
      } else {
        throw new Error(data.error || "Failed to analyze SOP content");
      }
    } catch (error) {
      console.error("Analysis error:", error);
      setError(error instanceof Error ? error.message : "Analysis failed");
      toast.error("Failed to analyze SOP");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="border border-bronze/20 bg-sand rounded-xl p-6 shadow-sm">
        <div className="flex items-center mb-4">
          <FileText className="text-bronze mr-3" size={24} />
          <div className="flex-1">
            <p className="font-medium text-bronze">{fileName || "Statement of Purpose Analysis"}</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-8">
          <LoadingCard message="Analyzing your Statement of Purpose..." />
          <p className="text-black/70 text-sm mt-2">
            This may take a minute to complete
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-bronze/20 bg-sand rounded-xl p-6 my-4">
        <div className="flex items-start">
          <AlertCircle className="text-bronze mr-3 mt-0.5 flex-shrink-0" size={20} />
          <div>
            <h3 className="font-semibold text-bronze mb-1">Analysis Failed</h3>
            <p className="text-sm text-black">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!analysisData) {
    return (
      <div className="border border-bronze/20 bg-sand rounded-xl p-6 shadow-sm">
        <div className="flex items-center mb-4">
          <FileText className="text-bronze mr-3" size={24} />
          <div className="flex-1">
            <p className="font-medium text-bronze">Statement of Purpose Analysis</p>
          </div>
        </div>
        <div className="py-6 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-gold/30 rounded-full flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-bronze" />
          </div>
          <h3 className="text-lg font-medium text-bronze mb-2">SOP Analysis</h3>
          <p className="text-black mb-4 max-w-md">
            Your Statement of Purpose will be analyzed for clarity, motivation, relevance, and writing quality.
          </p>
          <p className="text-xs text-bronze/70">Analysis will begin automatically once content is loaded</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border border-bronze/20 bg-sand rounded-xl p-6">
        <div className="flex items-center mb-4">
          <FileText className="text-bronze mr-3" size={24} />
          <div className="flex-1">
            <p className="font-medium text-bronze">{fileName || "Statement of Purpose Analysis"}</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-bronze">Overall Score</h3>
            <span className="text-xl font-bold text-bronze">
              {analysisData.overallScore}/100
            </span>
          </div>
          <div className="w-full bg-bronze/10 rounded-full h-2.5">
            <div
              className="bg-bronze h-2.5 rounded-full"
              style={{ width: `${analysisData.overallScore}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-bronze mb-1">Clarity</p>
            <div className="flex items-center">
              <div className="w-full bg-bronze/10 rounded-full h-2 mr-2">
                <div
                  className="bg-gold h-2 rounded-full"
                  style={{ width: `${analysisData.scores.clarity.score}%` }}
                ></div>
              </div>
              <span className="text-xs font-medium text-bronze">
                {analysisData.scores.clarity.score}
              </span>
            </div>
            <p className="text-xs mt-1 text-black">{analysisData.scores.clarity.feedback}</p>
          </div>
          <div>
            <p className="text-sm text-bronze mb-1">Motivation</p>
            <div className="flex items-center">
              <div className="w-full bg-bronze/10 rounded-full h-2 mr-2">
                <div
                  className="bg-gold h-2 rounded-full"
                  style={{ width: `${analysisData.scores.motivation.score}%` }}
                ></div>
              </div>
              <span className="text-xs font-medium text-bronze">
                {analysisData.scores.motivation.score}
              </span>
            </div>
            <p className="text-xs mt-1 text-black">{analysisData.scores.motivation.feedback}</p>
          </div>
          <div>
            <p className="text-sm text-bronze mb-1">Relevance</p>
            <div className="flex items-center">
              <div className="w-full bg-bronze/10 rounded-full h-2 mr-2">
                <div
                  className="bg-gold h-2 rounded-full"
                  style={{ width: `${analysisData.scores.relevance.score}%` }}
                ></div>
              </div>
              <span className="text-xs font-medium text-bronze">
                {analysisData.scores.relevance.score}
              </span>
            </div>
            <p className="text-xs mt-1 text-black">{analysisData.scores.relevance.feedback}</p>
          </div>
          <div>
            <p className="text-sm text-bronze mb-1">Writing</p>
            <div className="flex items-center">
              <div className="w-full bg-bronze/10 rounded-full h-2 mr-2">
                <div
                  className="bg-gold h-2 rounded-full"
                  style={{ width: `${analysisData.scores.writing.score}%` }}
                ></div>
              </div>
              <span className="text-xs font-medium text-bronze">
                {analysisData.scores.writing.score}
              </span>
            </div>
            <p className="text-xs mt-1 text-black">{analysisData.scores.writing.feedback}</p>
          </div>
        </div>

        <div className="mt-4 mb-2">
          <h3 className="font-semibold text-sm text-bronze mb-2">Overall Feedback</h3>
          <p className="text-sm text-black">{analysisData.overallFeedback}</p>
        </div>
      </div>

      {/* Action Steps */}
      <div className="border border-bronze/20 bg-sand rounded-xl p-6">
        <h3 className="font-semibold text-bronze mb-4">Improvement Suggestions</h3>
        <ul className="space-y-3">
          {analysisData.actionableSteps.map((step, index) => (
            <li key={index} className="flex items-start">
              <span className="w-6 h-6 flex items-center justify-center bg-gold/50 text-bronze rounded-full shrink-0 mr-3">
                {index + 1}
              </span>
              <p className="text-sm text-black">{step}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}