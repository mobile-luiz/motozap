// Importar scripts do Firebase
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

// Configurar o background handler (CORRIGIDO)
messaging.setBackgroundMessageHandler(async (payload) => {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);
    
    // Extrair dados da notificação
    const notificationTitle = payload.data?.title || payload.notification?.title || 'MotoZap';
    const notificationBody = payload.data?.body || payload.notification?.body || 'Nova notificação do MotoZap';
    
    // Personalizar a notificação
    const notificationOptions = {
        body: notificationBody,
        icon: 'https://cdn-icons-png.flaticon.com/512/2965/2965358.png',
        badge: 'https://cdn-icons-png.flaticon.com/512/2965/2965358.png',
        tag: 'motozap-notification',
        data: payload.data || payload,
        requireInteraction: true,
        actions: []
    };
    
    // Adicionar ações baseadas no tipo de notificação
    if (payload.data?.type === 'new-ride') {
        notificationOptions.actions = [
            {
                action: 'accept',
                title: '✅ Aceitar',
                icon: 'https://cdn-icons-png.flaticon.com/512/190/190411.png'
            },
            {
                action: 'decline',
                title: '❌ Recusar',
                icon: 'https://cdn-icons-png.flaticon.com/512/1828/1828843.png'
            }
        ];
    } else if (payload.data?.type === 'ride-accepted') {
        notificationOptions.actions = [
            {
                action: 'whatsapp',
                title: '💬 WhatsApp',
                icon: 'https://cdn-icons-png.flaticon.com/512/220/220236.png'
            }
        ];
    }
    
    // Mostrar a notificação
    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Evento de clique na notificação
self.addEventListener('notificationclick', function(event) {
    console.log('[firebase-messaging-sw.js] Notification click:', event);
    
    event.notification.close();
    
    const notificationData = event.notification.data || {};
    
    // Verificar qual ação foi clicada
    if (event.action === 'accept') {
        // Ação de aceitar corrida
        console.log('Ação: accept', notificationData);
    } else if (event.action === 'decline') {
        // Ação de recusar corrida
        console.log('Ação: decline', notificationData);
    } else if (event.action === 'whatsapp') {
        // Abrir WhatsApp
        if (notificationData.phone) {
            const phone = notificationData.phone.replace(/\D/g, '');
            const formattedPhone = phone.startsWith('55') ? phone : '55' + phone;
            const message = notificationData.message || 'Olá! Vi sua notificação do MotoZap.';
            const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
            
            event.waitUntil(
                clients.openWindow(whatsappUrl)
            );
            return;
        }
    }
    
    // Abrir/focar a janela do app
    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then(function(clientList) {
            // Verificar se já tem uma janela aberta
            for (const client of clientList) {
                if (client.url.includes('/') && 'focus' in client) {
                    return client.focus().then(() => {
                        // Enviar mensagem para a janela
                        if (client.postMessage) {
                            client.postMessage({
                                type: 'NOTIFICATION_CLICK',
                                data: notificationData,
                                action: event.action
                            });
                        }
                    });
                }
            }
            
            // Se não houver janela aberta, abrir uma nova
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});

// Evento de instalação do Service Worker
self.addEventListener('install', function(event) {
    console.log('[firebase-messaging-sw.js] Service Worker instalado');
    self.skipWaiting();
});

// Evento de ativação do Service Worker
self.addEventListener('activate', function(event) {
    console.log('[firebase-messaging-sw.js] Service Worker ativado');
    event.waitUntil(clients.claim());
});

// Receber mensagens da janela principal
self.addEventListener('message', function(event) {
    console.log('[firebase-messaging-sw.js] Mensagem recebida:', event.data);
    
    if (event.data && event.data.type === 'FCM_TOKEN') {
        // Armazenar token se necessário
        console.log('Token FCM recebido no Service Worker:', event.data.token);
    }
});