"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  User,
  Settings,
  Bell,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useUserStore } from "@/store/userStore";
import useFcmToken from "@/hooks/useFcmToken";
import { toast } from "sonner";

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const { user, isLoading } = useUserStore();
  const [loading, setLoading] = useState(true);
  const { token, notificationPermissionStatus } = useFcmToken();
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/sign-in");
    } else if (!isLoading) {
      setLoading(false);
    }
  }, [isLoading, router, user]);

  // 保存FCM token到数据库
  const saveFcmTokenToDb = async () => {
    if (!token || !user?.id) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ fcm_token: token })
        .eq('id', user.id);

      if (error) {
        console.error("Error saving FCM token:", error);
        toast.error("Failed to enable notifications");
        return false;
      }

      toast.success("Notifications enabled successfully");
      return true;
    } catch (err) {
      console.error("Error:", err);
      toast.error("An error occurred");
      return false;
    }
  };

  // 处理通知权限请求
  const handleEnableNotifications = async () => {
    if (notificationPermissionStatus === "granted") {
      // 已有权限，保存token
      await saveFcmTokenToDb();
      setShowNotificationModal(false);
    } else if (notificationPermissionStatus === "denied") {
      // 权限被拒绝，需要在浏览器设置中更改
      toast.error("Please enable notifications in your browser settings");
      setShowNotificationModal(false);
    } else {
      // 请求权限
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        // 重新获取token
        window.location.reload();
      } else {
        toast.error("Notification permission denied");
      }
      setShowNotificationModal(false);
    }
  };

  // Get avatar path based on profile's avatar_name
  const avatarPath = user ? `/images/avatars/${user.avatar_name}.png` : "";

  const profileOptions = [
    {
      name: "Academic Information",
      description: "GPA, test scores, and language proficiency",
      href: "/profile/academic",
      icon: GraduationCap,
      color: "bg-sand/50 text-bronze",
    },
    {
      name: "Personal Information",
      description: "Your profile details and preferences",
      href: "#",
      icon: User,
      color: "bg-sand/50 text-bronze",
      disabled: true,
    },
    {
      name: "Notifications",
      description: "Enable push notifications for messages and updates",
      href: "#",
      icon: Bell,
      color: "bg-sand/50 text-bronze",
      onClick: () => setShowNotificationModal(true),
    },
    {
      name: "Settings",
      description: "Application preferences and account settings",
      href: "#",
      icon: Settings,
      color: "bg-sand/50 text-bronze",
      disabled: true,
    },
  ];

  return (
    <div className="flex-1 flex flex-col w-full mx-auto pb-16 max-w-screen-md bg-yellow min-h-screen">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-bronze/20 w-full">
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => router.push("/homepage")}
            className="focus:outline-none text-bronze"
          >
            <ArrowLeft className="h-6 w-6" />
          </motion.button>
          <h1 className="text-xl font-bold text-bronze">Profile</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 w-full mx-auto">
        {loading ? (
          <div className="space-y-4">
            <div className="h-24 bg-sand/50 animate-pulse rounded-xl"></div>
            <div className="h-16 bg-sand/50 animate-pulse rounded-xl"></div>
            <div className="h-16 bg-sand/50 animate-pulse rounded-xl"></div>
            <div className="h-16 bg-sand/50 animate-pulse rounded-xl"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* User info card */}
            <div className="bg-sand border border-bronze/20 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-gold">
                  <Image
                    src={avatarPath}
                    alt={user?.name || "User"}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-bronze">{user?.name}</h2>
                  <p className="text-bronze/80">
                    {user?.region || "No location set"}
                  </p>
                </div>
              </div>
            </div>

            {/* Profile options */}
            <div className="space-y-4">
              {profileOptions.map((option) => (
                <motion.div
                  key={option.name}
                  whileTap={{ scale: 0.98 }}
                  className="relative"
                >
                  <Link
                    href={option.disabled ? "#" : (option.href || "#")}
                    className={`block bg-sand border border-bronze/20 rounded-xl p-4 shadow-sm ${
                      option.disabled ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    onClick={(e) => {
                      if (option.disabled) {
                        e.preventDefault();
                      } else if (option.onClick) {
                        e.preventDefault();
                        option.onClick();
                      }
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${option.color}`}>
                        <option.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-bronze">{option.name}</h3>
                        <p className="text-sm text-bronze/70">
                          {option.description}
                        </p>
                      </div>
                      {option.disabled && (
                        <span className="text-xs bg-gold/30 text-bronze px-2 py-1 rounded-full">
                          Coming Soon
                        </span>
                      )}
                      {option.name === "Notifications" && notificationPermissionStatus === "granted" && (
                        <span className="text-xs bg-gold/30 text-bronze px-2 py-1 rounded-full">
                          Enabled
                        </span>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Notification Modal */}
      {showNotificationModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-sand rounded-xl p-6 max-w-md w-full border border-bronze/20">
            <h3 className="text-xl font-bold mb-4 text-bronze">Enable Notifications</h3>
            <p className="mb-4 text-bronze/80">
              Get notified about new messages, updates, and reminders from your mentors.
            </p>
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={() => setShowNotificationModal(false)}
                className="px-4 py-2 rounded-lg border border-bronze/30 text-bronze"
              >
                Cancel
              </button>
              <button
                onClick={handleEnableNotifications}
                className="px-4 py-2 bg-gold/70 text-bronze rounded-lg"
              >
                Enable
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
