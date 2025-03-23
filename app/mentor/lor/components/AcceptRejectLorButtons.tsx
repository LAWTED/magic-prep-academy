"use client";

import React, { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface AcceptRejectLorButtonsProps {
  requestId: string;
}

export default function AcceptRejectLorButtons({
  requestId,
}: AcceptRejectLorButtonsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const router = useRouter();

  const handleAccept = async () => {
    setIsLoading(true);
    const supabase = createClient();

    try {
      // Get current request metadata first
      const { data: requestData, error: requestError } = await supabase
        .from("mentor_student_interactions")
        .select("metadata")
        .eq("id", requestId)
        .single();

      if (requestError) {
        throw requestError;
      }

      // Update status to accepted
      const { error } = await supabase
        .from("mentor_student_interactions")
        .update({
          status: "accepted",
          metadata: {
            ...requestData.metadata,
            accepted_at: new Date().toISOString(),
          },
        })
        .eq("id", requestId);

      if (error) {
        throw error;
      }

      toast.success("Request accepted successfully");
      router.refresh();
    } catch (error: any) {
      console.error("Error accepting request:", error);
      toast.error(error.message || "Failed to accept request");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = () => {
    setIsRejecting(true);
  };

  const confirmReject = async () => {
    setIsLoading(true);
    const supabase = createClient();

    try {
      // Get current request metadata first
      const { data: requestData, error: requestError } = await supabase
        .from("mentor_student_interactions")
        .select("metadata")
        .eq("id", requestId)
        .single();

      if (requestError) {
        throw requestError;
      }

      // Update status to rejected
      const { error } = await supabase
        .from("mentor_student_interactions")
        .update({
          status: "rejected",
          metadata: {
            ...requestData.metadata,
            rejected_at: new Date().toISOString(),
            rejection_reason: rejectionReason,
          },
        })
        .eq("id", requestId);

      if (error) {
        throw error;
      }

      toast.success("Request rejected successfully");
      router.refresh();
    } catch (error: any) {
      console.error("Error rejecting request:", error);
      toast.error(error.message || "Failed to reject request");
    } finally {
      setIsLoading(false);
      setIsRejecting(false);
      setRejectionReason("");
    }
  };

  const cancelReject = () => {
    setIsRejecting(false);
    setRejectionReason("");
  };

  if (isRejecting) {
    return (
      <div className="flex flex-col space-y-3 w-full sm:w-auto">
        <textarea
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          className="w-full p-2 border rounded-md text-sm"
          placeholder="Reason for rejection (optional)"
          rows={2}
        />
        <div className="flex gap-2">
          <button
            onClick={confirmReject}
            disabled={isLoading}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm disabled:opacity-50 disabled:pointer-events-none transition-colors"
          >
            {isLoading ? "Processing..." : "Confirm Reject"}
          </button>
          <button
            onClick={cancelReject}
            disabled={isLoading}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded-md text-sm disabled:opacity-50 disabled:pointer-events-none transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={handleAccept}
        disabled={isLoading}
        className="bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-2 rounded-md text-sm disabled:opacity-50 disabled:pointer-events-none transition-colors"
      >
        {isLoading ? "Processing..." : "Accept"}
      </button>
      <button
        onClick={handleReject}
        disabled={isLoading}
        className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-2 rounded-md text-sm disabled:opacity-50 disabled:pointer-events-none transition-colors"
      >
        Reject
      </button>
    </>
  );
}