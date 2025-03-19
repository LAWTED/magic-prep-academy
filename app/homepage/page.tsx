"use client";

import { createClient } from "@/utils/supabase/client";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Cog, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LearningMap from "@/app/components/LearningMap";

export default function ProtectedPage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkUser() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/sign-in");
          return;
        }

        // Check if user has a profile
        const { data } = await supabase
          .from("users")
          .select("*")
          .eq("auth_id", user.id)
          .single();

        if (!data || !data.name) {
          router.push("/onboarding");
          return;
        }

        setProfile(data);
      } catch (error) {
        console.error("Error checking user:", error);
        router.push("/sign-in");
      } finally {
        setLoading(false);
      }
    }

    checkUser();
  }, [router, supabase]);

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  // Get avatar path based on profile's avatar_name
  const avatarPath = `/images/avatars/${profile.avatar_name}.png`;

  return (
    <div className="flex flex-col w-full min-h-screen">
      <Tabs defaultValue="learn" className="w-full">
        {/* Header */}
        <header className="w-full p-4 flex items-center justify-between border-b">
          {/* Avatar and Stars */}
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-primary">
              <Image
                src={avatarPath}
                alt={profile.name}
                fill
                className="object-cover"
              />
            </div>
            {/* Daily Stars */}
            <div className="flex items-center gap-2 bg-white/90 px-3 py-1.5 rounded-xl">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="font-medium text-sm">5</span>
            </div>
          </div>

          {/* Tabs */}
          <TabsList className="grid w-32 grid-cols-2">
            <TabsTrigger value="learn">Learn</TabsTrigger>
            <TabsTrigger value="prepare">Prepare</TabsTrigger>
          </TabsList>

          {/* Settings (disabled) */}
          <button className="text-gray-400 cursor-not-allowed" disabled>
            <Cog size={22} />
          </button>
        </header>

        {/* Main Content */}
        <div className="flex-1 p-4">
          <TabsContent value="learn">
            <div className="mb-4">
              <h2 className="text-xl font-bold">
                {profile.subjects.map((subject: string) => subject)} Learning
                Path
              </h2>
            </div>
            <LearningMap />
          </TabsContent>

          <TabsContent value="prepare">
            <div className="grid gap-4">
              <div className="rounded-lg border p-4">
                <h3 className="text-lg font-medium">Prepare Content</h3>
                <p className="text-sm text-gray-500">Prepare for your exams.</p>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
