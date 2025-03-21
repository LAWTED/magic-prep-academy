"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function PHSPage() {
  return (
    <div className="p-4">
      <div className="flex items-center mb-6">
        <Link href="/tools">
          <motion.div
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100"
          >
            <ArrowLeft size={20} />
          </motion.div>
        </Link>
        <h1 className="ml-3 text-2xl font-bold">Personal History Statement</h1>
      </div>

      <div className="rounded-xl bg-amber-50 p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Coming Soon!</h2>
        <p className="text-gray-700">
          The Personal History Statement tool will help you craft your personal
          narrative and experiences for your college applications.
        </p>
      </div>
    </div>
  );
}