let deferredPrompt = null;
let isAppInstalled = false;
let serviceWorkerRegistration = null;

// DOM Elements for PWA
const pwaInstallBtn = document.getElementById('pwaInstallBtn');
const testNotificationBtn = document.getElementById('testNotificationBtn');

// Event Listeners for PWA
if (installBtn) installBtn.addEventListener('click', installPWA);
if (pwaInstallBtn) pwaInstallBtn.addEventListener('click', installPWA);
if (testNotificationBtn) testNotificationBtn.addEventListener('click', testNotification);

// Create Manifest dynamically
const manifest = {
    "name": "MotoZap",
    "short_name": "MotoZap",
    "description": "Sua corrida rápida no interior",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#FF6600",
    "theme_color": "#FF6600",
    "icons": [
        {
            "src": "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🏍️</text></svg>",
            "sizes": "72x72 96x96 128x128 144x144 152x152 192x192 384x384 512x512",
            "type": "image/svg+xml"
        }
    ]
};

// Set manifest
document.getElementById('manifest').setAttribute('href', 'data:application/manifest+json,' + encodeURIComponent(JSON.stringify(manifest)));

// Initialize PWA functionality
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
    
    // Register Service Worker
    await registerServiceWorker();
    
    // Request notification permission
    await requestNotificationPermission();
    
    // Initialize Firebase Messaging after login
    auth.onAuthStateChanged(async (user) => {
        if (user && Notification.permission === 'granted') {
            await initializeFirebaseMessaging();
        }
    });
});

// ========== FUNÇÕES DE PWA ==========

// Check if app is installed
function checkIfAppInstalled() {
    if (window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone ||
        document.referrer.includes('android-app://')) {
        isAppInstalled = true;
        hideInstallPromotion();
    }
}

// Show install promotion
function showInstallPromotion() {
    if (!isAppInstalled && deferredPrompt) {
        installBanner.classList.remove('hidden');
        pwaInstallBtn.style.display = 'flex';
    }
}

// Hide install promotion
function hideInstallPromotion() {
    installBanner.classList.add('hidden');
    pwaInstallBtn.style.display = 'none';
}

// Install PWA
async function installPWA() {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
        console.log('App installed successfully');
        isAppInstalled = true;
        hideInstallPromotion();
        showMobileNotification({
            title: 'App instalado!',
            message: 'MotoZap foi instalado com sucesso!',
            type: 'success'
        });
    }
    
    deferredPrompt = null;
}

// Test notification function
function testNotification() {
    showMobileNotification({
        title: 'Teste de Notificação',
        message: 'Esta é uma notificação de teste do MotoZap!',
        type: 'new-ride',
        actions: [
            {
                text: 'Ver',
                type: 'view'
            }
        ]
    });
}

// ========== FUNÇÕES DE NOTIFICAÇÕES PUSH ==========

// Request notification permission
async function requestNotificationPermission() {
    if ("Notification" in window && Notification.permission === "default") {
        try {
            const permission = await Notification.requestPermission();
            console.log("Permissão de notificação:", permission);
            
            if (permission === 'granted' && currentUser) {
                await initializeFirebaseMessaging();
            }
            
            return permission;
        } catch (error) {
            console.error("Erro ao solicitar permissão:", error);
            return 'denied';
        }
    }
    return Notification.permission;
}

// Register Service Worker
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            // Registrar o service worker inline
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

