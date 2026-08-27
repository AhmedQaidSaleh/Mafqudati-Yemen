importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in the service worker with official config
firebase.initializeApp({
  apiKey: "AIzaSyC-nhme-YmCBu8HRY4SnB5Pk5X3nGlwEhk",
  authDomain: "mafqudati-d3b18.firebaseapp.com",
  projectId: "mafqudati-d3b18",
  storageBucket: "mafqudati-d3b18.firebasestorage.app",
  messagingSenderId: "814555977272",
  appId: "1:814555977272:web:400a74ecd677047a2378cd"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message: ', payload);

  const title = payload.notification?.title || payload.data?.title || 'منصة مفقوداتي';
  const body = payload.notification?.body || payload.data?.body || 'لديك إشعار جديد في منصة مفقوداتي.';
  const icon = payload.notification?.icon || payload.data?.icon || '/logo.png';
  const targetUrl = payload.data?.url || payload.notification?.click_action || '/notifications';

  const notificationOptions = {
    body: body,
    icon: icon,
    badge: '/favicon.ico',
    tag: payload.data?.tag || 'mafqudati-alert-' + Date.now(),
    renotify: true,
    data: {
      url: targetUrl,
      ...payload.data
    },
    actions: [
      { action: 'open', title: 'عرض التفاصيل' },
      { action: 'dismiss', title: 'إغلاق' }
    ]
  };

  return self.registration.showNotification(title, notificationOptions);
});

// Handle clicking on notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/notifications';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already an open tab with our origin
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // If no tab is open, open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
