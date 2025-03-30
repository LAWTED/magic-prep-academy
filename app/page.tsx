"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import LoadingCard from "./components/LoadingCard";
import Image from "next/image";
import { motion } from "framer-motion";

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
    <div className="flex flex-col items-center justify-center min-h-[100dvh] p-8 w-full bg-gradient-to-b from-yellow to-sand overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-10 left-10 w-40 h-40 bg-bronze rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-60 h-60 bg-gold rounded-full blur-3xl"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex flex-col items-center text-center"
      >
        <div className="relative mb-8">
          <Image
            src="/icons/icon-192x192.png"
            alt="Magic Prep Mascot"
            width={120}
            height={120}
            className="rounded-full border-4 border-bronze"
          />
        </div>

        <h1 className="text-4xl md:text-6xl font-bold mb-4 text-bronze text-center">Magic Prep Academy</h1>
        <p className="text-bronze/70 mb-10 max-w-md text-center">Your journey to college admissions success starts here</p>

        <div className="flex flex-col gap-4 w-full max-w-xs">
          <motion.div
            whileTap={{ scale: 0.97 }}
          >
            <Link href="/sign-in" className="w-full">
              <Button className="bg-bronze text-sand font-bold py-4 px-6 rounded-xl w-full text-lg shadow-lg">
                Sign In
              </Button>
            </Link>
          </motion.div>

          <motion.div
            whileTap={{ scale: 0.97 }}
          >
            <Link href="/sign-up" className="w-full">
              <Button variant="outline" className="bg-sand/50 text-bronze border-bronze/20 font-bold py-4 px-6 rounded-xl w-full text-lg">
                Create Account
              </Button>
            </Link>
          </motion.div>
        </div>
      </motion.div>

      <div className="text-bronze/50 text-xs mt-12">
        © {new Date().getFullYear()} Magic Prep Academy
      </div>
    </div>
  );
}