self.addEventListener('message', event => {
    console.log('Service Worker message:', event.data);
});
            `;
            
            const blob = new Blob([serviceWorkerContent], {type: 'application/javascript'});
            const url = URL.createObjectURL(blob);
            serviceWorkerRegistration = await navigator.serviceWorker.register(url);
            console.log('Service Worker registrado:', serviceWorkerRegistration);
            
            // Escutar mensagens do Service Worker
            navigator.serviceWorker.addEventListener('message', event => {
                console.log('Mensagem do Service Worker:', event.data);
                handleServiceWorkerMessage(event.data);
            });
            
            return serviceWorkerRegistration;
            
        } catch (error) {
            console.error('Falha ao registrar Service Worker:', error);
            return null;
        }
    } else {
        console.log('Service Worker não suportado pelo navegador');
        return null;
    }
}

// Initialize Firebase Messaging
async function initializeFirebaseMessaging() {
    try {
        // Verificar se já temos permissão
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
            console.log('Permissão de notificação concedida');
            
            // Obter o Service Worker registrado
            const registration = await navigator.serviceWorker.ready;
            
            console.log('Service Worker registrado, usando:', registration);
            
            // Obter token FCM
            const fcmToken = await messaging.getToken({
                serviceWorkerRegistration: registration,
                vapidKey: 'BE6r0LR0z1pSzQRnNRV0TGbQ7QOY9epBAPJgLj0v2lS3JYVg3nSFhU1gyV_x3T1bZakO0pN_rB4Lw8YdWx1Sq_o'
            });
            
            if (fcmToken) {
                console.log('Token FCM obtido:', fcmToken);
                
                // Salvar token no banco de dados
                if (currentUser) {
                    await saveFCMTokenToDatabase(fcmToken);
                }
                
                // Enviar token para o Service Worker
                if (registration.active) {
                    registration.active.postMessage({
                        type: 'FCM_TOKEN',
                        token: fcmToken
                    });
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
                
                // Configurar handler para atualização do token
                messaging.onTokenRefresh(async () => {
                    console.log('Token FCM atualizado');
                    const newToken = await messaging.getToken({
                        serviceWorkerRegistration: registration
                    });
                    
                    if (currentUser) {
                        await saveFCMTokenToDatabase(newToken);
                    }
                });
                
                return true;
            } else {
                console.log('Não foi possível obter token FCM');
                return false;
            }
        } else {
            console.log('Permissão de notificação negada:', permission);
            return false;
        }
    } catch (error) {
        console.error('Erro ao inicializar Firebase Messaging:', error);
        return false;
    }
}

// Save FCM token to database
async function saveFCMTokenToDatabase(token) {
    try {
        if (!currentUser || !token) return;
        
        const userRef = database.ref('users/' + currentUser.uid);
        await userRef.update({
            fcmToken: token,
            fcmTokenUpdatedAt: new Date().toISOString()
        });
        
        console.log('Token FCM salvo no banco de dados');
    } catch (error) {
        console.error('Erro ao salvar token FCM:', error);
    }
}

// Handle service worker message
function handleServiceWorkerMessage(message) {
    console.log('Mensagem do Service Worker recebida:', message);
    
    if (message.type === 'NOTIFICATION_CLICK') {
        // Lidar com clique na notificação
        handleNotificationClick(message.data, message.action);
    }
}

// Handle notification click
function handleNotificationClick(notificationData, action) {
    console.log('Notificação clicada:', notificationData, 'Ação:', action);
    
    // Se o app estava em background, trazer para frente
    if (document.hidden) {
        window.focus();
    }
    
    // Processar ação da notificação
    switch(action) {
        case 'accept':
            // Aceitar corrida
            if (notificationData.rideId) {
                acceptRideFromNotification(notificationData.rideId);
            }
            break;
        case 'decline':
            // Recusar corrida
            if (notificationData.rideId) {
                declineRideFromNotification(notificationData.rideId);
            }
            break;
        case 'whatsapp':
            // Abrir WhatsApp
            if (notificationData.phone && notificationData.name) {
                openWhatsApp(notificationData.phone, notificationData.name, 
                            notificationData.role || 'passageiro');
            }
            break;
        default:
            // Navegar para a aba relevante
            if (notificationData.type === 'new-ride') {
                switchTab('dashboard');
            } else if (notificationData.type === 'ride-accepted') {
                switchTab('dashboard');
            }
            break;
    }
}