"use client";

import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { useUserStore } from "@/store/userStore";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import ResumeVersions from "../components/ResumeVersions";

type ResumeDocument = {
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

export default function ResumeVersionsPage() {
  const supabase = createClient();
  const { user } = useUserStore();
  const params = useParams();
  const documentId = params.id as string;

  const [resumeDocument, setResumeDocument] = useState<ResumeDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (documentId && user) {
      fetchResumeDocument();
    }
  }, [documentId, user]);

  const fetchResumeDocument = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .eq('user_id', user?.id)
        .single();

      if (error) {
        throw error;
      }

      setResumeDocument(data);
    } catch (error) {
      console.error('Error fetching resume document:', error);
      setError('Failed to load resume. It might not exist or you may not have permission to view it.');
      toast.error('Failed to load resume document');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 pb-20 w-full">
      <div className="flex items-center mb-6">
        <Link href="/tools/resume">
          <motion.div
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100"
          >
            <ArrowLeft size={20} />
          </motion.div>
        </Link>
        {isLoading ? (
          <h1 className="ml-3 text-2xl font-bold">Loading Resume...</h1>
        ) : (
          <h1 className="ml-3 text-2xl font-bold">{resumeDocument?.name || "Resume Not Found"}</h1>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="text-center py-8 bg-white rounded-xl shadow-sm border p-5">
          <p className="text-red-500 mb-2">{error}</p>
          <Link href="/tools/resume">
            <span className="text-blue-600 hover:underline">Return to Resume List</span>
          </Link>
        </div>
      ) : resumeDocument ? (
        <ResumeVersions
          documentId={documentId}
          documentName={resumeDocument.name}
          onBack={() => {}} // Not used since we have the Link above
        />
      ) : (
        <div className="text-center py-8 bg-white rounded-xl shadow-sm border p-5">
          <p className="text-gray-500 mb-2">Resume not found</p>
          <Link href="/tools/resume">
            <span className="text-blue-600 hover:underline">Return to Resume List</span>
          </Link>
        </div>
      )}
    </div>
  );
}