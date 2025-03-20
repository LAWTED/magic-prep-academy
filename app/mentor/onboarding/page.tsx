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

const avatarOptions = [
  { name: "Carrot", path: "/images/avatars/Carrot.png" },
  { name: "Lou", path: "/images/avatars/Lou.png" },
];

export default function MentorOnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const totalSteps = 4;
  const [subjects, setSubjects] = useState<{ id: string; subject_name: string }[]>([]);

  // Form data
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  // Loading state
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchSubjects() {
      try {
        const { data, error } = await supabase
          .from('subjects')
          .select('id, subject_name');

        if (error) throw error;

        if (data) {
          setSubjects(data);
        }
      } catch (error) {
        console.error('Error fetching subjects:', error);
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
          router.push("/mentor/sign-in");
          return;
        }

        setUserId(user.id);
        setEmail(user.email || "");

        // Check if mentor already has a profile
        const { data } = await supabase
          .from("mentors")
          .select("*")
          .eq("auth_id", user.id)
          .single();

        if (data && data.name) {
          router.push("/mentor/dashboard");
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

      const updates = {
        auth_id: userId,
        name: name,
        email: email,
        avatar_name: selectedAvatar,
        subjects: selectedSubjects,
        updated_at: new Date().toISOString(),
      };

      // Upsert profile data
      let { error } = await supabase.from("mentors").upsert(updates);
      if (error) throw error;

      router.push("/mentor/dashboard");
    } catch (error) {
      console.error("Error completing onboarding:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="w-full max-w-4xl bg-card rounded-3xl shadow-lg p-12">
        {/* Progress Bar */}
        <div className="w-full mb-12">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-primary h-3 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-3 text-sm text-gray-500">
            <span>Complete your mentor profile</span>
            <span>
              Step {step} of {totalSteps}
            </span>
          </div>
        </div>

        {/* Steps Container */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            {step === 1 && (
              <div className="flex flex-col items-center space-y-8">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-center"
                >
                  <h1 className="text-4xl font-bold mb-4">Welcome, Mentor!</h1>
                  <p className="text-xl text-gray-500">Let's start with your name</p>
                </motion.div>

                <div className="w-full max-w-lg">
                  <Label htmlFor="name" className="text-lg mb-2 block">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-lg h-14 text-center"
                  />
                </div>

                <Button
                  onClick={nextStep}
                  disabled={!name.trim()}
                  className="w-full max-w-lg h-14 text-lg mt-8"
                >
                  Continue
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col items-center space-y-8">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-center"
                >
                  <h1 className="text-4xl font-bold mb-4">Choose your avatar</h1>
                  <p className="text-xl text-gray-500">Select a professional avatar</p>
                </motion.div>

                <div className="flex justify-center gap-16">
                  {avatarOptions.map((avatar) => (
                    <div
                      key={avatar.name}
                      onClick={() => setSelectedAvatar(avatar.name)}
                      className={`flex flex-col items-center cursor-pointer transition-all duration-300 ${
                        selectedAvatar === avatar.name
                          ? "scale-105"
                          : "opacity-70 hover:opacity-100"
                      }`}
                    >
                      <div
                        className={`relative w-40 h-40 rounded-2xl overflow-hidden mb-4 border-4 ${
                          selectedAvatar === avatar.name
                            ? "border-primary"
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
                      <span className={`text-xl font-medium ${
                        selectedAvatar === avatar.name
                          ? "text-primary"
                          : "text-gray-600"
                      }`}>
                        {avatar.name}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="w-full max-w-lg flex justify-between mt-8">
                  <Button onClick={prevStep} variant="outline" className="w-32 h-14">
                    Back
                  </Button>
                  <Button
                    onClick={nextStep}
                    disabled={!selectedAvatar}
                    className="w-32 h-14"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="flex flex-col items-center space-y-8">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-center"
                >
                  <h1 className="text-4xl font-bold mb-4">Verify your email</h1>
                  <p className="text-xl text-gray-500">This will be your contact email</p>
                </motion.div>

                <div className="w-full max-w-lg">
                  <Label htmlFor="email" className="text-lg mb-2 block">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="text-lg h-14 text-center"
                    disabled
                  />
                </div>

                <div className="w-full max-w-lg flex justify-between">
                  <Button onClick={prevStep} variant="outline" className="w-32 h-14">
                    Back
                  </Button>
                  <Button
                    onClick={nextStep}
                    disabled={!email}
                    className="w-32 h-14"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="flex flex-col items-center space-y-8">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-center"
                >
                  <h1 className="text-4xl font-bold mb-4">Your expertise</h1>
                  <p className="text-xl text-gray-500">Select subjects you can teach</p>
                </motion.div>

                <div className="flex flex-wrap justify-center gap-3 w-full max-w-2xl">
                  {subjects.map((subject) => (
                    <Badge
                      key={subject.id}
                      variant={selectedSubjects.includes(subject.id) ? "default" : "outline"}
                      className="cursor-pointer hover:opacity-80 transition-all px-6 py-3 text-lg"
                      onClick={() => toggleSubject(subject.id)}
                    >
                      {subject.subject_name}
                    </Badge>
                  ))}
                </div>

                <div className="w-full max-w-lg flex justify-between">
                  <Button onClick={prevStep} variant="outline" className="w-32 h-14">
                    Back
                  </Button>
                  <Button
                    onClick={completeOnboarding}
                    disabled={selectedSubjects.length === 0 || loading}
                    className="w-32 h-14"
                  >
                    {loading ? "Saving..." : "Complete"}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
