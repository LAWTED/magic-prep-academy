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
import LoadingCard from "@/app/components/LoadingCard";

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

      setSOPs((prev) => prev.map((sop) => (sop.id === id ? data : sop)));
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
        <div className="flex justify-center py-8">
          <LoadingCard message="Loading SOPs..." />
        </div>
      ) : sops.length === 0 ? (
        <div className="text-center py-8 text-black">
          <p>You haven't uploaded any SOPs yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sops.map((sop) => (
            <div
              key={sop.id}
              className="border-b border-bronze/10 pb-4 last:border-0 last:pb-0"
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
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-bronze">{sop.name}</h3>
                    <p className="text-xs text-black mt-1">
                      Updated on {formatDate(sop.updated_at)}
                    </p>
                  </div>
                  <div className="flex items-center bg-gold/30 px-3 py-1 rounded-full">
                    <span className="text-xs capitalize text-bronze">SOP</span>
                  </div>
                </div>
              )}

              <div
                className="flex flex-wrap gap-2 mt-3"
                onClick={(e) => e.stopPropagation()}
              >
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  className="text-sm text-skyblue bg-skyblue/20 font-medium py-1.5 px-3 rounded-lg flex items-center"
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
                  className="py-2 px-3 rounded-lg font-medium text-sm bg-gold/70 text-bronze flex items-center justify-center"
                >
                  <Edit size={14} className="mr-1.5" />
                  Rename
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => handleDelete(sop.id, e)}
                  className="py-2 px-3 rounded-lg font-medium text-sm bg-tomato/30 text-tomato flex items-center justify-center"
                >
                  <Trash2 size={14} className="mr-1.5" />
                  Delete
                </motion.button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
