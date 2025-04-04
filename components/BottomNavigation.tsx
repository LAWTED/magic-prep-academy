"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Award,
  BookOpen,
  User,
  BookCheck,
  School,
  Wrench,
  MessageCircle,
  Calendar,
} from "lucide-react";
import { motion } from "framer-motion";
import { useKeyboardVisible } from "@/hooks/useKeyboardVisible";

export default function BottomNavigation() {
  const pathname = usePathname();
  const isKeyboardVisible = useKeyboardVisible();

  // Hide bottom navigation when keyboard is visible
  if (isKeyboardVisible) {
    return null;
  }

  const navItems = [
    {
      name: "Learn",
      href: "/homepage",
      icon: BookCheck,
    },
    {
      name: "School",
      href: "/school",
      icon: School,
    },
    {
      name: "Chat",
      href: "/chat",
      icon: MessageCircle,
    },
    {
      name: "Calendar",
      href: "/cal",
      icon: Calendar,
    },
    {
      name: "Tools",
      href: "/tools",
      icon: Wrench,
    },
  ];

  return (
    <div className="bg-sand border-t border-bronze/30 px-2 py-1 flex justify-around items-center">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href || pathname?.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex flex-col items-center justify-center py-2 px-4 rounded-lg ${
              isActive ? "text-bronze" : "text-black"
            }`}
          >
            <motion.div
              whileTap={{ scale: 0.9 }}
              className={`flex items-center justify-center ${isActive ? "text-bronze" : "text-black"}`}
            >
              <item.icon
                size={24}
                className={isActive ? "text-bronze" : "text-black"}
              />
            </motion.div>
            <span className={`text-xs mt-1 ${isActive ? "text-bronze font-medium" : "text-black"}`}>{item.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
