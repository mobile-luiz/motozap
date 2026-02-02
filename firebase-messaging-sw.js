// No DOMContentLoaded, atualize para:
document.addEventListener('DOMContentLoaded', async () => {
    // Check if app is already installed
    checkIfAppInstalled();
    
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        showInstallPromotion();
    });
    
    // Check if app is running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
        isAppInstalled = true;
        hideInstallPromotion();
    }
    
    // Registrar Service Worker
    await registerServiceWorker();
    
    // Inicializar Firebase Messaging
    await initializeFirebaseMessaging();
    
    // Check if user is already logged in
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            loadUserData(user.uid);
        } else {
            showMainScreen();
        }
    });
    
    // Test if notification sound works
    setTimeout(() => {
        if (notificationAudio) {
            notificationAudio.volume = 0.5;
        }
    }, 1000);
    
    // Phone formatting
    profilePhone.addEventListener('input', formatPhoneInput);
    document.getElementById('phone')?.addEventListener('input', formatPhoneInput);
});

// Nova função para registrar Service Worker
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            // Primeiro, tentar registrar o service worker externo
            const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            console.log('Service Worker registrado com sucesso:', registration);
            
            // Aguardar o service worker estar ativo
            if (registration.active) {
                console.log('Service Worker ativo');
            } else if (registration.installing) {
                registration.installing.addEventListener('statechange', (e) => {
                    if (e.target.state === 'activated') {
                        console.log('Service Worker ativado');
                    }
                });
            }
            
            // Escutar mensagens do Service Worker
            navigator.serviceWorker.addEventListener('message', event => {
                console.log('Mensagem do Service Worker:', event.data);
                handleServiceWorkerMessage(event.data);
            });
            
            return registration;
            
        } catch (error) {
            console.error('Falha ao registrar Service Worker:', error);
            
            // Fallback: criar service worker inline
            try {
                const serviceWorkerContent = `
self.addEventListener('install', event => {
    console.log('Service Worker instalado');
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    console.log('Service Worker ativado');
    event.waitUntil(clients.claim());
});

self.addEventListener('push', event => {
    console.log('Push event received:', event);
    
    let data = {};
    if (event.data) {
        data = event.data.json();
    }
    
    const options = {
        body: data.body || 'Nova notificação do MotoZap',
        icon: 'https://cdn-icons-png.flaticon.com/512/2965/2965358.png',
        badge: 'https://cdn-icons-png.flaticon.com/512/2965/2965358.png',
        tag: 'motozap-push',
        data: data.data || {},
        requireInteraction: true
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title || 'MotoZap', options)
    );
});

self.addEventListener('notificationclick', event => {
    console.log('Notification click:', event);
    
    event.notification.close();
    
    const notificationData = event.notification.data || {};
    
    event.waitUntil(
        clients.matchAll({type: 'window', includeUncontrolled: true})
        .then(clientList => {
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
            
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});
                `;
                
                const blob = new Blob([serviceWorkerContent], {type: 'application/javascript'});
                const url = URL.createObjectURL(blob);
                const registration = await navigator.serviceWorker.register(url);
                console.log('Service Worker inline registrado:', registration);
                
                return registration;
                
            } catch (fallbackError) {
                console.error('Falha no fallback do Service Worker:', fallbackError);
                return null;
            }
        }
    } else {
        console.log('Service Worker não suportado pelo navegador');
        return null;
    }
}

// Nova função para inicializar Firebase Messaging
async function initializeFirebaseMessaging() {
    try {
        // Solicitar permissão
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
            console.log('Permissão de notificação concedida');
            
            // Obter token FCM
            if ('serviceWorker' in navigator) {
                const serviceWorkerRegistration = await navigator.serviceWorker.ready;
                
                // Usar VAPID key pública (você precisa gerar uma)
                const vapidKey = 'BE6r0LR0z1pSzQRnNRV0TGbQ7QOY9epBAPJgLj0v2lS3JYVg3nSFhU1gyV_x3T1bZakO0pN_rB4Lw8YdWx1Sq_o';
                
                fcmToken = await messaging.getToken({
                    serviceWorkerRegistration: serviceWorkerRegistration,
                    vapidKey: vapidKey
                });
                
                if (fcmToken) {
                    console.log('Token FCM:', fcmToken);
                    messagingInitialized = true;
                    
                    // Salvar token quando usuário fizer login
                    if (currentUser) {
                        await saveFCMTokenToDatabase(fcmToken);
                    }
                }
            }
            
            // Configurar handler para mensagens em primeiro plano
            messaging.onMessage((payload) => {
                console.log('Mensagem recebida em primeiro plano:', payload);
                
                // Mostrar notificação no app
                if (payload.notification) {
                    showMobileNotification({
                        title: payload.notification.title,
                        message: payload.notification.body,
                        type: payload.data?.type || 'info',
                        data: payload.data
                    });
                }
            });
            
        } else {
            console.log('Permissão de notificação negada');
        }
        
    } catch (error) {
        console.error('Erro ao inicializar Firebase Messaging:', error);
    }
}