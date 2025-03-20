"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Award, BookOpen, User } from "lucide-react";
import { motion } from "framer-motion";

export default function BottomNavigation() {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Awards",
      href: "/awards",
      icon: Award,
    },
    {
      name: "Learn",
      href: "/homepage",
      icon: Home,
    },
    // {
    //   name: "Prepare",
    //   href: "/prepare",
    //   icon: BookOpen,
    // },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-1 safe-bottom flex justify-around items-center">
      {navItems.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex flex-col items-center justify-center py-2 px-4 rounded-lg ${
              isActive ? "text-primary" : "text-gray-500"
            }`}
          >
            <motion.div
              whileTap={{ scale: 0.9 }}
              className={`flex items-center justify-center ${isActive ? "text-primary" : "text-gray-500"}`}
            >
              <item.icon
                size={24}
                className={isActive ? "text-primary" : "text-gray-500"}
              />
            </motion.div>
            <span className="text-xs mt-1">{item.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
