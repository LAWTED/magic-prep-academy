"use client";

import { useEffect } from "react";
import { useUserStore } from "@/store/userStore";

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { fetchUserData, initialized } = useUserStore();

  useEffect(() => {
    if (!initialized) {
      fetchUserData();
    }
  }, [fetchUserData, initialized]);

  return <>{children}</>;
}