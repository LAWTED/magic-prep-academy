"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import UploadResume from "../components/UploadResume";

export default function UploadResumePage() {
  // Dummy function since we removed the chat feature
  const handleAskMentor = () => {};

  return (
    <div className="p-4 pb-20">
      <div className="flex items-center mb-6">
        <Link href="/tools/resume">
          <motion.div
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100"
          >
            <ArrowLeft size={20} />
          </motion.div>
        </Link>
        <h1 className="ml-3 text-2xl font-bold">Upload Resume</h1>
      </div>

      <UploadResume onAskMentor={handleAskMentor} />
    </div>
  );
}