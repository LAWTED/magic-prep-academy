"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import LoadingCard from "./components/LoadingCard";

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function checkUser() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          router.push("/homepage");
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error checking user:", error);
        setIsLoading(false);
      }
    }

    checkUser();
  }, [router, supabase]);

  if (isLoading) {
    return <LoadingCard />;
  }

  return (
    <div className="flex flex-col items-center justify-center h-[100dvh] p-8 w-full">
      <h1 className="text-6xl font-bold mb-6 text-black">Magic Prep Academy</h1>
      <main className="w-full flex items-end mt-20">
        <Link href="/sign-in" className="w-full">
          <Button className="bg-black hover:bg-gray-800 text-white font-bold py-2 px-4 rounded-md w-full">
            Login
          </Button>
        </Link>
      </main>
    </div>
  );
}
