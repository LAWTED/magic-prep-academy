"use client";

import BottomNavigation from "@/components/BottomNavigation";
import { usePathname } from "next/navigation";

export default function StudentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Check if the current path is one that should have the bottom navigation
  const shouldShowNavigation = pathname === "/homepage" || pathname === "/awards";

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <main className="flex-1 pb-16">{children}</main>
      {shouldShowNavigation && <BottomNavigation />}
    </div>
  );
}