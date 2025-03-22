"use client";

import { ArrowLeft, Upload } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import SOPList from "./components/SOPList";

export default function SOPPage() {
  const router = useRouter();

  return (
    <div className="p-4 pb-20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Link href="/tools">
            <motion.div
              whileTap={{ scale: 0.9 }}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100"
            >
              <ArrowLeft size={20} />
            </motion.div>
          </Link>
          <h1 className="ml-3 text-2xl font-bold">Statement of Purpose</h1>
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => router.push("/tools/sop/upload")}
        className="w-full bg-blue-600 text-white rounded-lg py-3 flex items-center justify-center shadow-sm mb-8 mt-4"
      >
        <Upload size={20} className="mr-2" />
        Upload SOP
      </motion.button>

      {/* SOP List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Your SOPs</h2>
        <SOPList />
      </div>
    </div>
  );
}