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
          const defaultFormData = {
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
          };

          const newAcademicData = {
            user_id: user.id,
            content: defaultFormData,
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
            setFormData(createdData.content || defaultFormData);
            console.log("Created new academic data:", createdData);
          }
        } else {
          setAcademicData(data);
          // Ensure we have a properly structured formData by merging with defaults
          const defaultFormData = {
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
          };

          const mergedContent = {
            gpa: { ...defaultFormData.gpa, ...(data.content?.gpa || {}) },
            gre: { ...defaultFormData.gre, ...(data.content?.gre || {}) },
            languageScore: {
              toefl: {
                ...defaultFormData.languageScore?.toefl,
                ...(data.content?.languageScore?.toefl || {}),
              },
              ielts: {
                ...defaultFormData.languageScore?.ielts,
                ...(data.content?.languageScore?.ielts || {}),
              },
              duolingo: {
                ...defaultFormData.languageScore?.duolingo,
                ...(data.content?.languageScore?.duolingo || {}),
              },
            },
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
  }, [user, supabase, userLoading]);

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
    <div className="grow flex flex-col w-full mx-auto pb-16 max-w-screen-md bg-yellow min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-gold flex items-center justify-between p-4  w-full">
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => router.push("/profile")}
            className="focus:outline-none text-bronze"
          >
            <ArrowLeft className="h-6 w-6" />
          </motion.button>
          <h1 className="text-xl font-bold text-bronze">Academic Profile</h1>
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
                ? "bg-gold/70 text-bronze"
                : "bg-gold/50 text-bronze"
              : "bg-sand/50 text-bronze"
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
          <div className="bg-tomato/10 border border-tomato/30 text-tomato px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            <div className="h-20 bg-sand/50 animate-pulse rounded-xl"></div>
            <div className="h-40 bg-sand/50 animate-pulse rounded-xl"></div>
          </div>
        ) : (
          <>
            {/* GPA Section */}
            <section className="bg-sand border border-bronze/20 rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4 text-bronze">GPA</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-bronze/80 mb-1">
                    Score (4.0 scale)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="4"
                    value={formData.gpa?.score || ""}
                    onChange={(e) =>
                      handleChange("gpa", null, "score", e.target.value)
                    }
                    disabled={!editMode}
                    className={`w-full p-2 rounded-lg border ${
                      editMode
                        ? "border-bronze/30 bg-yellow/50"
                        : "border-transparent bg-sand/70"
                    } text-bronze`}
                    placeholder="Enter your GPA"
                  />
                </div>
              </div>
              {!editMode && !formData.gpa?.score && (
                <p className="p-2 bg-sand/70 rounded-lg text-bronze/80 mt-2">
                  No GPA information provided
                </p>
              )}
            </section>

            {/* GRE Section */}
            <section className="bg-sand border border-bronze/20 rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4 text-bronze">GRE</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-bronze/80 mb-1">
                    Verbal
                  </label>
                  {editMode ? (
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={formData.gre?.verbal ?? ""}
                      onChange={(e) =>
                        handleChange("gre", null, "verbal", e.target.value)
                      }
                      className={`w-full p-2 rounded-lg border ${
                        editMode
                          ? "border-bronze/30 bg-yellow/50"
                          : "border-transparent bg-sand/70"
                      } text-bronze`}
                    />
                  ) : (
                    <p className="p-2 bg-sand/70 rounded-lg text-bronze/80">
                      {formData.gre?.verbal ?? "Not specified"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-bronze/80 mb-1">
                    Quantitative
                  </label>
                  {editMode ? (
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={formData.gre?.quantitative ?? ""}
                      onChange={(e) =>
                        handleChange(
                          "gre",
                          null,
                          "quantitative",
                          e.target.value
                        )
                      }
                      className={`w-full p-2 rounded-lg border ${
                        editMode
                          ? "border-bronze/30 bg-yellow/50"
                          : "border-transparent bg-sand/70"
                      } text-bronze`}
                    />
                  ) : (
                    <p className="p-2 bg-sand/70 rounded-lg text-bronze/80">
                      {formData.gre?.quantitative ?? "Not specified"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-bronze/80 mb-1">
                    Analytical
                  </label>
                  {editMode ? (
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={formData.gre?.analytical ?? ""}
                      onChange={(e) =>
                        handleChange("gre", null, "analytical", e.target.value)
                      }
                      className={`w-full p-2 rounded-lg border ${
                        editMode
                          ? "border-bronze/30 bg-yellow/50"
                          : "border-transparent bg-sand/70"
                      } text-bronze`}
                    />
                  ) : (
                    <p className="p-2 bg-sand/70 rounded-lg text-bronze/80">
                      {formData.gre?.analytical ?? "Not specified"}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Language Scores Section */}
            <section className="bg-sand border border-bronze/20 rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4 text-bronze">
                Language Tests
              </h2>

              {/* TOEFL */}
              <div className="mb-6">
                <h3 className="text-md font-medium mb-3 text-bronze">TOEFL</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-bronze/80 mb-1">
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
                        className={`w-full p-2 rounded-lg border ${
                          editMode
                            ? "border-bronze/30 bg-yellow/50"
                            : "border-transparent bg-sand/70"
                        } text-bronze`}
                      />
                    ) : (
                      <p className="p-2 bg-sand/70 rounded-lg text-bronze/80">
                        {formData.languageScore?.toefl?.reading ??
                          "Not specified"}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-bronze/80 mb-1">
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
                        className={`w-full p-2 rounded-lg border ${
                          editMode
                            ? "border-bronze/30 bg-yellow/50"
                            : "border-transparent bg-sand/70"
                        } text-bronze`}
                      />
                    ) : (
                      <p className="p-2 bg-sand/70 rounded-lg text-bronze/80">
                        {formData.languageScore?.toefl?.writing ??
                          "Not specified"}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-bronze/80 mb-1">
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
                        className={`w-full p-2 rounded-lg border ${
                          editMode
                            ? "border-bronze/30 bg-yellow/50"
                            : "border-transparent bg-sand/70"
                        } text-bronze`}
                      />
                    ) : (
                      <p className="p-2 bg-sand/70 rounded-lg text-bronze/80">
                        {formData.languageScore?.toefl?.speaking ??
                          "Not specified"}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-bronze/80 mb-1">
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
                        className={`w-full p-2 rounded-lg border ${
                          editMode
                            ? "border-bronze/30 bg-yellow/50"
                            : "border-transparent bg-sand/70"
                        } text-bronze`}
                      />
                    ) : (
                      <p className="p-2 bg-sand/70 rounded-lg text-bronze/80">
                        {formData.languageScore?.toefl?.listening ??
                          "Not specified"}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* IELTS */}
              <div className="mb-6">
                <h3 className="text-md font-medium mb-3 text-bronze">IELTS</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-bronze/80 mb-1">
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
                        className={`w-full p-2 rounded-lg border ${
                          editMode
                            ? "border-bronze/30 bg-yellow/50"
                            : "border-transparent bg-sand/70"
                        } text-bronze`}
                      />
                    ) : (
                      <p className="p-2 bg-sand/70 rounded-lg text-bronze/80">
                        {formData.languageScore?.ielts?.reading ??
                          "Not specified"}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-bronze/80 mb-1">
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
                        className={`w-full p-2 rounded-lg border ${
                          editMode
                            ? "border-bronze/30 bg-yellow/50"
                            : "border-transparent bg-sand/70"
                        } text-bronze`}
                      />
                    ) : (
                      <p className="p-2 bg-sand/70 rounded-lg text-bronze/80">
                        {formData.languageScore?.ielts?.writing ??
                          "Not specified"}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-bronze/80 mb-1">
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
                        className={`w-full p-2 rounded-lg border ${
                          editMode
                            ? "border-bronze/30 bg-yellow/50"
                            : "border-transparent bg-sand/70"
                        } text-bronze`}
                      />
                    ) : (
                      <p className="p-2 bg-sand/70 rounded-lg text-bronze/80">
                        {formData.languageScore?.ielts?.speaking ??
                          "Not specified"}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-bronze/80 mb-1">
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
                        className={`w-full p-2 rounded-lg border ${
                          editMode
                            ? "border-bronze/30 bg-yellow/50"
                            : "border-transparent bg-sand/70"
                        } text-bronze`}
                      />
                    ) : (
                      <p className="p-2 bg-sand/70 rounded-lg text-bronze/80">
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
