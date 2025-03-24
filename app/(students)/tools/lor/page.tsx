"use client";

import { ArrowLeft, CheckCircle, Clock, FileCheck } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useUserStore } from "@/store/userStore";

interface RequestItem {
  id: string;
  mentor_name: string;
  program_name: string;
  school_name: string;
  status: string;
  created_at: string;
}

// Define the structure of the data from Supabase
interface RequestData {
  id: string;
  mentor_id: string;
  status: string;
  created_at: string;
  metadata: {
    program_name?: string;
    school_name?: string;
    [key: string]: any;
  };
  mentors: {
    name: string;
  };
}

export default function LoRPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUserStore();
  const supabase = createClient();

  useEffect(() => {
    async function fetchRequests() {
      if (!user?.id) return;

      try {
        setIsLoading(true);

        // Get the student's LOR requests
        const { data, error } = await supabase
          .from('mentor_student_interactions')
          .select(`
            id,
            mentor_id,
            status,
            created_at,
            metadata,
            mentors(name)
          `)
          .eq('student_id', user.id)
          .eq('type', 'lor_request')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching requests:', error);
          return;
        }

        if (data) {
          // Format the data for display
          const formattedRequests = (data as unknown as RequestData[]).map(item => ({
            id: item.id,
            mentor_name: item.mentors.name || 'Unknown Mentor',
            program_name: item.metadata?.program_name || 'Unknown Program',
            school_name: item.metadata?.school_name || 'Unknown School',
            status: item.status,
            created_at: new Date(item.created_at).toLocaleDateString()
          }));

          setRequests(formattedRequests);
        }
      } catch (error) {
        console.error('Error fetching requests:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRequests();
  }, [supabase, user]);

  // Get the status icon based on request status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <FileCheck size={16} className="text-green-600" />;
      case 'pending':
        return <Clock size={16} className="text-yellow-600" />;
      default:
        return <Clock size={16} className="text-gray-600" />;
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center mb-6">
        <Link href="/tools">
          <motion.div
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100"
          >
            <ArrowLeft size={20} />
          </motion.div>
        </Link>
        <h1 className="ml-3 text-2xl font-bold">Letter of Recommendation</h1>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl bg-purple-50 p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Request a Letter</h2>
          <p className="text-gray-700 mb-4">
            Get a recommendation letter from your mentors for your college applications.
          </p>

          <Link href="/tools/lor/findmentor">
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="mt-4 w-full py-3 rounded-lg font-semibold bg-purple-600 text-white"
            >
              Find a Mentor
            </motion.button>
          </Link>

          <Link href="/chat?person=phd-mentor">
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="mt-3 w-full py-3 rounded-lg font-semibold bg-indigo-600 text-white"
            >
              Ask a PhD Mentor
            </motion.button>
          </Link>
        </div>

        {/* Requests List */}
        <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Your Requests</h2>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
          ) : requests.length > 0 ? (
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{request.program_name}</h3>
                      <p className="text-sm text-gray-600">{request.school_name}</p>
                      <p className="text-xs text-gray-500 mt-1">Requested from {request.mentor_name} on {request.created_at}</p>
                    </div>
                    <div className="flex items-center bg-gray-100 px-3 py-1 rounded-full">
                      {getStatusIcon(request.status)}
                      <span className="text-xs ml-1 capitalize">{request.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>You haven't made any requests yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}