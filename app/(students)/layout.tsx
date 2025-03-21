"use client";

import BottomNavigation from "@/components/BottomNavigation";
import StudentHeader from "@/app/components/StudentHeader";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserProvider } from "@/components/UserProvider";

export default function StudentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Check if the current path is one that should have the bottom navigation
  const shouldShowNavigation =
    pathname === "/homepage" ||
    pathname === "/awards" ||
    pathname === "/school" ||
    pathname.startsWith("/school/");

  // Check if the current path should have the header
  const shouldShowHeader =
    pathname === "/homepage" ||
    pathname === "/awards" ||
    pathname === "/school" ||
    pathname.startsWith("/school/");

  return (
    <UserProvider>
      <div className="min-h-[100dvh] flex flex-col bg-background">
        {shouldShowHeader && <StudentHeader />}
        <main
          className={cn(
            "flex-1 flex flex-col w-full max-w-screen-md mx-auto ",
            shouldShowNavigation && "pb-16"
          )}
        >
          {children}
        </main>
        {shouldShowNavigation && <BottomNavigation />}
      </div>
    </UserProvider>
  );
}
