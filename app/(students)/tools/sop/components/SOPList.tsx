"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Eye,
  CheckCircle,
  Edit,
  Trash2,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useUserStore } from "@/store/userStore";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Document_METADATA } from "@/app/types";

type SOPItem = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  metadata: Document_METADATA;
};

export default function SOPList() {
  const supabase = createClient();
  const { user } = useUserStore();
  const router = useRouter();
  const [sops, setSOPs] = useState<SOPItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editMode, setEditMode] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    if (user) {
      fetchSOPs();
    }
  }, [user]);

  const fetchSOPs = async () => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("user_id", user?.id)
        .eq("type", "sop")
        .order("updated_at", { ascending: false });

      if (error) {
        throw error;
      }

      setSOPs(data || []);
    } catch (error) {
      console.error("Error fetching SOPs:", error);
      toast.error("Failed to load SOPs");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartEdit = (sop: SOPItem, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    setEditMode(sop.id);
    setEditName(sop.name);
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

      setSOPs((prev) =>
        prev.map((sop) => (sop.id === id ? data : sop))
      );
      setEditMode(null);
      toast.success("SOP renamed successfully");
    } catch (error) {
      console.error("Error updating SOP:", error);
      toast.error("Failed to rename SOP");
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    try {
      const { error } = await supabase.from("documents").delete().eq("id", id);

      if (error) {
        throw error;
      }

      setSOPs((prev) => prev.filter((sop) => sop.id !== id));
      toast.success("SOP deleted successfully");
    } catch (error) {
      console.error("Error deleting SOP:", error);
      toast.error("Failed to delete SOP");
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

  const handleViewVersions = (sop: SOPItem) => {
    router.push(`/tools/sop/${sop.id}`);
  };

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="flex justify-center items-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-gray-500">Loading SOPs...</span>
        </div>
      ) : sops.length === 0 ? (
        <div className="text-center py-12 px-4 border rounded-xl bg-gray-50">
          <p className="text-gray-500 mb-2">No SOPs found</p>
          <p className="text-sm text-gray-400">
            Use the Upload SOP button to get started
          </p>
        </div>
      ) : (
        sops.map((sop) => (
          <div
            key={sop.id}
            className="border rounded-xl p-5 hover:border-blue-200 transition-colors cursor-pointer relative"
            onClick={() => handleViewVersions(sop)}
          >
            {editMode === sop.id ? (
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
                  onClick={(e) => handleSaveEdit(sop.id, e)}
                  className="text-green-600"
                >
                  <CheckCircle size={18} />
                </motion.button>
              </div>
            ) : (
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center">
                  <h3 className="font-medium text-lg">{sop.name}</h3>
                </div>
                <div className="flex items-center">
                  <span className="text-xs text-gray-500 mr-2">
                    {formatDate(sop.updated_at)}
                  </span>
                  <ChevronRight size={16} className="text-gray-400" />
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center text-sm mb-4 text-gray-600">
              <span className="bg-gray-100 rounded-full px-3 py-1 text-xs mr-2 mb-1">
                Statement of Purpose
              </span>
              {sop.metadata?.original_file_name && (
                <span className="text-xs truncate max-w-[250px]">
                  From: {sop.metadata.original_file_name}
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
                  handleViewVersions(sop);
                }}
              >
                <Eye size={14} className="mr-1.5" />
                View Versions
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={(e) => handleStartEdit(sop, e)}
                className="text-xs bg-amber-50 text-amber-600 hover:bg-amber-100 py-1.5 px-3 rounded-lg flex items-center"
              >
                <Edit size={14} className="mr-1.5" />
                Rename
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={(e) => handleDelete(sop.id, e)}
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
  );
}
