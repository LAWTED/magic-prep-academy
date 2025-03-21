"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Loader2, Edit, CheckCircle } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type ResumeVersion = {
  id: string;
  name: string;
  version_number: number;
  created_at: string;
  updated_at: string;
  metadata: {
    content: any;
    format: string;
    original_file_name?: string;
    created_from_id?: string;
  };
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
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="text-xs bg-amber-50 text-amber-600 hover:bg-amber-100 py-1.5 px-3 rounded-lg flex items-center"
                    onClick={(e) => handleStartRename(version, e)}
                  >
                    <Edit size={14} className="mr-1.5" />
                    Rename
                  </motion.button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
