"use client";

import { ArrowLeft, Heart, Infinity } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function PayPage() {
  const router = useRouter();

  return (
    <div className="p-4 max-w-screen-md mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center text-primary mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </button>
        <h1 className="text-2xl font-bold">Monthly Membership</h1>
        <p className="text-gray-600 mt-2">Unlock unlimited hearts and boost your learning</p>
      </div>

      {/* Membership Card */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        disabled
        className="w-full bg-white p-6 rounded-xl border border-gray-200 text-left cursor-not-allowed opacity-60"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Monthly VIP</h2>
            <p className="text-primary mt-1">$9.99/month</p>
          </div>
          <div className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full">
            <Heart className="w-4 h-4" />
            <Infinity className="w-4 h-4" />
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-gray-600">
            <span className="font-medium">✨ Unlimited Hearts:</span> Never stop learning
          </div>
          <div className="text-gray-600">
            <span className="font-medium">🚀 Priority Support:</span> Get help when you need it
          </div>
          <div className="text-gray-600">
            <span className="font-medium">🎯 Ad-free Experience:</span> Focus on what matters
          </div>
        </div>
      </motion.button>

      {/* Coming Soon Notice */}
      <div className="mt-8 text-center text-sm text-gray-500">
        Membership feature coming soon
      </div>
    </div>
  );
}