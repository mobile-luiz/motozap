// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js');

firebase.initializeApp({
    apiKey: "AIzaSyAQ5TIcslVidUaALCdoDb7G8j7rolAfT8w",
    authDomain: "moto-c3a72.firebaseapp.com",
    databaseURL: "https://moto-c3a72-default-rtdb.firebaseio.com",
    projectId: "moto-c3a72",
    storageBucket: "moto-c3a72.firebasestorage.app",
    messagingSenderId: "721172312364",
    appId: "1:721172312364:web:7c4078a036d47add743c89",
    measurementId: "G-DSHQPKN8HK"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('Background message received:', payload);
    
    const notificationTitle = payload.notification?.title || 'MotoZap';
    const notificationOptions = {
        body: payload.notification?.body || 'Nova notificação',
        icon: 'https://cdn-icons-png.flaticon.com/512/2965/2965358.png',
        data: payload.data || {},
        actions: []
    };
    
    // Add actions based on notification type
    if (payload.data?.type === 'new-ride') {
        notificationOptions.actions = [
            { action: 'accept', title: '✅ Aceitar' },
            { action: 'decline', title: '❌ Recusar' }
        ];
    } else if (payload.data?.type === 'ride-accepted') {
        notificationOptions.actions = [
            { action: 'whatsapp', title: '💬 WhatsApp' }
        ];
    }
    
    self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    const notificationData = event.notification.data || {};
    const action = event.action;
    
    event.waitUntil(
        clients.matchAll({type: 'window', includeUncontrolled: true})
        .then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes('/') && 'focus' in client) {
                    client.postMessage({
                        type: 'NOTIFICATION_CLICK',
                        data: notificationData,
                        action: action
                    });
                    return client.focus();
                }
            }
            
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});