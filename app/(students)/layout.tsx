"use client";

import BottomNavigation from "@/components/BottomNavigation";
import StudentHeader from "@/app/components/StudentHeader";
import { usePathname } from "next/navigation";

export default function StudentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Check if the current path is one that should have the bottom navigation
  const shouldShowNavigation = pathname === "/homepage" || pathname === "/awards";

  // Check if the current path should have the header
  const shouldShowHeader = pathname !== "/onboarding";

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      {shouldShowHeader && <StudentHeader />}
      <main className="flex-1 flex flex-col w-full max-w-screen-md mx-auto pb-16">
        {children}
      </main>
      {shouldShowNavigation && <BottomNavigation />}
    </div>
  );
}