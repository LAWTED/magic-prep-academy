"use client";

import {
  ClipboardCheck,
  Check,
  X,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useUserStore } from "@/store/userStore";

interface CheckStatusCardProps {
  programId: string;
}

interface EligibilityResult {
  label: string;
  status: "met" | "not_met" | "partially_met" | "unknown";
  explain: string;
}

export default function CheckStatusCard({ programId }: CheckStatusCardProps) {
  const { user } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<EligibilityResult[] | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [activeItem, setActiveItem] = useState<number | null>(null);

  const checkEligibility = async () => {
    if (isLoading || !user) return;

    try {
      setIsLoading(true);
      setResults(null);
      setActiveItem(null);

      const response = await fetch("/api/eligibility-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          programId,
          userId: user.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to check eligibility");
      }

      // 检查API响应是否成功
      if (data.success && Array.isArray(data.data)) {
        setResults(data.data);
        setShowResults(true);

        // 短暂延迟后自动展开第一项
        setTimeout(() => {
          setActiveItem(0);
        }, 500);
        return;
      } else {
        // API解析失败
        throw new Error(data.error || "Failed to parse eligibility results");
      }
    } catch (error) {
      console.error("Error checking eligibility:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to check eligibility"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "met":
        return <Check className="h-5 w-5 text-green-600" />;
      case "not_met":
        return <X className="h-5 w-5 text-red-600" />;
      case "partially_met":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case "unknown":
      default:
        return <HelpCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "met":
        return "bg-green-100 text-green-800 border-green-200";
      case "not_met":
        return "bg-red-100 text-red-800 border-red-200";
      case "partially_met":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "unknown":
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "met":
        return "Met";
      case "not_met":
        return "Not Met";
      case "partially_met":
        return "Partially Met";
      case "unknown":
      default:
        return "Unknown";
    }
  };

  const toggleItem = (index: number) => {
    setActiveItem(activeItem === index ? null : index);
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      {/* Show Check Eligibility button when no results are displayed */}
      {!showResults && !isLoading && (
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={checkEligibility}
          className="w-full p-4 text-left flex flex-col"
        >
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-bold text-primary">Eligibility Check</h3>
          </div>
          <p className="text-sm text-gray-600">
            Check if you meet the requirements for this program
          </p>
          <div className="mt-3 self-end px-4 py-2 rounded-full text-sm font-medium bg-primary text-white">
            Check Eligibility
          </div>
        </motion.button>
      )}

      {/* Display loading state */}
      {isLoading && (
        <div className="p-4">
          <div className="flex flex-col items-center py-6">
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin mb-3"></div>
            <p className="text-gray-500 text-sm">
              Checking your eligibility...
            </p>
          </div>
        </div>
      )}

      {/* Display eligibility results */}
      {showResults && results && (
        <div className="p-4">
          <div className="space-y-3">
            {results.map((result, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                className={`border rounded-lg overflow-hidden ${getStatusColor(result.status)}`}
              >
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => toggleItem(index)}
                  className="w-full flex items-center justify-between p-3"
                >
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-white shadow-sm">
                      {getStatusIcon(result.status)}
                    </div>
                    <h5 className="font-medium">{result.label}</h5>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-white shadow-sm">
                    {getStatusText(result.status)}
                  </span>
                </motion.button>

                <AnimatePresence>
                  {activeItem === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t px-4 py-3 bg-white"
                    >
                      <p className="text-sm text-gray-700">{result.explain}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={checkEligibility}
            className="mt-4 w-full px-4 py-2 text-center text-primary font-medium rounded-full border border-primary/20 hover:bg-primary/5"
          >
            Check Again
          </motion.button>
        </div>
      )}
    </div>
  );
}
