import { getApp, getApps, initializeApp } from "firebase/app";
import { getMessaging, getToken, isSupported, onMessage as firebaseOnMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyAbFKUxYhB4kPFvEaytRhjF8R4OPkF7yHY",
  authDomain: "magic-prep-academy.firebaseapp.com",
  projectId: "magic-prep-academy",
  storageBucket: "magic-prep-academy.firebasestorage.app",
  messagingSenderId: "348780890420",
  appId: "1:348780890420:web:4e32e82acdaf8a10c73d61",
  measurementId: "G-XDEY39KBHZ",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const messaging = async () => {
  const supported = await isSupported();
  return supported ? getMessaging(app) : null;
};

export const fetchToken = async () => {
  try {
    const fcmMessaging = await messaging();
    if (fcmMessaging) {
      const token = await getToken(fcmMessaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_FCM_VAPID_KEY,
      });
      return token;
    }
    return null;
  } catch (err) {
    console.error("An error occurred while fetching the token:", err);
    return null;
  }
};

export const onMessage = firebaseOnMessage;

export { app, messaging };
