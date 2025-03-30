"use client";

import { ArrowLeft, Heart, Infinity, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { useUserStore } from "@/store/userStore";
import { useState } from "react";
import { toast } from "sonner";

export default function PayPage() {
  const router = useRouter();
  const supabase = createClient();
  const { user } = useUserStore();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const addHearts = async () => {
    if (!user || isPurchasing || isCompleted) return;

    try {
      setIsPurchasing(true);

      // Get current hearts
      const { data: heartsData, error: heartsError } = await supabase
        .from("user_hearts")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (heartsError) {
        console.error("Error fetching hearts:", heartsError);
        toast.error("Failed to get hearts data");
        return;
      }

      // Update hearts with +500
      const { error: updateError } = await supabase
        .from("user_hearts")
        .update({
          current_hearts: heartsData.current_hearts + 500,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Error updating hearts:", updateError);
        toast.error("Failed to add hearts");
        return;
      }

      setIsCompleted(true);
      toast.success("Added 500 hearts to your account!");

      // Return to previous page after 2 seconds
      setTimeout(() => {
        router.back();
      }, 2000);

    } catch (error) {
      console.error("Error in purchase process:", error);
      toast.error("Something went wrong");
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div className="p-4 max-w-screen-md mx-auto bg-yellow">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center text-bronze mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </button>
        <h1 className="text-2xl font-bold text-bronze">Get Free Hearts</h1>
        <p className="text-bronze/70 mt-2">Boost your learning with extra hearts</p>
      </div>

      {/* Hearts Card */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={addHearts}
        disabled={isPurchasing || isCompleted || !user}
        className={`w-full bg-sand backdrop-blur-sm p-6 rounded-xl border border-bronze/20 shadow-md text-left ${
          isCompleted ? "cursor-default" : isPurchasing ? "cursor-wait" : "cursor-pointer"
        } ${!user ? "opacity-60" : ""}`}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-bronze">500 Hearts Pack</h2>
            <p className="text-gold mt-1">FREE</p>
          </div>
          <div className="flex items-center gap-1 bg-tomato/20 text-tomato px-3 py-1 rounded-full">
            <Heart className="w-4 h-4" fill="currentColor" />
            <span className="font-medium">+500</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-bronze/70">
            <span className="font-medium text-bronze">✨ More Attempts:</span> Try more answers
          </div>
          <div className="text-bronze/70">
            <span className="font-medium text-bronze">🚀 Extended Learning:</span> Complete more lessons
          </div>
          <div className="text-bronze/70">
            <span className="font-medium text-bronze">🎯 Special Offer:</span> Limited time promotion
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          {isPurchasing ? (
            <div className="bg-bronze text-sand py-3 px-6 rounded-full flex items-center gap-2">
              <div className="h-5 w-5 border-2 border-sand border-t-transparent rounded-full animate-spin"></div>
              <span>Processing...</span>
            </div>
          ) : isCompleted ? (
            <div className="bg-bronze text-sand py-3 px-6 rounded-full flex items-center gap-2">
              <Check className="h-5 w-5" />
              <span>Hearts Added!</span>
            </div>
          ) : (
            <div className="bg-bronze text-sand py-3 px-6 rounded-full">
              Get Hearts Now
            </div>
          )}
        </div>
      </motion.button>
    </div>
  );
}