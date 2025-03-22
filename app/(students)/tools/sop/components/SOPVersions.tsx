"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Loader2,
  CheckCircle,
  Edit,
  Trash2,
  Eye,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { Document_VERSIONS_METADATA } from "@/app/types";
type SOPVersion = {
  id: string;
  document_id: string;
  user_id: string;
  version_number: number;
  name: string | null;
  is_current: boolean;
  created_at: string;
  updated_at: string;
  metadata: Document_VERSIONS_METADATA;
};

type SOPVersionsProps = {
  documentId: string;
  documentName: string;
  onBack: () => void;
};

export default function SOPVersions({
  documentId,
  documentName,
  onBack,
}: SOPVersionsProps) {
  const supabase = createClient();
  const router = useRouter();
  const [versions, setVersions] = useState<SOPVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingVersion, setEditingVersion] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    if (documentId) {
      fetchVersions();
    }
  }, [documentId]);

  const fetchVersions = async () => {
    try {
      setIsLoading(true);
      setError(null);

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
      console.error("Error fetching SOP versions:", error);
      setError("Failed to load SOP versions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartEdit = (version: SOPVersion, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingVersion(version.id);
    setEditName(version.name || `Version ${version.version_number}`);
  };

  const handleSaveEdit = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editName.trim()) return;

    try {
      const { data, error } = await supabase
        .from("document_versions")
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

      setVersions((prev) =>
        prev.map((version) => (version.id === id ? data : version))
      );
      setEditingVersion(null);
      toast.success("Version renamed successfully");
    } catch (error) {
      console.error("Error updating version:", error);
      toast.error("Failed to rename version");
    }
  };

  const handleDeleteVersion = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // Check if this is the only version
      if (versions.length === 1) {
        // Ask if they want to delete the entire document
        if (
          !confirm(
            "This is the only version. Deleting it will remove the entire SOP. Continue?"
          )
        ) {
          return;
        }

        // Delete the document (which cascades to versions)
        const { error: docError } = await supabase
          .from("documents")
          .delete()
          .eq("id", documentId);

        if (docError) {
          throw docError;
        }

        toast.success("SOP deleted successfully");
        router.push("/tools/sop");
        return;
      }

      // Otherwise just delete this version
      const { error } = await supabase
        .from("document_versions")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }

      setVersions((prev) => prev.filter((version) => version.id !== id));
      toast.success("Version deleted successfully");
    } catch (error) {
      console.error("Error deleting version:", error);
      toast.error("Failed to delete version");
    }
  };

  const handleCardClick = (version: SOPVersion) => {
    if (editingVersion) return; // Don't navigate if in edit mode
    router.push(`/tools/sop/${documentId}/${version.id}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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
              This SOP doesn't have any versions yet
            </p>
          </div>
        ) : (
          versions.map((version) => (
            <div
              key={version.id}
              className={`bg-white rounded-xl shadow-sm border p-5 hover:border-blue-200 transition-colors ${
                editingVersion !== version.id ? "cursor-pointer" : ""
              }`}
              onClick={() => handleCardClick(version)}
            >
              <div className="flex justify-between items-center mb-2">
                {editingVersion === version.id ? (
                  <div
                    className="flex items-center flex-1"
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
                      onClick={(e) => handleSaveEdit(version.id, e)}
                      className="text-green-600"
                    >
                      <CheckCircle size={18} />
                    </motion.button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center">
                      <h3 className="font-medium text-lg">
                        {version.name || `Version ${version.version_number}`}
                      </h3>
                      {version.version_number ===
                        Math.max(...versions.map((v) => v.version_number)) && (
                        <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                          Latest
                        </span>
                      )}
                    </div>
                    <div className="flex items-center">
                      <span className="text-xs text-gray-500 mr-2">
                        {formatDate(version.created_at)}
                      </span>
                      <ChevronRight size={16} className="text-gray-400" />
                    </div>
                  </>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  className="text-xs bg-amber-50 text-amber-600 hover:bg-amber-100 py-1.5 px-3 rounded-lg flex items-center"
                  onClick={(e) => handleStartEdit(version, e)}
                >
                  <Edit size={14} className="mr-1.5" />
                  Rename
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  className="text-xs bg-red-50 text-red-600 hover:bg-red-100 py-1.5 px-3 rounded-lg flex items-center"
                  onClick={(e) => handleDeleteVersion(version.id, e)}
                >
                  <Trash2 size={14} className="mr-1.5" />
                  Delete
                </motion.button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
