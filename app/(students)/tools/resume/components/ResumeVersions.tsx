"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Loader2, Edit, CheckCircle, Trash2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Document_VERSIONS_METADATA } from "@/app/types";
import LoadingCard from "@/app/components/LoadingCard";

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
  onVersionChange?: () => void;
};

export default function ResumeVersions({
  documentId,
  documentName,
  onBack,
  onVersionChange,
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
    e.stopPropagation();
    try {
      if (!editedName.trim()) {
        toast.error("Name cannot be empty");
        return;
      }

      const { data, error } = await supabase
        .from("document_versions")
        .update({
          name: editedName,
          updated_at: new Date().toISOString(),
        })
        .eq("id", version.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update the versions list with the renamed version
      setVersions((prev) =>
        prev.map((v) => (v.id === version.id ? data : v))
      );
      setEditingVersion(null);
      toast.success("Version renamed successfully");

      // 调用回调通知父组件版本已更改
      if (onVersionChange) {
        onVersionChange();
      }
    } catch (error) {
      console.error("Error renaming version:", error);
      toast.error("Failed to rename version");
    }
  };

  const handleDeleteVersion = async (version: ResumeVersion, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setDeletingVersion(version.id);

      // If this is the only version, ask about deleting the entire document
      if (versions.length === 1) {
        const confirmDelete = window.confirm(
          "This is the only version. Deleting it will remove the entire document. Continue?"
        );

        if (!confirmDelete) {
          setDeletingVersion(null);
          return;
        }

        // Delete the document (will cascade to delete versions)
        const { error } = await supabase
          .from("documents")
          .delete()
          .eq("id", documentId);

        if (error) throw error;

        toast.success("Document deleted successfully");
        router.push("/tools/resume");
        return;
      }

      // Delete the specific version
      const { error } = await supabase
        .from("document_versions")
        .delete()
        .eq("id", version.id);

      if (error) throw error;

      // Update local state
      setVersions((prev) => prev.filter((v) => v.id !== version.id));
      toast.success("Version deleted successfully");

      // 调用回调通知父组件版本已更改
      if (onVersionChange) {
        onVersionChange();
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
          <div className="flex justify-center py-8 bg-sand rounded-xl shadow-sm border border-bronze/20 p-5">
            <LoadingCard message="Loading versions..." />
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-8 px-4 bg-sand rounded-xl shadow-sm border border-bronze/20">
            <p className="text-black mb-2">No versions found</p>
            <p className="text-sm text-black">
              This resume doesn't have any versions yet
            </p>
          </div>
        ) : (
          versions.map((version) => (
            <div
              key={version.id}
              className={`bg-sand rounded-xl shadow-sm border border-bronze/20 p-5 hover:border-bronze/40 transition-colors ${editingVersion !== version.id ? "cursor-pointer" : ""}`}
              onClick={() => handleCardClick(version)}
            >
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center">
                  {editingVersion === version.id ? (
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="border-b border-bronze focus:outline-none focus:border-bronze px-1 text-lg font-medium"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <h3 className="font-medium text-lg text-bronze">
                      {version.name || `Version ${version.version_number}`}
                    </h3>
                  )}
                  {version.version_number ===
                    Math.max(...versions.map((v) => v.version_number)) && (
                    <span className="ml-2 bg-gold/30 text-bronze text-xs px-2 py-0.5 rounded-full">
                      Latest
                    </span>
                  )}
                </div>
                <div className="flex items-center text-xs text-cement">
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
                    className="py-2 px-3 rounded-lg font-medium text-sm bg-gold text-bronze flex items-center justify-center"
                    onClick={(e) => handleSaveRename(version, e)}
                  >
                    <CheckCircle size={14} className="mr-1.5" />
                    Save
                  </motion.button>
                ) : (
                  <>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      className="py-2 px-3 rounded-lg font-medium text-sm bg-gold/70 text-bronze flex items-center justify-center"
                      onClick={(e) => handleStartRename(version, e)}
                    >
                      <Edit size={14} className="mr-1.5" />
                      Rename
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      className="py-2 px-3 rounded-lg font-medium text-sm bg-tomato/30 text-tomato flex items-center justify-center"
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
