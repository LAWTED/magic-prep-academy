"use client";

import { createClient } from "@/utils/supabase/client";
import Image from "next/image";
import { Cog } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserXP, UserHearts } from "@/app/types/index";
import { themeConfig } from "@/app/config/themeConfig";
import { motion } from "framer-motion";

export default function StudentHeader() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<any>(null);
  const [userXP, setUserXP] = useState<UserXP | null>(null);
  const [userHearts, setUserHearts] = useState<UserHearts | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserData() {
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
        const [xpResponse, heartsResponse] = await Promise.all([
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
        ]);

        if (xpResponse.data) {
          setUserXP(xpResponse.data);
        }

        if (heartsResponse.data) {
          setUserHearts(heartsResponse.data);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        router.push("/sign-in");
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [router, supabase]);

  // Get avatar path based on profile's avatar_name
  const avatarPath = profile
    ? `/images/avatars/${profile.avatar_name}.png`
    : "";

  const navigateToProfile = () => {
    router.push("/profile");
  };

  return (
    <header className="w-screen border-b bg-background">
      <div className="mx-auto w-full max-w-screen-md px-4 py-4 flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {loading || !profile ? (
            <>
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 animate-pulse flex-shrink-0"></div>
              <div className="w-24 h-6 bg-gray-200 animate-pulse rounded"></div>
              <div className="w-16 h-8 bg-gray-200 animate-pulse rounded-xl"></div>
              <div className="w-16 h-8 bg-gray-200 animate-pulse rounded-xl"></div>
            </>
          ) : (
            <>
              {/* Avatar and Name - Clickable */}
              <motion.div
                className="flex items-center gap-3 cursor-pointer"
                onClick={navigateToProfile}
                whileTap={{ scale: 0.97 }}
              >
                <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-primary flex-shrink-0">
                  <Image
                    src={avatarPath}
                    alt={profile.name}
                    fill
                    className="object-cover"
                  />
                </div>
                {/* Name */}
                <p className="text-lg font-bold">{profile.name}</p>
              </motion.div>

              {/* XP as money */}
              <div className="flex items-center gap-2 bg-white/90 px-3 py-1.5 rounded-xl">
                {themeConfig.xpReward(userXP?.total_xp || 0)}
              </div>
              {/* Hearts */}
              <div className="flex items-center gap-2 bg-white/90 px-3 py-1.5 rounded-xl">
                {themeConfig.hearts(userHearts?.current_hearts || 0)}
              </div>
            </>
          )}
        </div>

        {/* Settings (disabled) */}
        <button
          className="text-gray-400 cursor-not-allowed flex-shrink-0"
          disabled
        >
          <Cog size={22} />
        </button>
      </div>
    </header>
  );
}
