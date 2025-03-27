importScripts("https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js");
importScripts(
  "https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js"
);

const firebaseConfig = {
  apiKey: "AIzaSyAbFKUxYhB4kPFvEaytRhjF8R4OPkF7yHY",
  authDomain: "magic-prep-academy.firebaseapp.com",
  projectId: "magic-prep-academy",
  storageBucket: "magic-prep-academy.firebasestorage.app",
  messagingSenderId: "348780890420",
  appId: "1:348780890420:web:4e32e82acdaf8a10c73d61",
  measurementId: "G-XDEY39KBHZ"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// 处理后台通知
messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );

  // payload.fcmOptions?.link comes from our backend API route handle
  // payload.data.link comes from the Firebase Console where link is the 'key'
  const link = payload.fcmOptions?.link || payload.data?.link;

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "./logo.png",
    data: { url: link || '/' },
    tag: `chat-notification-${Date.now()}`, // 使用唯一标签，避免通知堆积
    requireInteraction: true, // 通知会持续显示，直到用户与之交互
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// 处理通知点击事件
self.addEventListener("notificationclick", function (event) {
  console.log("[firebase-messaging-sw.js] Notification click received.", event.notification);

  // 关闭通知
  event.notification.close();

  // 获取通知中的链接URL
  const url = event.notification.data.url;
  if (!url) return;

  // 使用URL来导航
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (clientList) {
        // 尝试找到一个已打开的窗口/标签
        for (const client of clientList) {
          const clientUrl = new URL(client.url);
          const targetUrl = new URL(url, self.location.origin);

          // 如果目标URL的路径与客户端URL的路径相同，则聚焦该客户端
          if (clientUrl.pathname === targetUrl.pathname) {
            // 找到匹配的客户端，聚焦它
            console.log("[SW] Found matching client, focusing:", client.url);
            return client.focus();
          }
        }

        // 没有找到匹配的客户端，打开新窗口
        if (clients.openWindow) {
          console.log("[SW] Opening new window for URL:", url);
          return clients.openWindow(url);
        }
      })
      .catch(function(error) {
        console.error("[SW] Error handling notification click:", error);
      })
  );
});