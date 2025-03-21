"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit, Save } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { motion } from "framer-motion";
import { UserAcademic } from "@/app/types";
import Link from "next/link";
import { useUserStore } from "@/store/userStore";

export default function AcademicProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const { user, isLoading: userLoading } = useUserStore();
  const [academicData, setAcademicData] = useState<UserAcademic | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<UserAcademic["content"]>({
    gpa: { score: undefined },
    gre: {
      verbal: undefined,
      quantitative: undefined,
      analytical: undefined,
    },
    languageScore: {
      toefl: {
        reading: undefined,
        writing: undefined,
        speaking: undefined,
        listening: undefined,
      },
      ielts: {
        reading: undefined,
        writing: undefined,
        speaking: undefined,
        listening: undefined,
      },
      duolingo: { score: undefined },
    },
  });

  useEffect(() => {
    async function fetchAcademicData() {
      try {
        if (!user) return;

        // Get academic data
        const { data, error } = await supabase
          .from("user_academic")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Error fetching academic data:", error);
        }

        // Initialize data if doesn't exist
        if (!data) {
          const newAcademicData = {
            user_id: user.id,
            content: formData,
          };

          const { data: createdData, error: createError } = await supabase
            .from("user_academic")
            .insert(newAcademicData)
            .select("*")
            .single();

          if (createError) {
            console.error("Error creating academic data:", createError);
          } else {
            setAcademicData(createdData);
            setFormData(createdData.content || formData);
            console.log("Created new academic data:", createdData);
          }
        } else {
          setAcademicData(data);
          // Ensure we have a properly structured formData by merging with defaults
          const mergedContent = {
            gpa: { ...formData.gpa, ...(data.content?.gpa || {}) },
            gre: { ...formData.gre, ...(data.content?.gre || {}) },
            languageScore: {
              toefl: { ...formData.languageScore?.toefl, ...(data.content?.languageScore?.toefl || {}) },
              ielts: { ...formData.languageScore?.ielts, ...(data.content?.languageScore?.ielts || {}) },
              duolingo: { ...formData.languageScore?.duolingo, ...(data.content?.languageScore?.duolingo || {}) },
            }
          };
          setFormData(mergedContent);
          console.log("Loaded existing academic data:", data);
        }
      } catch (error) {
        console.error("Error loading academic data:", error);
      } finally {
        setLoading(false);
      }
    }

    if (!userLoading && user) {
      fetchAcademicData();
    }
  }, [user, supabase, userLoading, formData]);

  const handleChange = (
    section: string,
    subsection: string | null,
    field: string,
    value: any
  ) => {
    setFormData((prev) => {
      const newData = { ...prev };

      if (!subsection) {
        if (!newData[section as keyof typeof newData]) {
          newData[section as keyof typeof newData] = {};
        }
        (newData[section as keyof typeof newData] as any)[field] =
          value === "" ? undefined : Number(value);
      } else {
        if (!newData[section as keyof typeof newData]) {
          newData[section as keyof typeof newData] = {};
        }
        if (!(newData[section as keyof typeof newData] as any)[subsection]) {
          (newData[section as keyof typeof newData] as any)[subsection] = {};
        }
        (newData[section as keyof typeof newData] as any)[subsection][field] =
          value === "" ? undefined : Number(value);
      }

      return newData;
    });
  };

  const handleSave = async () => {
    try {
      setError(null);
      setSaving(true);
      console.log("Saving data:", formData);

      if (!academicData) return;

      const { error } = await supabase
        .from("user_academic")
        .update({ content: formData, updated_at: new Date().toISOString() })
        .eq("id", academicData.id);

      if (error) {
        throw error;
      }

      // Update local state
      setAcademicData({
        ...academicData,
        content: formData,
        updated_at: new Date().toISOString(),
      });

      setEditMode(false);
    } catch (error) {
      console.error("Error updating academic data:", error);
      setError("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Determine if form has been modified to track changes
  const hasChanges = useMemo(() => {
    if (!academicData) return false;

    // Create a simplified version of both objects for comparison
    const contentStr = JSON.stringify(academicData.content || {});
    const formStr = JSON.stringify(formData || {});

    return contentStr !== formStr;
  }, [academicData, formData]);

  return (
    <div className="grow flex flex-col w-full mx-auto pb-16 max-w-screen-md">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background flex items-center justify-between p-4 border-b w-full">
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => router.push("/profile")}
            className="focus:outline-none"
          >
            <ArrowLeft className="h-6 w-6" />
          </motion.button>
          <h1 className="text-xl font-bold">Academic Profile</h1>
        </div>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            if (editMode) {
              handleSave();
            } else {
              setEditMode(true);
            }
          }}
          disabled={loading || saving}
          className={`px-4 py-2 rounded-full flex items-center gap-2 text-sm ${
            editMode
              ? hasChanges
                ? "bg-primary text-primary-foreground"
                : "bg-primary/80 text-primary-foreground"
              : "bg-primary/10 text-primary"
          }`}
        >
          {editMode ? (
            <>
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save"}
            </>
          ) : (
            <>
              <Edit className="h-4 w-4" />
              Edit
            </>
          )}
        </motion.button>
      </header>

      {/* Main Content */}
      <main className="p-4 w-full mx-auto space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            <div className="h-20 bg-gray-200 animate-pulse rounded-xl"></div>
            <div className="h-40 bg-gray-200 animate-pulse rounded-xl"></div>
          </div>
        ) : (
          <>
            {/* GPA Section */}
            <section className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">GPA</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Score (4.0 scale)
                  </label>
                  {editMode ? (
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="4.0"
                      value={formData.gpa?.score ?? ""}
                      onChange={(e) =>
                        handleChange("gpa", null, "score", e.target.value)
                      }
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  ) : (
                    <p className="p-2 bg-gray-50 rounded-lg">
                      {formData.gpa?.score ?? "Not specified"}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Language Scores Section */}
            <section className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Language Tests</h2>

              {/* TOEFL */}
              <div className="mb-6">
                <h3 className="text-md font-medium mb-3">TOEFL</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Reading
                    </label>
                    {editMode ? (
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={formData.languageScore?.toefl?.reading ?? ""}
                        onChange={(e) =>
                          handleChange(
                            "languageScore",
                            "toefl",
                            "reading",
                            e.target.value
                          )
                        }
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    ) : (
                      <p className="p-2 bg-gray-50 rounded-lg">
                        {formData.languageScore?.toefl?.reading ??
                          "Not specified"}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Writing
                    </label>
                    {editMode ? (
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={formData.languageScore?.toefl?.writing ?? ""}
                        onChange={(e) =>
                          handleChange(
                            "languageScore",
                            "toefl",
                            "writing",
                            e.target.value
                          )
                        }
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    ) : (
                      <p className="p-2 bg-gray-50 rounded-lg">
                        {formData.languageScore?.toefl?.writing ??
                          "Not specified"}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Speaking
                    </label>
                    {editMode ? (
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={formData.languageScore?.toefl?.speaking ?? ""}
                        onChange={(e) =>
                          handleChange(
                            "languageScore",
                            "toefl",
                            "speaking",
                            e.target.value
                          )
                        }
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    ) : (
                      <p className="p-2 bg-gray-50 rounded-lg">
                        {formData.languageScore?.toefl?.speaking ??
                          "Not specified"}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Listening
                    </label>
                    {editMode ? (
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={formData.languageScore?.toefl?.listening ?? ""}
                        onChange={(e) =>
                          handleChange(
                            "languageScore",
                            "toefl",
                            "listening",
                            e.target.value
                          )
                        }
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    ) : (
                      <p className="p-2 bg-gray-50 rounded-lg">
                        {formData.languageScore?.toefl?.listening ??
                          "Not specified"}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* IELTS */}
              <div className="mb-6">
                <h3 className="text-md font-medium mb-3">IELTS</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Reading
                    </label>
                    {editMode ? (
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="9"
                        value={formData.languageScore?.ielts?.reading ?? ""}
                        onChange={(e) =>
                          handleChange(
                            "languageScore",
                            "ielts",
                            "reading",
                            e.target.value
                          )
                        }
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    ) : (
                      <p className="p-2 bg-gray-50 rounded-lg">
                        {formData.languageScore?.ielts?.reading ??
                          "Not specified"}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Writing
                    </label>
                    {editMode ? (
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="9"
                        value={formData.languageScore?.ielts?.writing ?? ""}
                        onChange={(e) =>
                          handleChange(
                            "languageScore",
                            "ielts",
                            "writing",
                            e.target.value
                          )
                        }
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    ) : (
                      <p className="p-2 bg-gray-50 rounded-lg">
                        {formData.languageScore?.ielts?.writing ??
                          "Not specified"}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Speaking
                    </label>
                    {editMode ? (
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="9"
                        value={formData.languageScore?.ielts?.speaking ?? ""}
                        onChange={(e) =>
                          handleChange(
                            "languageScore",
                            "ielts",
                            "speaking",
                            e.target.value
                          )
                        }
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    ) : (
                      <p className="p-2 bg-gray-50 rounded-lg">
                        {formData.languageScore?.ielts?.speaking ??
                          "Not specified"}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Listening
                    </label>
                    {editMode ? (
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="9"
                        value={formData.languageScore?.ielts?.listening ?? ""}
                        onChange={(e) =>
                          handleChange(
                            "languageScore",
                            "ielts",
                            "listening",
                            e.target.value
                          )
                        }
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    ) : (
                      <p className="p-2 bg-gray-50 rounded-lg">
                        {formData.languageScore?.ielts?.listening ??
                          "Not specified"}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
