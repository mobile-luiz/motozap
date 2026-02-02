// Service Worker para MotoZap
const CACHE_NAME = 'motozap-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/pwa.js'
];

// Install Event
self.addEventListener('install', event => {
    console.log('Service Worker instalado');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache aberto');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate Event
self.addEventListener('activate', event => {
    console.log('Service Worker ativado');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('Removendo cache antigo:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                return fetch(event.request);
            }
        )
    );
});

// Push Event
self.addEventListener('push', event => {
    console.log('Push event received:', event);
    
    let data = {};
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            console.log('Erro ao parsear dados:', e);
            data = {
                notification: {
                    title: 'MotoZap',
                    body: event.data.text() || 'Nova notificação'
                }
            };
        }
    }
    
    const options = {
        body: data.notification?.body || data.body || 'Nova notificação do MotoZap',
        icon: 'https://cdn-icons-png.flaticon.com/512/2965/2965358.png',
        badge: 'https://cdn-icons-png.flaticon.com/512/2965/2965358.png',
        tag: 'motozap-push',
        data: data.data || data,
        requireInteraction: true,
        actions: []
    };
    
    // Adicionar ações baseadas no tipo
    if (data.data?.type === 'new-ride') {
        options.actions = [
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
    } else if (data.data?.type === 'ride-accepted') {
        options.actions = [
            {
                action: 'whatsapp',
                title: '💬 WhatsApp',
                icon: 'https://cdn-icons-png.flaticon.com/512/220/220236.png'
            }
        ];
    }
    
    event.waitUntil(
        self.registration.showNotification(data.notification?.title || data.title || 'MotoZap', options)
    );
});

// Notification Click Event
self.addEventListener('notificationclick', event => {
    console.log('Notification click:', event);
    
    event.notification.close();
    
    const notificationData = event.notification.data || {};
    
    event.waitUntil(
        clients.matchAll({type: 'window', includeUncontrolled: true})
        .then(clientList => {
            // Verificar se já tem uma janela aberta
            for (const client of clientList) {
                if (client.url.includes('/') && 'focus' in client) {
                    return client.focus().then(() => {
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

// Message Event
self.addEventListener('message', event => {
    console.log('Service Worker message:', event.data);
    
    if (event.data.type === 'FCM_TOKEN') {
        console.log('Token FCM recebido:', event.data.token);
    }
});