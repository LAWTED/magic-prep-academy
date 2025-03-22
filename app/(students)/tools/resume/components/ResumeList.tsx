"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Download,
  Eye,
  CheckCircle,
  Edit,
  Trash2,
  Plus,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useUserStore } from "@/store/userStore";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type ResumeItem = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  metadata: {
    content: any;
    format: string;
    original_file_name?: string;
  };
};

type ResumeListProps = {
  hideNewButton?: boolean;
};

export default function ResumeList({ hideNewButton = false }: ResumeListProps) {
  const supabase = createClient();
  const { user } = useUserStore();
  const router = useRouter();
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewResumeModal, setShowNewResumeModal] = useState(false);
  const [newResumeName, setNewResumeName] = useState("");
  const [editMode, setEditMode] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    if (user) {
      fetchResumes();
    }
  }, [user]);

  const fetchResumes = async () => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("user_id", user?.id)
        .eq("type", "resume")
        .order("updated_at", { ascending: false });

      if (error) {
        throw error;
      }

      setResumes(data || []);
    } catch (error) {
      console.error("Error fetching resumes:", error);
      toast.error("Failed to load resumes");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateResume = async () => {
    if (!newResumeName.trim() || !user) return;

    try {
      const { data, error } = await supabase
        .from("documents")
        .insert({
          user_id: user.id,
          name: newResumeName,
          type: "resume",
          metadata: {
            content: {},
            format: "APA",
          },
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      setResumes((prev) => [data, ...prev]);
      setNewResumeName("");
      setShowNewResumeModal(false);
      toast.success("Resume created successfully");
    } catch (error) {
      console.error("Error creating resume:", error);
      toast.error("Failed to create resume");
    }
  };

  const handleStartEdit = (resume: ResumeItem, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    setEditMode(resume.id);
    setEditName(resume.name);
  };

  const handleSaveEdit = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    if (!editName.trim()) return;

    try {
      const { data, error } = await supabase
        .from("documents")
        .update({
          name: editName,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setResumes((prev) =>
        prev.map((resume) => (resume.id === id ? data : resume))
      );
      setEditMode(null);
      toast.success("Resume renamed successfully");
    } catch (error) {
      console.error("Error updating resume:", error);
      toast.error("Failed to rename resume");
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    try {
      const { error } = await supabase.from("documents").delete().eq("id", id);

      if (error) {
        throw error;
      }

      setResumes((prev) => prev.filter((resume) => resume.id !== id));
      toast.success("Resume deleted successfully");
    } catch (error) {
      console.error("Error deleting resume:", error);
      toast.error("Failed to delete resume");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleViewVersions = (resume: ResumeItem) => {
    router.push(`/tools/resume/${resume.id}`);
  };

  return (
    <div className={hideNewButton ? "" : "p-4"}>
      <div
        className={`flex justify-between items-center ${!hideNewButton ? "mb-6" : ""}`}
      >
        {!hideNewButton && <h2 className="text-lg font-semibold">Resumes</h2>}
        {!hideNewButton && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNewResumeModal(true)}
            className="text-sm bg-blue-600 text-white py-2 px-4 rounded-lg flex items-center"
          >
            <Plus size={16} className="mr-1" />
            New Resume
          </motion.button>
        )}
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-gray-500">Loading resumes...</span>
          </div>
        ) : resumes.length === 0 ? (
          <div className="text-center py-12 px-4 border rounded-xl bg-gray-50">
            <p className="text-gray-500 mb-2">No resumes found</p>
            <p className="text-sm text-gray-400">
              Use the Upload Resume button to get started
            </p>
          </div>
        ) : (
          resumes.map((resume) => (
            <div
              key={resume.id}
              className="border rounded-xl p-5 hover:border-blue-200 transition-colors cursor-pointer relative"
              onClick={() => handleViewVersions(resume)}
            >
              {editMode === resume.id ? (
                <div
                  className="flex items-center mb-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 border rounded-lg p-2 mr-2"
                    autoFocus
                  />
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => handleSaveEdit(resume.id, e)}
                    className="text-green-600"
                  >
                    <CheckCircle size={18} />
                  </motion.button>
                </div>
              ) : (
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center">
                    <h3 className="font-medium text-lg">{resume.name}</h3>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500 mr-2">
                      {formatDate(resume.updated_at)}
                    </span>
                    <ChevronRight size={16} className="text-gray-400" />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center text-sm mb-4 text-gray-600">
                <span className="bg-gray-100 rounded-full px-3 py-1 text-xs mr-2 mb-1">
                  {resume.metadata?.format || "Unknown"} Format
                </span>
                {resume.metadata?.original_file_name && (
                  <span className="text-xs truncate max-w-[250px]">
                    From: {resume.metadata.original_file_name}
                  </span>
                )}
              </div>

              <div
                className="flex flex-wrap gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  className="text-xs bg-gray-100 hover:bg-gray-200 py-1.5 px-3 rounded-lg flex items-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewVersions(resume);
                  }}
                >
                  <Eye size={14} className="mr-1.5" />
                  View Versions
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => handleStartEdit(resume, e)}
                  className="text-xs bg-amber-50 text-amber-600 hover:bg-amber-100 py-1.5 px-3 rounded-lg flex items-center"
                >
                  <Edit size={14} className="mr-1.5" />
                  Rename
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => handleDelete(resume.id, e)}
                  className="text-xs bg-red-50 text-red-600 hover:bg-red-100 py-1.5 px-3 rounded-lg flex items-center"
                >
                  <Trash2 size={14} className="mr-1.5" />
                  Delete
                </motion.button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Resume Modal */}
      {showNewResumeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg p-6 w-[90%] max-w-md"
          >
            <h3 className="text-lg font-semibold mb-4">Create New Resume</h3>
            <div className="mb-4">
              <label className="block text-sm text-gray-700 mb-1">
                Resume Name
              </label>
              <input
                type="text"
                value={newResumeName}
                onChange={(e) => setNewResumeName(e.target.value)}
                placeholder="e.g., PhD Applications Fall 2023"
                className="w-full border rounded-lg p-2"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNewResumeModal(false)}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleCreateResume}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                Create
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
