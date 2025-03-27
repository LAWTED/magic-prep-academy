"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { messaging, onMessage } from "@/firebase";

export function NotificationListener() {
  const router = useRouter();

  useEffect(() => {
    let unsubscribe: () => void;

    const setupMessaging = async () => {
      try {
        const messagingInstance = await messaging();
        if (!messagingInstance) return;

        console.log("Setting up global notification listener");

        unsubscribe = onMessage(messagingInstance, (payload) => {
          console.log(
            "Foreground message received in global listener:",
            payload
          );

          const link = payload.fcmOptions?.link || payload.data?.link;

          if (link) {
            toast.info(
              `${payload.notification?.title}: ${payload.notification?.body}`,
              {
                action: {
                  label: "View",
                  onClick: () => router.push(link),
                },
                duration: 5000,
              }
            );
          } else {
            toast.info(
              `${payload.notification?.title}: ${payload.notification?.body}`,
              { duration: 5000 }
            );
          }
        });
      } catch (error) {
        console.error("Error setting up global notification listener:", error);
      }
    };

    // Setup global messaging listener
    setupMessaging();

    // Cleanup
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [router]);

  return null;
}
