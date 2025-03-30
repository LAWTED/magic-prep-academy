"use client";

import { createClient } from "@/utils/supabase/client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserXP, UserHearts, Award } from "@/app/types/index";
import { themeConfig } from "@/app/config/themeConfig";
import { motion } from "framer-motion";
import { useUserStore } from "@/store/userStore";

export default function AwardsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { user, isLoading: userLoading } = useUserStore();
  const [userXP, setUserXP] = useState<UserXP | null>(null);
  const [userHearts, setUserHearts] = useState<UserHearts | null>(null);
  const [loading, setLoading] = useState(true);
  const [awards, setAwards] = useState<Award[]>([]);
  const [purchasedAwards, setPurchasedAwards] = useState<string[]>([]);
  const [purchaseInProgress, setPurchaseInProgress] = useState<string | null>(
    null
  );

  useEffect(() => {
    async function fetchData() {
      try {
        if (!user) return;

        // Fetch XP and Hearts data
        const [xpResponse, heartsResponse, awardsResponse, purchasedResponse] =
          await Promise.all([
            supabase
              .from("user_xp")
              .select("*")
              .eq("user_id", user.id)
              .single(),

            supabase
              .from("user_hearts")
              .select("*")
              .eq("user_id", user.id)
              .single(),

            // Get available awards
            supabase.from("awards").select("*").order("price"),

            // Get purchased awards
            supabase
              .from("user_awards")
              .select("award_id")
              .eq("user_id", user.id),
          ]);

        if (xpResponse.data) {
          setUserXP(xpResponse.data);
        }

        if (heartsResponse.data) {
          setUserHearts(heartsResponse.data);
        }

        if (awardsResponse.data) {
          setAwards(awardsResponse.data);
        }

        if (purchasedResponse.data) {
          const purchased = purchasedResponse.data.map((item) => item.award_id);
          setPurchasedAwards(purchased);
        }
      } catch (error) {
        console.error("Error loading awards data:", error);
      } finally {
        setLoading(false);
      }
    }

    if (!userLoading) {
      fetchData();
    }
  }, [user, supabase, userLoading]);

  const purchaseAward = async (awardId: string, price: number) => {
    // Check if user has enough XP
    if (!userXP || userXP.total_xp < price || !user) {
      // Show insufficient funds message
      return;
    }

    setPurchaseInProgress(awardId);

    try {
      // Begin a transaction
      const { error: updateXpError } = await supabase
        .from("user_xp")
        .update({ total_xp: userXP.total_xp - price })
        .eq("user_id", user.id);

      if (updateXpError) {
        console.error("Error updating XP:", updateXpError);
        return;
      }

      // Record the award purchase
      const { error: purchaseError } = await supabase
        .from("user_awards")
        .insert({
          user_id: user.id,
          award_id: awardId,
        });

      if (purchaseError) {
        console.error("Error purchasing award:", purchaseError);
        // If there was an error, revert the XP deduction
        await supabase
          .from("user_xp")
          .update({ total_xp: userXP.total_xp })
          .eq("user_id", user.id);
        return;
      }

      // Update local state
      if (userXP) {
        setUserXP({
          ...userXP,
          total_xp: userXP.total_xp - price,
        });
      }

      setPurchasedAwards([...purchasedAwards, awardId]);
    } catch (error) {
      console.error("Error purchasing award:", error);
    } finally {
      setPurchaseInProgress(null);
    }
  };

  // Get avatar path based on user's avatar_name
  const avatarPath = user ? `/images/avatars/${user.avatar_name}.png` : "";

  if (loading || !user) {
    return (
      <div className="p-4 space-y-6 overflow-auto bg-yellow">
        <div className="flex items-center justify-center h-[calc(100vh-180px)]">
          <p className="text-bronze">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 overflow-auto pb-20 bg-yellow">
      <h2 className="text-2xl font-bold text-bronze">Magic Awards</h2>
      <p className="text-sm text-bronze/70">
        Spend your XP to unlock magical badges and items!
      </p>

      <div className="grid grid-cols-2 gap-4">
        {awards
          .filter((award) => award.is_purchasable)
          .map((award) => {
            const isPurchased = purchasedAwards.includes(award.id);
            const canAfford = (userXP?.total_xp || 0) >= award.price;
            const isProcessing = purchaseInProgress === award.id;

            return (
              <motion.div
                key={award.id}
                className="bg-sand backdrop-blur-sm rounded-xl shadow-md overflow-hidden border border-bronze/20"
                whileTap={{ scale: 0.98 }}
              >
                <div className="aspect-square relative">
                  <Image
                    src={award.image_path}
                    alt={award.name}
                    fill
                    className="object-contain p-4"
                  />
                </div>
                <div className="p-3 space-y-2">
                  <h3 className="font-bold text-sm text-bronze">
                    {award.name}
                  </h3>
                  <p className="text-xs text-black/70 line-clamp-2">
                    {award.description || "A magical award!"}
                  </p>

                  {isPurchased ? (
                    <div className="flex items-center justify-center w-full bg-bronze/20 text-bronze font-medium py-2 rounded-md text-sm mt-2">
                      Earned
                    </div>
                  ) : (
                    <button
                      onClick={() => purchaseAward(award.id, award.price)}
                      disabled={!canAfford || isProcessing}
                      className={`flex items-center justify-center w-full py-2 rounded-md text-sm mt-2 transition-all ${
                        canAfford
                          ? "bg-lime text-bronze active:scale-[0.98] "
                          : "bg-cement/20 text-cement cursor-not-allowed"
                      }`}
                    >
                      {isProcessing ? (
                        <div className="w-5 h-5 border-2 border-sand border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>{themeConfig.xpReward(award.price)}</>
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
      </div>

      {awards.filter((award) => !award.is_purchasable).length > 0 && (
        <>
          <h2 className="text-2xl font-bold text-bronze mt-8">
            Achievement Awards
          </h2>
          <p className="text-sm text-bronze/70">
            Special awards earned through gameplay achievements!
          </p>

          <div className="grid grid-cols-2 gap-4">
            {awards
              .filter((award) => !award.is_purchasable)
              .map((award) => {
                const isPurchased = purchasedAwards.includes(award.id);

                return (
                  <div
                    key={award.id}
                    className={`bg-sand backdrop-blur-sm rounded-xl shadow-md overflow-hidden border border-bronze/20 ${!isPurchased ? "opacity-50" : ""}`}
                  >
                    <div className="aspect-square relative">
                      <Image
                        src={award.image_path}
                        alt={award.name}
                        fill
                        className="object-contain p-4"
                      />
                    </div>
                    <div className="p-3 space-y-2">
                      <h3 className="font-bold text-sm text-bronze">
                        {award.name}
                      </h3>
                      <p className="text-xs text-black/70 line-clamp-2">
                        {award.description || "A special achievement!"}
                      </p>

                      {isPurchased ? (
                        <div className="flex items-center justify-center w-full bg-bronze/20 text-bronze font-medium py-2 rounded-md text-sm mt-2">
                          Earned
                        </div>
                      ) : (
                        <div className="flex items-center justify-center w-full bg-cement/20 text-cement py-2 rounded-md text-sm mt-2">
                          Locked
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </>
      )}
    </div>
  );
}
