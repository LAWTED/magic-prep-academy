"use client";

import { ArrowLeft, FileCode } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function PHSPage() {
  return (
    <div className="p-4 bg-yellow">
      <div className="flex items-center mb-6">
        <Link href="/tools">
          <motion.div
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 flex items-center justify-center rounded-full text-bronze"
          >
            <ArrowLeft size={20} />
          </motion.div>
        </Link>
        <h2 className="ml-3 text-2xl font-bold text-bronze">Personal History Statement</h2>
      </div>

      <div className="rounded-xl bg-sand p-6 shadow-sm border border-bronze/20">
        <h2 className="text-xl font-semibold mb-4 text-bronze">Coming Soon!</h2>
        <p className="text-black">
          The Personal History Statement tool will help you craft your personal
          narrative and experiences for your college applications.
        </p>
      </div>
    </div>
  );
}