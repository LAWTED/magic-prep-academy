"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const subjects = [
  "Computer Science",
  "Data Science",
  "Artificial Intelligence",
  "Business Administration",
  "Economics",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Chemistry",
  "Physics",
  "Biology",
  "Medicine",
  "Law",
  "Literature",
  "History",
  "Political Science",
  "International Relations",
];

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [location, setLocation] = useState("");
  const [avatar_url, setAvatarUrl] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    getProfile();
  }, []);

  async function getProfile() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/sign-in");
        return;
      }

      let { data, error } = await supabase
        .from("profiles")
        .select("username, location, avatar_url, user_subjects(subjects(name))")
        .eq("id", user.id)
        .single();

      if (error) {
        console.warn(error);
        if (error.code === 'PGRST116') {
          router.push("/onboarding");
          return;
        }
      }

      if (data) {
        setUsername(data.username || "");
        setLocation(data.location || "");
        setAvatarUrl(data.avatar_url || "");
        setSelectedSubjects(data.user_subjects?.map((us: any) => us.subjects.name) || []);
      } else {
        router.push("/onboarding");
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error("No user");

      const updates = {
        id: user.id,
        username,
        location,
        avatar_url,
        updated_at: new Date().toISOString(),
      };

      let { error } = await supabase.from("profiles").upsert(updates);
      if (error) throw error;

      // Update user_subjects
      const { data: existingSubjects } = await supabase
        .from("subjects")
        .select("id, name")
        .in("name", selectedSubjects);

      if (existingSubjects) {
        // Delete existing user_subjects
        await supabase
          .from("user_subjects")
          .delete()
          .eq("user_id", user.id);

        // Insert new user_subjects
        const userSubjects = existingSubjects.map((subject) => ({
          user_id: user.id,
          subject_id: subject.id,
        }));

        await supabase.from("user_subjects").insert(userSubjects);
      }

      alert("Profile updated!");
    } catch (error) {
      console.log(error);
      alert("Error updating profile!");
    } finally {
      setLoading(false);
    }
  }

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select an image to upload.");
      }

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const filePath = `${Math.random()}.${fileExt}`;

      let { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      setAvatarUrl(data.publicUrl);
    } catch (error) {
      console.log(error);
      alert("Error uploading avatar!");
    } finally {
      setUploading(false);
    }
  }

  const toggleSubject = (subject: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subject)
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-start min-h-screen p-4 md:p-8 max-w-2xl mx-auto w-full gap-8"
    >
      <h1 className="text-3xl font-bold">Profile Settings</h1>

      <div className="w-full space-y-6">
        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-32 h-32">
            {avatar_url ? (
              <Image
                src={avatar_url}
                alt="Avatar"
                className="rounded-full object-cover"
                fill
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-4xl text-gray-500">👤</span>
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="avatar" className="cursor-pointer">
              <Button variant="outline" disabled={uploading}>
                {uploading ? "Uploading..." : "Upload Avatar"}
              </Button>
            </Label>
            <Input
              type="file"
              id="avatar"
              accept="image/*"
              onChange={uploadAvatar}
              disabled={uploading}
              className="hidden"
            />
          </div>
        </div>

        {/* Profile Information */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
            />
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter your location"
            />
          </div>

          {/* Subjects Selection */}
          <div>
            <Label>Interested Subjects</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {subjects.map((subject) => (
                <Badge
                  key={subject}
                  variant={selectedSubjects.includes(subject) ? "default" : "outline"}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => toggleSubject(subject)}
                >
                  {subject}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <Button
          onClick={updateProfile}
          disabled={loading}
          className="w-full"
        >
          {loading ? "Saving..." : "Save Profile"}
        </Button>
      </div>
    </motion.div>
  );
}