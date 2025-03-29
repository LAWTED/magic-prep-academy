"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { TextShimmer } from "@/components/ui/text-shimmer";

interface LoadingCardProps {
  message?: string;
  className?: string;
}

export default function LoadingCard({
  message = "Loading...",
  className = ""
}: LoadingCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`h-full w-full flex flex-col items-center justify-center bg-white rounded-xl p-6  ${className}`}
    >
      <div className="relative w-16 h-16 mb-4">
        <Image
          src="/images/loading/loading.gif"
          alt="Loading"
          fill
          priority
          className="object-contain"
        />
      </div>
      {message && (
        <TextShimmer
          className="text-sm font-medium"
          duration={1.5}
        >
          {message}
        </TextShimmer>
      )}
    </motion.div>
  );
}