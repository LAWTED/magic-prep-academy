"use client";

import { createClient } from "@/utils/supabase/client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserXP, UserHearts, Award } from "@/app/types/index";
import { themeConfig } from "@/app/config/themeConfig";
import { motion } from "framer-motion";

export default function AwardsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<any>(null);
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
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/sign-in");
          return;
        }

        // Check if user has a profile
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("auth_id", user.id)
          .single();

        if (userError || !userData || !userData.name) {
          router.push("/onboarding");
          return;
        }

        setProfile(userData);

        // Fetch XP and Hearts data
        const [xpResponse, heartsResponse, awardsResponse, userAwardsResponse] =
          await Promise.all([
            supabase
              .from("user_xp")
              .select("*")
              .eq("user_id", userData.id)
              .single(),

            supabase
              .from("user_hearts")
              .select("*")
              .eq("user_id", userData.id)
              .single(),

            supabase.from("awards").select("*"),

            supabase.from("user_awards").select("*").eq("user_id", userData.id),
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

        if (userAwardsResponse.data) {
          setPurchasedAwards(
            userAwardsResponse.data.map((item) => item.award_id)
          );
        }
      } catch (error) {
        console.error("Error loading awards data:", error);
        router.push("/sign-in");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [router, supabase]);

  const purchaseAward = async (awardId: string, price: number) => {
    // Check if user has enough XP
    if (!userXP || userXP.total_xp < price || !profile) {
      // Show insufficient funds message
      return;
    }

    setPurchaseInProgress(awardId);

    try {
      // Begin a transaction
      const { error: updateXpError } = await supabase
        .from("user_xp")
        .update({ total_xp: userXP.total_xp - price })
        .eq("user_id", profile.id);

      if (updateXpError) {
        console.error("Error updating XP:", updateXpError);
        return;
      }

      // Record the award purchase
      const { error: purchaseError } = await supabase
        .from("user_awards")
        .insert({
          user_id: profile.id,
          award_id: awardId,
        });

      if (purchaseError) {
        console.error("Error purchasing award:", purchaseError);
        // If there was an error, revert the XP deduction
        await supabase
          .from("user_xp")
          .update({ total_xp: userXP.total_xp })
          .eq("user_id", profile.id);
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

  // Get avatar path based on profile's avatar_name
  const avatarPath = profile
    ? `/images/avatars/${profile.avatar_name}.png`
    : "";

  if (loading || !profile) {
    return (
      <div className="p-4 space-y-6 overflow-auto">
        <div className="flex items-center justify-center h-[calc(100vh-180px)]">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 overflow-auto">
      <h2 className="text-xl font-medium">Magic Awards</h2>
      <p className="text-sm text-muted-foreground">
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
                className="bg-white rounded-xl shadow-sm overflow-hidden border"
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
                  <h3 className="font-medium text-sm">{award.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {award.description || "A magical award!"}
                  </p>

                  {isPurchased ? (
                    <div className="flex items-center justify-center w-full bg-green-100 text-green-700 py-2 rounded-md text-sm mt-2">
                      Earned
                    </div>
                  ) : (
                    <button
                      onClick={() => purchaseAward(award.id, award.price)}
                      disabled={!canAfford || isProcessing}
                      className={`flex items-center justify-center w-full py-2 rounded-md text-sm mt-2 ${
                        canAfford
                          ? "bg-primary text-white active:scale-[0.98]"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {isProcessing ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
          <h2 className="text-xl font-medium mt-8">Achievement Awards</h2>
          <p className="text-sm text-muted-foreground">
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
                    className={`bg-white rounded-xl shadow-sm overflow-hidden border ${!isPurchased ? "opacity-50" : ""}`}
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
                      <h3 className="font-medium text-sm">{award.name}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {award.description || "A special achievement!"}
                      </p>

                      {isPurchased ? (
                        <div className="flex items-center justify-center w-full bg-green-100 text-green-700 py-2 rounded-md text-sm mt-2">
                          Earned
                        </div>
                      ) : (
                        <div className="flex items-center justify-center w-full bg-gray-100 text-gray-500 py-2 rounded-md text-sm mt-2">
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
