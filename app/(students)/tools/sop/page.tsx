"use client";

import { ArrowLeft, Upload, BookOpen } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import SOPList from "./components/SOPList";

export default function SOPPage() {
  const router = useRouter();

  return (
    <div className="p-4 pb-20 bg-yellow">
      <div className="flex items-center mb-6">
        <Link href="/tools">
          <motion.div
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 flex items-center justify-center rounded-full text-bronze"
          >
            <ArrowLeft size={20} />
          </motion.div>
        </Link>
        <h2 className="ml-3 text-2xl font-bold text-bronze">Statement of Purpose</h2>
      </div>

      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => router.push("/tools/sop/upload")}
        className="w-full bg-gold text-bronze rounded-lg py-3 flex items-center justify-center shadow-sm mb-8 mt-4"
      >
        <Upload size={20} className="mr-2" />
        Upload SOP
      </motion.button>

      {/* SOP List */}
      <div className="bg-sand rounded-xl p-4 shadow-sm border border-bronze/20">
        <h2 className="text-xl font-semibold mb-4 text-bronze">Your SOPs</h2>
        <SOPList />
      </div>
    </div>
  );
}