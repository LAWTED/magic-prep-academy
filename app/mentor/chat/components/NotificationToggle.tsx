"use client";

import { Bell, BellOff } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { createClient } from "@/utils/supabase/client";

type NotificationToggleProps = {
  userId: string | undefined;
  userRole: "student" | "mentor";
  fcmToken: string | null;
  notificationPermissionStatus: NotificationPermission | null;
};

export function NotificationToggle({
  userId,
  userRole,
  fcmToken,
  notificationPermissionStatus,
}: NotificationToggleProps) {
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const supabase = createClient();

  // 检查通知状态：优先使用localStorage，然后才检查数据库
  useEffect(() => {
    if (!userId) return;

    const checkNotificationStatus = async () => {
      try {
        // 先从localStorage获取用户偏好设置
        const storageKey = `notifications_${userRole}_${userId}`;
        const storedPreference = localStorage.getItem(storageKey);

        if (storedPreference !== null) {
          // 如果有存储的偏好设置，使用它
          setIsEnabled(storedPreference === "enabled");
          return;
        }

        // 如果没有存储的偏好，检查数据库中是否有token
        const table = userRole === "mentor" ? "mentors" : "users";
        const { data, error } = await supabase
          .from(table)
          .select("fcm_token")
          .eq("id", userId)
          .single();

        if (!error && data && data.fcm_token) {
          setIsEnabled(true);
          // 保存到localStorage
          localStorage.setItem(storageKey, "enabled");
        } else {
          // 默认为关闭
          localStorage.setItem(storageKey, "disabled");
        }
      } catch (error) {
        console.error("Error checking notification status:", error);
      }
    };

    checkNotificationStatus();
  }, [userId, userRole, supabase]);

  // 处理通知权限请求和保存token
  const handleToggleNotification = async () => {
    if (!userId) return;

    const storageKey = `notifications_${userRole}_${userId}`;

    if (isEnabled) {
      // 已开启状态，进行关闭
      try {
        const table = userRole === "mentor" ? "mentors" : "users";
        const { error } = await supabase
          .from(table)
          .update({ fcm_token: null })
          .eq("id", userId);

        if (error) {
          console.error("Error disabling notifications:", error);
          toast.error("Failed to disable notifications");
          return;
        }

        // 更新UI状态
        setIsEnabled(false);

        // 保存到localStorage
        localStorage.setItem(storageKey, "disabled");

        toast.info("Notifications disabled", {
          description: "You won't receive message notifications anymore",
          icon: <BellOff className="h-5 w-5 text-blue-500" />,
        });
      } catch (err) {
        console.error("Error:", err);
        toast.error("An error occurred");
      }
    } else {
      // 已关闭状态，进行开启
      if (notificationPermissionStatus === "granted" && fcmToken) {
        // 已有权限，保存token
        await saveFcmTokenToDb(storageKey);
      } else if (notificationPermissionStatus === "denied") {
        // 权限被拒绝，需要在浏览器设置中更改
        toast.error("Please enable notifications in your browser settings");
      } else {
        // 请求权限
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          // 重新获取token（通过页面刷新）
          // 先保存用户意图
          localStorage.setItem(storageKey, "enabled");
          window.location.reload();
        } else {
          toast.error("Notification permission denied");
        }
      }
    }
  };

  // 保存FCM token到数据库
  const saveFcmTokenToDb = async (storageKey: string) => {
    if (!fcmToken || !userId) return;

    try {
      const table = userRole === "mentor" ? "mentors" : "users";
      const { error } = await supabase
        .from(table)
        .update({ fcm_token: fcmToken })
        .eq("id", userId);

      if (error) {
        console.error("Error saving FCM token:", error);
        toast.error("Failed to enable notifications");
        return;
      }

      // 更新UI状态
      setIsEnabled(true);

      // 保存到localStorage
      localStorage.setItem(storageKey, "enabled");

      toast.success("Notifications enabled", {
        icon: <Bell className="h-5 w-5 text-green-500" />,
      });
    } catch (err) {
      console.error("Error:", err);
      toast.error("An error occurred");
    }
  };

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={handleToggleNotification}
      className={`p-2 rounded-full transition-colors ${
        isEnabled ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500"
      }`}
      title={isEnabled ? "Disable notifications" : "Enable notifications"}
    >
      {isEnabled ? <Bell size={18} /> : <BellOff size={18} />}
    </motion.button>
  );
}
