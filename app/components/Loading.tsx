"use client";

import { motion } from "framer-motion";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 0, 360],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent"
      />
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  );
}