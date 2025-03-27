import admin from "firebase-admin";
import { Message } from "firebase-admin/messaging";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = require("@/service-key.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export async function POST(request: NextRequest) {
  const { receiverId, senderId, senderName, token, message, chatSessionId } = await request.json();

  console.log("Chat notification request:", {
    receiverId,
    senderId,
    senderName,
    hasToken: !!token,
    message: message.substring(0, 50) + (message.length > 50 ? "..." : ""),
    chatSessionId
  });

  if (!token || !receiverId || !senderId || !message) {
    return NextResponse.json(
      { success: false, error: "Missing required parameters" },
      { status: 400 }
    );
  }

  try {
    // Create appropriate title based on sender name
    const title = senderName ? `New message from ${senderName}` : "New message";

    // Create link based on receiver type (mentor or student)
    const link = receiverId.startsWith("mentor_")
      ? `/mentor/chat?chat=${chatSessionId}`
      : `/chat?person=${senderId}`;

    console.log("Creating notification with link:", link);

    // Create notification payload with link to chat
    const payload: Message = {
      token,
      notification: {
        title: title,
        body: message,
      },
      webpush: {
        fcmOptions: {
          link,
        },
      },
    };

    // Send notification
    await admin.messaging().send(payload);
    console.log("Notification sent successfully");

    return NextResponse.json({ success: true, message: "Notification sent!" });
  } catch (error) {
    console.error("Error sending notification:", error);
    return NextResponse.json({ success: false, error });
  }
}
