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
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeItem, setActiveItem] = useState<number | null>(null);

  const checkEligibility = async () => {
    if (isLoading || !user) return;

    try {
      setIsLoading(true);
      setResults(null);
      setIsExpanded(false);
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
        setIsExpanded(true);

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <div className="bg-white border border-primary/20 rounded-xl p-4 md:p-5 shadow-md">
      {!isExpanded ? (
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={checkEligibility}
          disabled={isLoading}
          className="w-full flex flex-col md:flex-row items-center gap-4 md:justify-between p-2"
        >
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 h-14 w-14 rounded-full flex items-center justify-center">
              <ClipboardCheck className="h-7 w-7 text-primary" />
            </div>
            <div className="text-center md:text-left">
              <h3 className="font-bold text-primary text-lg">
                Check Your Eligibility
              </h3>
              <p className="text-sm text-gray-600">
                See if you meet the program requirements
              </p>
            </div>
          </div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className={`px-6 py-3 rounded-full text-base font-medium shadow-sm ${
              isLoading ? "bg-gray-300 text-gray-600" : "bg-primary text-white"
            }`}
          >
            {isLoading ? "Checking..." : "Check Now"}
          </motion.div>
        </motion.button>
      ) : (
        <div>
          <div className="mb-5 text-center md:text-left">
            <h3 className="font-bold text-primary text-lg">
              Eligibility Results
            </h3>
            <p className="text-sm text-gray-600">
              Based on your academic profile for this program
            </p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {results?.map((result, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className={`border rounded-xl overflow-hidden ${getStatusColor(result.status)}`}
              >
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => toggleItem(index)}
                  className="w-full flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-white shadow-sm">
                      {getStatusIcon(result.status)}
                    </div>
                    <h5 className="font-medium">{result.label}</h5>
                  </div>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-white shadow-sm">
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
          </motion.div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setIsExpanded(false);
              setResults(null);
            }}
            className="mt-6 w-full py-3 text-center text-primary font-medium rounded-xl border border-primary/20 hover:bg-primary/5"
          >
            Check Again
          </motion.button>
        </div>
      )}
    </div>
  );
}
