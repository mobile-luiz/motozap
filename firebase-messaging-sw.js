// firebase-messaging-sw.js - VERSÃO CORRIGIDA

importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js');

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAQ5TIcslVidUaALCdoDb7G8j7rolAfT8w",
    authDomain: "moto-c3a72.firebaseapp.com",
    databaseURL: "https://moto-c3a72-default-rtdb.firebaseio.com",
    projectId: "moto-c3a72",
    storageBucket: "moto-c3a72.firebasestorage.app",
    messagingSenderId: "721172312364",
    appId: "1:721172312364:web:7c4078a036d47add743c89",
    measurementId: "G-DSHQPKN8HK"
};

// Inicializar Firebase no Service Worker
firebase.initializeApp(firebaseConfig);

// Obter instância do Firebase Messaging
const messaging = firebase.messaging();

// IMPORTANTE: Configurar o handler de mensagens em background CORRETAMENTE
messaging.setBackgroundMessageHandler(async (payload) => {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);
    
    // Extrair dados da notificação
    const notificationTitle = payload.data?.title || 
                              payload.notification?.title || 
                              'MotoZap';
    
    const notificationBody = payload.data?.body || 
                             payload.notification?.body || 
                             payload.data?.message ||
                             'Nova notificação do MotoZap';
    
    // Opções da notificação
    const notificationOptions = {
        body: notificationBody,
        icon: 'https://cdn-icons-png.flaticon.com/512/2965/2965358.png',
        badge: 'https://cdn-icons-png.flaticon.com/512/2965/2965358.png',
        tag: 'motozap-notification',
        data: payload.data || payload
    };
    
    // Adicionar ações baseadas no tipo de notificação
    if (payload.data?.type === 'new-ride' && payload.data?.rideId) {
        notificationOptions.actions = [
            {
                action: 'accept',
                title: '✅ Aceitar'
            },
            {
                action: 'decline',
                title: '❌ Recusar'
            }
        ];
    } else if (payload.data?.type === 'ride-accepted') {
        notificationOptions.actions = [
            {
                action: 'whatsapp',
                title: '💬 WhatsApp'
            }
        ];
    }
    
    console.log('[firebase-messaging-sw.js] Showing background notification');
    
    // MOSTRAR A NOTIFICAÇÃO - Esta linha está CORRETA agora
    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Evento de clique na notificação (manter como está)
self.addEventListener('notificationclick', function(event) {
    console.log('[firebase-messaging-sw.js] Notification click:', event);
    
    event.notification.close();
    
    const notificationData = event.notification.data || {};
    
    // ... resto do código permanece igual ...
});

// Eventos de instalação/ativação (manter como está)
self.addEventListener('install', function(event) {
    console.log('[firebase-messaging-sw.js] Service Worker instalado');
    self.skipWaiting();
});

self.addEventListener('activate', function(event) {
    console.log('[firebase-messaging-sw.js] Service Worker ativado');
    event.waitUntil(clients.claim());
});