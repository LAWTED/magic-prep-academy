"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  User,
  Settings,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useUserStore } from "@/store/userStore";

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const { user, isLoading } = useUserStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/sign-in");
    } else if (!isLoading) {
      setLoading(false);
    }
  }, [isLoading, router, user]);

  // Get avatar path based on profile's avatar_name
  const avatarPath = user ? `/images/avatars/${user.avatar_name}.png` : "";

  const profileOptions = [
    {
      name: "Academic Information",
      description: "GPA, test scores, and language proficiency",
      href: "/profile/academic",
      icon: GraduationCap,
      color: "bg-blue-100 text-blue-600",
    },
    {
      name: "Personal Information",
      description: "Your profile details and preferences",
      href: "#",
      icon: User,
      color: "bg-green-100 text-green-600",
      disabled: true,
    },
    {
      name: "Settings",
      description: "Application preferences and account settings",
      href: "#",
      icon: Settings,
      color: "bg-purple-100 text-purple-600",
      disabled: true,
    },
  ];

  return (
    <div className="flex-1 flex flex-col w-full mx-auto pb-16 max-w-screen-md">
      {/* Header */}
      <header className="bg-background flex items-center justify-between p-4 border-b w-full">
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => router.push("/homepage")}
            className="focus:outline-none"
          >
            <ArrowLeft className="h-6 w-6" />
          </motion.button>
          <h1 className="text-xl font-bold">Profile</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 w-full mx-auto">
        {loading ? (
          <div className="space-y-4">
            <div className="h-24 bg-gray-200 animate-pulse rounded-xl"></div>
            <div className="h-16 bg-gray-200 animate-pulse rounded-xl"></div>
            <div className="h-16 bg-gray-200 animate-pulse rounded-xl"></div>
            <div className="h-16 bg-gray-200 animate-pulse rounded-xl"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* User info card */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-primary">
                  <Image
                    src={avatarPath}
                    alt={user?.name || "User"}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{user?.name}</h2>
                  <p className="text-gray-600">
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
                    href={option.disabled ? "#" : option.href}
                    className={`block bg-white rounded-xl p-4 shadow-sm ${
                      option.disabled ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    onClick={(e) => {
                      if (option.disabled) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${option.color}`}>
                        <option.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{option.name}</h3>
                        <p className="text-sm text-gray-500">
                          {option.description}
                        </p>
                      </div>
                      {option.disabled && (
                        <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">
                          Coming Soon
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
    </div>
  );
}
