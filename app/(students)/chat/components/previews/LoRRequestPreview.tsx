"use client";

import { useState, useEffect } from "react";
import { FileText, Check, X, Clock, ExternalLink } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

interface LoRRequestPreviewProps {
  requestId: string;
  programName: string;
  schoolName: string;
}

export default function LoRRequestPreview({
  requestId,
  programName,
  schoolName,
}: LoRRequestPreviewProps) {
  const [status, setStatus] = useState<'pending' | 'accepted' | 'rejected'>('pending');
  const [isUpdating, setIsUpdating] = useState(false);
  const supabase = createClient();
  const pathname = usePathname();

  // Check if we're in the mentor section of the app
  const isMentorView = pathname.startsWith('/mentor');

  useEffect(() => {
    // Fetch the current status when component mounts
    async function fetchStatus() {
      try {
        const { data, error } = await supabase
          .from('mentor_student_interactions')
          .select('status')
          .eq('id', requestId)
          .single();

        if (error) {
          console.error('Error fetching LOR status:', error);
          return;
        }

        if (data && data.status) {
          setStatus(data.status as any);
        }
      } catch (error) {
        console.error('Error fetching status:', error);
      }
    }

    fetchStatus();
  }, [requestId, supabase]);

  if (!requestId) return null;

  // For mentors, always show the mentor view; for students show student view
  const lorPath = isMentorView
    ? `/mentor/lor/${requestId}`  // Mentor viewing the request
    : `/tools/lor`;  // Student always goes to their LOR list

  // Handle accept or reject request
  const handleUpdateStatus = async (newStatus: 'accepted' | 'rejected') => {
    if (isUpdating) return;

    try {
      setIsUpdating(true);

      // Update the status in the database
      const { error } = await supabase
        .from('mentor_student_interactions')
        .update({ status: newStatus })
        .eq('id', requestId);

      if (error) {
        console.error('Error updating LOR status:', error);
        throw error;
      }

      // Update local state
      setStatus(newStatus);

    } catch (error) {
      console.error('Error updating LOR request:', error);
      alert('There was an error updating the request. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Get status icon
  const getStatusIcon = () => {
    switch (status) {
      case 'accepted':
        return <Check size={16} className="text-green-600" />;
      case 'rejected':
        return <X size={16} className="text-red-600" />;
      default:
        return <Clock size={16} className="text-yellow-600" />;
    }
  };

  // Get status badge color
  const getStatusBadgeClass = () => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="mt-4 border-t pt-4">
      <div className="bg-purple-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <FileText size={18} className="text-purple-600 mr-2" />
            <h3 className="text-purple-800 font-medium">Letter of Recommendation Request</h3>
          </div>

          <div className={`px-2 py-1 rounded-full text-xs flex items-center ${getStatusBadgeClass()}`}>
            {getStatusIcon()}
            <span className="ml-1 capitalize">{status}</span>
          </div>
        </div>

        <p className="text-sm text-purple-700 mb-3">
          For {programName} at {schoolName}
        </p>

        {/* Action buttons based on role and status */}
        <div className="space-y-2">
          {/* For mentors, show accept/reject buttons if pending */}
          {isMentorView && status === 'pending' && (
            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleUpdateStatus('accepted')}
                disabled={isUpdating}
                className="flex-1 py-2 rounded-lg font-medium bg-green-600 text-white text-sm flex items-center justify-center"
              >
                {isUpdating ? (
                  <span className="flex items-center">
                    <Clock size={14} className="animate-spin mr-1" />
                    Updating...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Check size={14} className="mr-1" />
                    Accept
                  </span>
                )}
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleUpdateStatus('rejected')}
                disabled={isUpdating}
                className="flex-1 py-2 rounded-lg font-medium bg-red-600 text-white text-sm flex items-center justify-center"
              >
                {isUpdating ? (
                  <span className="flex items-center">
                    <Clock size={14} className="animate-spin mr-1" />
                    Updating...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <X size={14} className="mr-1" />
                    Decline
                  </span>
                )}
              </motion.button>
            </div>
          )}

          {/* Show view button based on status and user type */}
          {(status === 'accepted' || !isMentorView || status === 'rejected') && (
            <Link href={lorPath} className="block w-full">
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="w-full py-2 rounded-lg font-medium bg-purple-600 text-white text-sm flex items-center justify-center"
              >
                <ExternalLink size={14} className="mr-1" />
                {status === 'accepted' ? 'View Recommendation Letter' : 'View Request'}
              </motion.button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}