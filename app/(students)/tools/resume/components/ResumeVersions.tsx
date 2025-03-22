"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Loader2, Edit, CheckCircle, Trash2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Document_VERSIONS_METADATA } from "@/app/types";

type ResumeVersion = {
  id: string;
  name: string;
  version_number: number;
  created_at: string;
  updated_at: string;
  metadata: Document_VERSIONS_METADATA;
};

type ResumeVersionsProps = {
  documentId: string;
  documentName: string;
  onBack: () => void;
};

export default function ResumeVersions({
  documentId,
  documentName,
  onBack,
}: ResumeVersionsProps) {
  const supabase = createClient();
  const router = useRouter();
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingVersion, setEditingVersion] = useState<string | null>(null);
  const [editedName, setEditedName] = useState("");
  const [deletingVersion, setDeletingVersion] = useState<string | null>(null);

  useEffect(() => {
    if (documentId) {
      fetchVersions();
    }
  }, [documentId]);

  const fetchVersions = async () => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from("document_versions")
        .select("*")
        .eq("document_id", documentId)
        .order("version_number", { ascending: false });

      if (error) {
        throw error;
      }

      setVersions(data || []);
    } catch (error) {
      console.error("Error fetching versions:", error);
      toast.error("Failed to load resume versions");
    } finally {
      setIsLoading(false);
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

  // Card click handler should go to detail view
  const handleCardClick = (version: ResumeVersion) => {
    if (editingVersion) return; // 如果正在编辑，不要导航
    router.push(`/tools/resume/${documentId}/${version.id}`);
  };

  const handleStartRename = (version: ResumeVersion, e: React.MouseEvent) => {
    e.stopPropagation(); // 防止触发卡片点击
    setEditingVersion(version.id);
    setEditedName(version.name || `Version ${version.version_number}`);
  };

  const handleSaveRename = async (
    version: ResumeVersion,
    e: React.MouseEvent
  ) => {
    e.stopPropagation(); // 防止触发卡片点击

    if (!editedName.trim()) {
      toast.error("Version name cannot be empty");
      return;
    }

    try {
      const { error } = await supabase
        .from("document_versions")
        .update({ name: editedName.trim() })
        .eq("id", version.id);

      if (error) throw error;

      // 更新本地状态
      setVersions((prev) =>
        prev.map((v) =>
          v.id === version.id ? { ...v, name: editedName.trim() } : v
        )
      );

      toast.success("Version renamed successfully");
    } catch (error) {
      console.error("Error renaming version:", error);
      toast.error("Failed to rename version");
    } finally {
      setEditingVersion(null);
    }
  };

  const handleDeleteVersion = async (version: ResumeVersion, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering card click

    // Don't allow deleting if it's the only version
    if (versions.length <= 1) {
      toast.error("Cannot delete the only version of this resume");
      return;
    }

    // Set deleting state to show loading indicator
    setDeletingVersion(version.id);

    try {
      const { error } = await supabase
        .from("document_versions")
        .delete()
        .eq("id", version.id);

      if (error) throw error;

      // Update local state
      setVersions((prev) => prev.filter((v) => v.id !== version.id));
      toast.success("Version deleted successfully");

      // If user deleted the version they were viewing in detail, redirect back to main view
      if (window.location.pathname.includes(version.id)) {
        router.push(`/tools/resume/${documentId}`);
      }
    } catch (error) {
      console.error("Error deleting version:", error);
      toast.error("Failed to delete version");
    } finally {
      setDeletingVersion(null);
    }
  };

  return (
    <div>
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-12 bg-white rounded-xl shadow-sm border p-5">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-gray-500">Loading versions...</span>
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-12 px-4 bg-white rounded-xl shadow-sm border">
            <p className="text-gray-500 mb-2">No versions found</p>
            <p className="text-sm text-gray-400">
              This resume doesn't have any versions yet
            </p>
          </div>
        ) : (
          versions.map((version) => (
            <div
              key={version.id}
              className={`bg-white rounded-xl shadow-sm border p-5 hover:border-blue-200 transition-colors ${editingVersion !== version.id ? "cursor-pointer" : ""}`}
              onClick={() => handleCardClick(version)}
            >
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center">
                  {editingVersion === version.id ? (
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="border-b border-blue-300 focus:outline-none focus:border-blue-500 px-1 text-lg font-medium"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <h3 className="font-medium text-lg">
                      {version.name || `Version ${version.version_number}`}
                    </h3>
                  )}
                  {version.version_number ===
                    Math.max(...versions.map((v) => v.version_number)) && (
                    <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                      Latest
                    </span>
                  )}
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <Calendar size={14} className="mr-1.5" />
                  {formatDate(version.created_at)}
                </div>
              </div>

              <div
                className="flex flex-wrap gap-2 w-fit"
                onClick={(e) => e.stopPropagation()}
              >
                {editingVersion === version.id ? (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="text-xs bg-green-50 text-green-600 hover:bg-green-100 py-1.5 px-3 rounded-lg flex items-center"
                    onClick={(e) => handleSaveRename(version, e)}
                  >
                    <CheckCircle size={14} className="mr-1.5" />
                    Save
                  </motion.button>
                ) : (
                  <>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      className="text-xs bg-amber-50 text-amber-600 hover:bg-amber-100 py-1.5 px-3 rounded-lg flex items-center"
                      onClick={(e) => handleStartRename(version, e)}
                    >
                      <Edit size={14} className="mr-1.5" />
                      Rename
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      className="text-xs bg-red-50 text-red-600 hover:bg-red-100 py-1.5 px-3 rounded-lg flex items-center"
                      onClick={(e) => handleDeleteVersion(version, e)}
                      disabled={deletingVersion === version.id}
                    >
                      {deletingVersion === version.id ? (
                        <Loader2 size={14} className="mr-1.5 animate-spin" />
                      ) : (
                        <Trash2 size={14} className="mr-1.5" />
                      )}
                      Delete
                    </motion.button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
