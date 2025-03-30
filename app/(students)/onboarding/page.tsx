"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useUserStore } from "@/store/userStore";

const avatarOptions = [
  { name: "Nemo", path: "/images/avatars/Nemo.png" },
  { name: "Otta", path: "/images/avatars/Otta.png" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const { fetchUserData } = useUserStore();
  const [userId, setUserId] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const totalSteps = 4;
  const [subjects, setSubjects] = useState<
    { id: string; subject_name: string }[]
  >([]);

  // Form data
  const [username, setUsername] = useState("");
  const [location, setLocation] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  // Loading state
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchSubjects() {
      try {
        const { data, error } = await supabase
          .from("subjects")
          .select("id, subject_name");

        if (error) throw error;

        if (data) {
          setSubjects(data);
        }
      } catch (error) {
        console.error("Error fetching subjects:", error);
      }
    }

    fetchSubjects();
  }, [supabase]);

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

        setUserId(user.id);

        // Check if user already has a profile
        const { data } = await supabase
          .from("users")
          .select("*")
          .eq("auth_id", user.id)
          .single();

        if (data && data.name) {
          router.push("/homepage");
        }
      } catch (error) {
        console.error("Error checking user:", error);
      }
    }

    checkUser();
  }, [router, supabase]);

  const nextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const toggleSubject = (subjectId: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  async function completeOnboarding() {
    if (!userId) return;

    try {
      setLoading(true);

      console.log("selectedSubjects", selectedSubjects);
      const updates = {
        auth_id: userId,
        name: username,
        region: location,
        avatar_name: selectedAvatar,
        subjects: selectedSubjects,
        updated_at: new Date().toISOString(),
      };

      // Upsert profile data
      let { error } = await supabase.from("users").upsert(updates);
      if (error) throw error;

      // Refresh user store data with the new profile
      await fetchUserData();

      router.push("/homepage");
    } catch (error) {
      console.error("Error completing onboarding:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-start h-[100dvh] p-4 w-full max-w-md mx-auto bg-yellow">
      {/* Progress Bar */}
      <div className="w-full mb-8 mt-4">
        <div className="w-full bg-bronze/30 rounded-full h-2.5">
          <div
            className="bg-bronze h-2.5 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-bronze">
          <span>Let's set up your profile</span>
          <span>
            {step}/{totalSteps}
          </span>
        </div>
      </div>

      {/* Steps Container */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="w-full bg-sand backdrop-blur-sm p-6 rounded-lg shadow-md border border-bronze/20"
        >
          {step === 1 && (
            <div className="flex flex-col items-center space-y-6 w-full">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center"
              >
                <h1 className="text-2xl font-bold mb-2 text-bronze">
                  What's your name?
                </h1>
                <p className="text-black/70">This is how we'll address you.</p>
              </motion.div>

              <div className="w-full max-w-xs">
                <Input
                  type="text"
                  placeholder="Enter your name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="text-lg text-center h-14 border-bronze/30 focus:border-bronze focus:ring-bronze/30"
                />
              </div>

              <Button
                onClick={nextStep}
                disabled={!username.trim()}
                className="w-full max-w-xs h-12 text-lg mt-4 bg-bronze  text-sand"
              >
                Continue
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col items-center space-y-6 w-full">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center"
              >
                <h1 className="text-2xl font-bold mb-2 text-bronze">
                  Choose your avatar
                </h1>
                <p className="text-black/70">
                  Who will be your learning companion?
                </p>
              </motion.div>

              <div className="flex justify-center gap-6 w-full">
                {avatarOptions.map((avatar) => (
                  <div
                    key={avatar.name}
                    onClick={() => setSelectedAvatar(avatar.name)}
                    className={`flex flex-col items-center cursor-pointer transition-all duration-300 ${
                      selectedAvatar === avatar.name
                        ? "scale-110"
                        : "opacity-70 hover:opacity-100"
                    }`}
                  >
                    <div
                      className={`relative w-28 h-28 rounded-full overflow-hidden mb-2 border-4 ${
                        selectedAvatar === avatar.name
                          ? "border-bronze"
                          : "border-transparent"
                      }`}
                    >
                      <Image
                        src={avatar.path}
                        alt={avatar.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <span
                      className={`font-medium ${
                        selectedAvatar === avatar.name
                          ? "text-bronze"
                          : "text-black/70"
                      }`}
                    >
                      {avatar.name}
                    </span>
                  </div>
                ))}
              </div>

              <div className="w-full max-w-xs flex justify-between">
                <Button
                  onClick={prevStep}
                  variant="outline"
                  className="w-24 border-bronze/30 text-bronze hover:bg-bronze/10"
                >
                  Back
                </Button>
                <Button
                  onClick={nextStep}
                  disabled={!selectedAvatar}
                  className="w-24 bg-bronze hover:bg-bronze/90 text-sand"
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center space-y-6 w-full">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center"
              >
                <h1 className="text-2xl font-bold mb-2 text-bronze">
                  Where are you from?
                </h1>
                <p className="text-black/70">Tell us your location</p>
              </motion.div>

              <div className="w-full max-w-xs">
                <Input
                  type="text"
                  placeholder="Enter your location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="text-lg text-center h-14 border-bronze/30 focus:border-bronze focus:ring-bronze/30"
                />
              </div>

              <div className="w-full max-w-xs flex justify-between">
                <Button
                  onClick={prevStep}
                  variant="outline"
                  className="w-24 border-bronze/30 text-bronze hover:bg-bronze/10"
                >
                  Back
                </Button>
                <Button
                  onClick={nextStep}
                  disabled={!location.trim()}
                  className="w-24 bg-bronze hover:bg-bronze/90 text-sand"
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col items-center space-y-6 w-full">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center"
              >
                <h1 className="text-2xl font-bold mb-2 text-bronze">
                  Select your interests
                </h1>
                <p className="text-black/70">
                  What subjects are you interested in?
                </p>
              </motion.div>

              <div className="flex flex-wrap justify-center gap-2 w-full max-w-xs">
                {subjects.map((subject) => (
                  <Badge
                    key={subject.id}
                    variant={
                      selectedSubjects.includes(subject.id)
                        ? "default"
                        : "outline"
                    }
                    className={`cursor-pointer hover:opacity-80 transition-all px-3 py-2 text-sm ${
                      selectedSubjects.includes(subject.id)
                        ? "bg-bronze text-sand hover:bg-bronze/90"
                        : "border-bronze/30 text-bronze hover:bg-bronze/10"
                    }`}
                    onClick={() => toggleSubject(subject.id)}
                  >
                    {subject.subject_name}
                  </Badge>
                ))}
              </div>

              <div className="w-full max-w-xs flex justify-between">
                <Button
                  onClick={prevStep}
                  variant="outline"
                  className="w-24 border-bronze/30 text-bronze hover:bg-bronze/10"
                >
                  Back
                </Button>
                <Button
                  onClick={completeOnboarding}
                  disabled={selectedSubjects.length === 0 || loading}
                  className="w-24 bg-bronze hover:bg-bronze/90 text-sand"
                >
                  {loading ? "Saving..." : "Finish"}
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
