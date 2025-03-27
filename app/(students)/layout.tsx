"use client";

import BottomNavigation from "@/components/BottomNavigation";
import StudentHeader from "@/app/(students)/components/StudentHeader";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserProvider } from "@/components/UserProvider";
import { Toaster } from "sonner";

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
    pathname?.startsWith("/school/") ||
    pathname === "/tools" ||
    pathname?.startsWith("/tools/") ||
    pathname === "/chat" ||
    pathname?.startsWith("/chat/") ||
    pathname === "/cal";

  // Check if the current path should have the header
  const shouldShowHeader =
    pathname === "/homepage" ||
    pathname === "/awards" ||
    pathname === "/school" ||
    pathname === "/tools" ||
    pathname === "/cal";

  const isProfilePage =
    pathname === "/profile" || pathname?.startsWith("/profile/");

  return (
    <UserProvider>
      <div className="flex flex-col h-full w-full bg-background overflow-hidden">
        {shouldShowHeader && (
          <div className="flex-none sticky top-0 z-10">
            <StudentHeader />
          </div>
        )}

        <main
          className={cn(
            "flex-1 w-full mx-auto overflow-y-auto scrollbar-none",
            !isProfilePage && "max-w-screen-md"
          )}
        >
          {children}
        </main>

        {shouldShowNavigation && (
          <div className="flex-none sticky bottom-0 z-10">
            <BottomNavigation />
          </div>
        )}

        <Toaster
          position="bottom-center"
          richColors
          className="safe-bottom"
          toastOptions={{
            className: "mb-16 safe-bottom"
          }}
        />
      </div>
    </UserProvider>
  );
}
