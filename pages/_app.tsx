import { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import '../styles/globals.css';
import { messaging, onMessage } from '../firebase';
import { toast } from 'sonner';

// Global notification listener component
function NotificationListener() {
  const router = useRouter();

  useEffect(() => {
    let unsubscribe: () => void;

    const setupMessaging = async () => {
      try {
        const messagingInstance = await messaging();
        if (!messagingInstance) return;

        console.log('Setting up global notification listener');

        unsubscribe = onMessage(messagingInstance, (payload) => {
          console.log('Foreground message received in global listener:', payload);

          const link = payload.fcmOptions?.link || payload.data?.link;

          if (link) {
            toast.info(
              `${payload.notification?.title}: ${payload.notification?.body}`,
              {
                action: {
                  label: 'View',
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
        console.error('Error setting up global notification listener:', error);
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

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <NotificationListener />
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;