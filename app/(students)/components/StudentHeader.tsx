"use client";

import { createClient } from "@/utils/supabase/client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserXP, UserHearts } from "@/app/types/index";
import { themeConfig } from "@/app/config/themeConfig";
import { motion } from "framer-motion";
import { useUserStore } from "@/store/userStore";

export default function StudentHeader() {
  const router = useRouter();
  const supabase = createClient();
  const { user, isLoading: userLoading } = useUserStore();
  const [userXP, setUserXP] = useState<UserXP | null>(null);
  const [userHearts, setUserHearts] = useState<UserHearts | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserResources() {
      if (!user) return;

      try {
        setLoading(true);

        // Fetch XP and Hearts data
        const [xpResponse, heartsResponse] = await Promise.all([
          supabase.from("user_xp").select("*").eq("user_id", user.id).single(),

          supabase
            .from("user_hearts")
            .select("*")
            .eq("user_id", user.id)
            .single(),
        ]);

        if (xpResponse.data) {
          setUserXP(xpResponse.data);
        }

        if (heartsResponse.data) {
          setUserHearts(heartsResponse.data);
        }
      } catch (error) {
        console.error("Error loading user resources:", error);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchUserResources();
    }
  }, [user, supabase]);

  // Get avatar path based on user's avatar_name
  const avatarPath = user ? `/images/avatars/${user.avatar_name}.png` : "";

  const navigateToProfile = () => {
    router.push("/profile");
  };

  const isDataLoading = userLoading || loading;

  return (
    <header className="w-full shadow-md rounded-b-lg">
      <div className="mx-auto w-full max-w-screen-md px-4 py-4 flex items-center justify-between bg-gold">
        {isDataLoading || !user ? (
          <>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 animate-pulse flex-shrink-0 bg-sand"></div>
              <div className="w-24 h-6 bg-gray-200 animate-pulse rounded-xl bg-sand"></div>
            </div>
            <div className="flex gap-2">
              <div className="w-16 h-8 bg-gray-200 animate-pulse rounded-xl bg-sand"></div>
              <div className="w-16 h-8 bg-gray-200 animate-pulse rounded-xl bg-sand"></div>
            </div>
          </>
        ) : (
          <>
            {/* Avatar and Name - Clickable */}
            <motion.div
              className="flex items-center gap-3 cursor-pointer"
              onClick={navigateToProfile}
              whileTap={{ scale: 0.97 }}
            >
              <div className="relative w-10 h-10 rounded-full overflow-hidden border-4 border-sand flex-shrink-0 shadow-md">
                <Image
                  src={avatarPath}
                  alt={user.name}
                  fill
                  className="object-cover"
                />
              </div>
              {/* Name */}
              <p className="text-lg font-bold text-bronze">{user.name}</p>
            </motion.div>

            {/* XP and Hearts on right side */}
            <div className="flex items-center gap-2">
              {/* XP as money */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push("/awards")}
                className="flex items-center gap-2 bg-sand px-3 py-1.5 rounded-xl  transition-colors active:bg-white/80 shadow-sm"
              >
                {themeConfig.xpReward(userXP?.total_xp || 0)}
              </motion.button>
              {/* Hearts */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push("/pay")}
                className="flex items-center gap-2 bg-sand px-3 py-1.5 rounded-xl  transition-colors active:bg-white/80 shadow-sm"
              >
                {themeConfig.hearts(userHearts?.current_hearts || 0)}
              </motion.button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
