"use client";

import { BookOpen, Save, Check } from "lucide-react";
import { MATERIAL_PROMPTS } from "@/app/config/systemPrompts";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

interface Subject {
  id: string;
  subject_name: string;
}

interface SaveModuleProps {
  vectorStoreId: string | null;
  onModuleSaved?: (moduleId: string, summary: string) => void;
}

export default function SaveModule({
  vectorStoreId,
  onModuleSaved,
}: SaveModuleProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [moduleName, setModuleName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [isLoadingSubjects, setIsLoadingSubjects] = useState<boolean>(true);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [savedModuleId, setSavedModuleId] = useState<string>("");
  const supabase = createClient();

  // Fetch subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const { data, error } = await supabase
          .from("subjects")
          .select("id, subject_name")
          .order("subject_name");

        if (error) {
          throw error;
        }

        setSubjects(data || []);
        if (data && data.length > 0) {
          setSelectedSubjectId(data[0].id);
        }
      } catch (err) {
        console.error("Error fetching subjects:", err);
      } finally {
        setIsLoadingSubjects(false);
      }
    };

    fetchSubjects();
  }, []);

  // Fetch module metadata (title and summary) in one request
  useEffect(() => {
    const fetchModuleMetadata = async () => {
      if (!vectorStoreId) return;

      try {
        setIsLoadingMetadata(true);
        const response = await fetch("/api/vector-chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            vectorStoreId,
            prompt: MATERIAL_PROMPTS.GENERATE_MODULE_METADATA,
            validator_name: "moduleMetadata",
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to generate module metadata");
        }

        const data = await response.json();

        if (data.response.parsed_content) {
          const { title, summary } = data.response.parsed_content;
          setModuleName(title);
          setDescription(summary);
        } else if (data.parse_error) {
          console.error("Error parsing metadata:", data.parse_error);
          // Fallback to text response if JSON parsing fails
          const responseText = data.response.output_text;
          try {
            // Try to manually extract title and summary
            const match = responseText.match(
              /title["\s:]+([^"]+)["\s,}]+summary["\s:]+([^"]+)/i
            );
            if (match) {
              setModuleName(match[1].trim());
              setDescription(match[2].trim());
            } else {
              setModuleName("New Module");
              setDescription(responseText);
            }
          } catch (err) {
            setModuleName("New Module");
            setDescription(responseText.substring(0, 500));
          }
        } else {
          // If no parsed content but no error either
          setModuleName("New Module");
          setDescription(data.response.output_text || "");
        }
      } catch (err) {
        console.error("Error fetching module metadata:", err);
        setModuleName("New Module");
        setDescription("");
      } finally {
        setIsLoadingMetadata(false);
      }
    };

    fetchModuleMetadata();
  }, [vectorStoreId]);

  const saveModule = async () => {
    if (!selectedSubjectId || !moduleName) {
      setError("Subject and module name are required");
      return;
    }

    setIsSaving(true);
    setError("");
    try {
      // Check if the module already exists
      const { data: existingModule, error: existingModuleError } =
        await supabase
          .from("modules")
          .select("*")
          .eq("vector_store_id", vectorStoreId)
          .limit(1);

      if (existingModuleError) {
        throw existingModuleError;
      }

      if (existingModule && existingModule.length > 0) {
        setError("Module already exists");
        return;
      }

      // Insert the module
      const { data: newModule, error: insertError } = await supabase
        .from("modules")
        .insert({
          subject_id: selectedSubjectId,
          module_name: moduleName,
          description: description,
          order_index: 0,
          vector_store_id: vectorStoreId,
        })
        .select("id")
        .single();

      if (insertError) {
        throw insertError;
      }

      // Store the module ID for later use
      setSavedModuleId(newModule.id);
      setSaveSuccess(true);
    } catch (err) {
      console.error("Error saving module:", err);
      setError("Failed to save module");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-card p-6 rounded-xl border shadow-sm">
      <h3 className="text-lg font-semibold mb-6 flex items-center">
        <BookOpen className="w-5 h-5 text-primary mr-2" />
        Save as Module
      </h3>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">Subject *</label>
          {isLoadingSubjects ? (
            <div className="h-10 w-full bg-muted animate-pulse rounded"></div>
          ) : (
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full p-3 border rounded-md bg-background"
              disabled={isSaving || saveSuccess}
            >
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.subject_name}
                </option>
              ))}
              {subjects.length === 0 && (
                <option value="" disabled>
                  No subjects available
                </option>
              )}
            </select>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Module Name *
          </label>
          {isLoadingMetadata ? (
            <div className="h-10 w-full bg-muted animate-pulse rounded"></div>
          ) : (
            <input
              type="text"
              value={moduleName}
              onChange={(e) => setModuleName(e.target.value)}
              className="w-full p-3 border rounded-md bg-background"
              disabled={isSaving || saveSuccess}
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          {isLoadingMetadata ? (
            <div className="h-32 w-full bg-muted animate-pulse rounded"></div>
          ) : (
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 border rounded-md bg-background min-h-[150px]"
              disabled={isSaving || saveSuccess}
            />
          )}
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
            {error}
          </div>
        )}

        {saveSuccess ? (
          <div className="flex items-center justify-center p-3 bg-green-100 text-green-700 rounded-md">
            <Check className="w-5 h-5 mr-2" />
            Module saved successfully
          </div>
        ) : (
          <button
            onClick={saveModule}
            disabled={
              isSaving || !selectedSubjectId || !moduleName || isLoadingMetadata
            }
            className="w-full p-3 bg-primary text-white rounded-md hover:bg-primary/90 disabled:bg-primary/50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Save Module
              </>
            )}
          </button>
        )}

        {saveSuccess && onModuleSaved && (
          <button
            onClick={() => onModuleSaved(savedModuleId, description)}
            className="w-full p-3 bg-primary text-white rounded-md hover:bg-primary/90 mt-4 flex items-center justify-center"
          >
            Continue to Next Step
          </button>
        )}
      </div>
    </div>
  );
}
