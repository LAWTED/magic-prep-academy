"use client";

import { useEffect, useRef, useState } from "react";
import { getToken, onMessage, Unsubscribe } from "firebase/messaging";
import { fetchToken, messaging } from "@/firebase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useUserStore } from "@/store/userStore";
import { createClient } from "@/utils/supabase/client";

// 设置时间戳标记全局通知服务是否已初始化
let globalNotificationSetupTimestamp = 0;

async function getNotificationPermissionAndToken() {
  // Step 1: Check if Notifications are supported in the browser.
  if (!("Notification" in window)) {
    console.info("This browser does not support desktop notification");
    return null;
  }

  // Step 2: Check if permission is already granted.
  if (Notification.permission === "granted") {
    return await fetchToken();
  }

  // Step 3: If permission is not denied, request permission from the user.
  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      return await fetchToken();
    }
  }

  console.log("Notification permission not granted.");
  return null;
}

const useFcmToken = () => {
  const router = useRouter(); // Initialize the router for navigation.
  const [notificationPermissionStatus, setNotificationPermissionStatus] =
    useState<NotificationPermission | null>(null); // State to store the notification permission status.
  const [token, setToken] = useState<string | null>(null); // State to store the FCM token.
  const retryLoadToken = useRef(0); // Ref to keep track of retry attempts.
  const isLoading = useRef(false); // Ref to keep track if a token fetch is currently in progress.
  const { user } = useUserStore();
  const supabase = createClient();
  const hasSavedToken = useRef(false);

  // 全局消息监听器设置
  const setupGlobalMessageListener = async (fcmToken: string) => {
    // 检查是否已经设置过全局监听器（避免重复设置）
    const currentTime = Date.now();
    if (currentTime - globalNotificationSetupTimestamp < 60000) {
      // 如果在1分钟内已经设置过，则跳过
      return;
    }

    try {
      const messagingInstance = await messaging();
      if (!messagingInstance) return;

      console.log("Setting up global FCM listener for all pages");

      // 设置消息监听器
      onMessage(messagingInstance, (payload) => {
        console.log("FCM message received from global listener:", payload);

        // 处理通知
        const link = payload.fcmOptions?.link || payload.data?.link;

        if (link) {
          toast.info(
            `${payload.notification?.title}: ${payload.notification?.body}`,
            {
              action: {
                label: "View",
                onClick: () => {
                  if (typeof window !== 'undefined') {
                    window.location.href = link;
                  }
                },
              },
              duration: 8000,
            }
          );
        } else {
          toast.info(
            `${payload.notification?.title}: ${payload.notification?.body}`,
            { duration: 8000 }
          );
        }
      });

      // 更新时间戳标记
      globalNotificationSetupTimestamp = currentTime;
      console.log("Global notification listener set up successfully");
    } catch (error) {
      console.error("Error setting up global notification listener:", error);
    }
  };

  const saveTokenToDatabase = async (fcmToken: string) => {
    if (!user?.id || hasSavedToken.current) return;

    try {
      console.log("Attempting to save FCM token to database for user:", user.id);
      console.log("User role:", user.role);
      console.log("Token (first 10 chars):", fcmToken.substring(0, 10) + "...");

      // 检查用户是否禁用了通知（从localStorage中）
      const table = user.role === 'mentor' ? 'mentors' : 'users';
      const storageKey = `notifications_${user.role}_${user.id}`;
      const storedPreference = localStorage.getItem(storageKey);

      // 如果用户明确禁用了通知，不自动保存token
      if (storedPreference === 'disabled') {
        console.log("User has disabled notifications in preferences - not auto-saving token");
        return;
      }

      // 否则，正常保存token
      if (user.role === 'mentor') {
        const { error } = await supabase
          .from('mentors')
          .update({ fcm_token: fcmToken })
          .eq('id', user.id);

        if (error) {
          console.error("Error saving FCM token to mentors table:", error);
          return;
        }
        console.log("FCM token saved successfully to mentors table");
        // 记录已启用通知
        localStorage.setItem(storageKey, 'enabled');
      } else {
        const { error } = await supabase
          .from('users')
          .update({ fcm_token: fcmToken })
          .eq('id', user.id);

        if (error) {
          console.error("Error saving FCM token to users table:", error);
          return;
        }
        console.log("FCM token saved successfully to users table");
        // 记录已启用通知
        localStorage.setItem(storageKey, 'enabled');
      }

      hasSavedToken.current = true;

      // 设置全局消息监听器，确保在任何页面都能接收通知
      await setupGlobalMessageListener(fcmToken);
    } catch (error) {
      console.error('Error saving FCM token to database:', error);
    }
  };

  const loadToken = async () => {
    // Step 4: Prevent multiple fetches if already fetched or in progress.
    if (isLoading.current) return;

    isLoading.current = true; // Mark loading as in progress.
    const token = await getNotificationPermissionAndToken(); // Fetch the token.

    // Step 5: Handle the case where permission is denied.
    if (Notification.permission === "denied") {
      setNotificationPermissionStatus("denied");
      console.info(
        "%cPush Notifications issue - permission denied",
        "color: green; background: #c7c7c7; padding: 8px; font-size: 20px"
      );
      isLoading.current = false;
      return;
    }

    // Step 6: Retry fetching the token if necessary. (up to 3 times)
    // This step is typical initially as the service worker may not be ready/installed yet.
    if (!token) {
      if (retryLoadToken.current >= 3) {
        toast.error("Unable to load token, refresh the browser");
        console.info(
          "%cPush Notifications issue - unable to load token after 3 retries",
          "color: green; background: #c7c7c7; padding: 8px; font-size: 20px"
        );
        isLoading.current = false;
        return;
      }

      retryLoadToken.current += 1;
      console.error("An error occurred while retrieving token. Retrying...");
      isLoading.current = false;
      await loadToken();
      return;
    }

    // Step 7: Set the fetched token and mark as fetched.
    setNotificationPermissionStatus(Notification.permission);
    setToken(token);

    // 除了保存token到数据库，还要设置全局监听器
    if (token && user?.id) {
      await saveTokenToDatabase(token);
      // 设置全局消息监听器
      await setupGlobalMessageListener(token);
    }

    isLoading.current = false;
  };

  useEffect(() => {
    // Step 8: Initialize token loading when the component mounts.
    if ("Notification" in window) {
      loadToken();
    }
  }, []);

  // When user changes, update the token in database
  useEffect(() => {
    if (token && user?.id && !hasSavedToken.current) {
      saveTokenToDatabase(token);
    }
  }, [token, user]);

  useEffect(() => {
    const setupListener = async () => {
      if (!token) return; // Exit if no token is available.

      console.log(`onMessage registered with token ${token}`);
      const m = await messaging();
      if (!m) return;

      // Step 9: Register a listener for incoming FCM messages.
      const unsubscribe = onMessage(m, (payload) => {
        if (Notification.permission !== "granted") return;

        console.log("Foreground push notification received:", payload);
        const link = payload.fcmOptions?.link || payload.data?.link;

        if (link) {
          toast.info(
            `${payload.notification?.title}: ${payload.notification?.body}`,
            {
              action: {
                label: "Visit",
                onClick: () => {
                  const link = payload.fcmOptions?.link || payload.data?.link;
                  if (link) {
                    router.push(link);
                  }
                },
              },
            }
          );
        } else {
          toast.info(
            `${payload.notification?.title}: ${payload.notification?.body}`
          );
        }

        // --------------------------------------------
        // Disable this if you only want toast notifications.
        const n = new Notification(
          payload.notification?.title || "New message",
          {
            body: payload.notification?.body || "This is a new message",
            data: link ? { url: link } : undefined,
          }
        );

        // Step 10: Handle notification click event to navigate to a link if present.
        n.onclick = (event) => {
          event.preventDefault();
          const link = (event.target as any)?.data?.url;
          if (link) {
            router.push(link);
          } else {
            console.log("No link found in the notification payload");
          }
        };
        // --------------------------------------------
      });

      return unsubscribe;
    };

    let unsubscribe: Unsubscribe | null = null;

    setupListener().then((unsub) => {
      if (unsub) {
        unsubscribe = unsub;
      }
    });

    // Step 11: Cleanup the listener when the component unmounts.
    return () => unsubscribe?.();
  }, [token, router, toast]);

  return { token, notificationPermissionStatus }; // Return the token and permission status.
};

export default useFcmToken;
