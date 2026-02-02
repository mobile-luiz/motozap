// Firebase Configuration
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

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();
const messaging = firebase.messaging();

// Global Variables
let isLoginMode = true;
let userRole = '';
let currentUser = null;
let currentRideId = null;
let rideRequestsListener = null;
let passengerRideListener = null;
let driverActiveRideListener = null;
let notificationCount = 0;
let currentTab = 'dashboard';

// DOM Elements
const mainScreen = document.getElementById('mainScreen');
const dashboardScreen = document.getElementById('dashboardScreen');
const authModal = document.getElementById('authModal');
const passengerBtn = document.getElementById('passengerBtn');
const driverBtn = document.getElementById('driverBtn');
const closeModal = document.getElementById('closeModal');
const modalTitle = document.getElementById('modalTitle');
const authForm = document.getElementById('authForm');
const authSubmit = document.getElementById('authSubmit');
const toggleAuthMode = document.getElementById('toggleAuthMode');
const nameField = document.getElementById('nameField');
const phoneField = document.getElementById('phoneField');
const vehicleField = document.getElementById('vehicleField');
const statusMessage = document.getElementById('statusMessage');
const logoutBtn = document.getElementById('logoutBtn');
const profileBtn = document.getElementById('profileBtn');
const userName = document.getElementById('userName');
const userAvatar = document.getElementById('userAvatar');
const userRoleElement = document.getElementById('userRole');
const userProfileBtn = document.getElementById('userProfileBtn');
const passengerDashboard = document.getElementById('passengerDashboard');
const driverDashboard = document.getElementById('driverDashboard');
const mobileNotifications = document.getElementById('mobileNotifications');
const notificationBadge = document.getElementById('notificationBadge');
const notificationBell = document.getElementById('notificationBell');
const installBanner = document.getElementById('installBanner');
const installBtn = document.getElementById('installBtn');
const notificationAudio = document.getElementById('notificationSound');
const whatsappSection = document.getElementById('whatsappSection');
const driverContactName = document.getElementById('driverContactName');
const driverPhoneNumber = document.getElementById('driverPhoneNumber');
const whatsappPassengerBtn = document.getElementById('whatsappPassengerBtn');
const callPassengerBtn = document.getElementById('callPassengerBtn');
const whatsappDriverSection = document.getElementById('whatsappDriverSection');
const passengerContactName = document.getElementById('passengerContactName');
const passengerPhoneNumber = document.getElementById('passengerPhoneNumber');
const whatsappDriverBtn = document.getElementById('whatsappDriverBtn');
const callDriverBtn = document.getElementById('callDriverBtn');

// Tab elements
const tabBtns = document.querySelectorAll('.tab-btn');
const dashboardTab = document.getElementById('dashboardTab');
const profileTab = document.getElementById('profileTab');
const historyTab = document.getElementById('historyTab');

// Profile elements
const profileForm = document.getElementById('profileForm');
const profileName = document.getElementById('profileName');
const profileEmail = document.getElementById('profileEmail');
const profilePhone = document.getElementById('profilePhone');
const profileVehicleField = document.getElementById('profileVehicleField');
const profileVehicle = document.getElementById('profileVehicle');
const profileStatusMessage = document.getElementById('profileStatusMessage');
const currentPassword = document.getElementById('currentPassword');
const newPassword = document.getElementById('newPassword');
const confirmPassword = document.getElementById('confirmPassword');
const closeProfileBtn = document.getElementById('closeProfileBtn');
const cancelProfileBtn = document.getElementById('cancelProfileBtn');

// Event Listeners
passengerBtn.addEventListener('click', () => openAuthModal('passenger'));
driverBtn.addEventListener('click', () => openAuthModal('driver'));
closeModal.addEventListener('click', closeAuthModal);
toggleAuthMode.addEventListener('click', toggleAuthFormMode);
authForm.addEventListener('submit', handleAuthSubmit);
logoutBtn.addEventListener('click', handleLogout);
profileBtn.addEventListener('click', () => switchTab('profile'));

// Tab navigation
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

// Profile events
userProfileBtn.addEventListener('click', () => switchTab('profile'));
closeProfileBtn.addEventListener('click', () => switchTab('dashboard'));
cancelProfileBtn.addEventListener('click', () => switchTab('dashboard'));
profileForm.addEventListener('submit', handleProfileUpdate);

// WhatsApp button click handlers
whatsappPassengerBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const phone = driverPhoneNumber.textContent.replace(/\D/g, '');
    const name = driverContactName.textContent;
    if (phone && phone !== 'Nãoinformado') {
        openWhatsApp(phone, name, 'passageiro');
    }
});

callPassengerBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const phone = driverPhoneNumber.textContent.replace(/\D/g, '');
    if (phone && phone !== 'Nãoinformado') {
        window.location.href = `tel:${phone}`;
    }
});

whatsappDriverBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const phone = passengerPhoneNumber.textContent.replace(/\D/g, '');
    const name = passengerContactName.textContent;
    if (phone && phone !== 'Nãoinformado') {
        openWhatsApp(phone, name, 'piloto');
    }
});

callDriverBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const phone = passengerPhoneNumber.textContent.replace(/\D/g, '');
    if (phone && phone !== 'Nãoinformado') {
        window.location.href = `tel:${phone}`;
    }
});

// Initialize the app
document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is already logged in
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            await loadUserData(user.uid);
        } else {
            showMainScreen();
        }
    });
    
    // Phone formatting
    profilePhone.addEventListener('input', formatPhoneInput);
    document.getElementById('phone')?.addEventListener('input', formatPhoneInput);
    
    // Fechar modais com tecla ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (authModal.style.display === 'flex') {
                closeAuthModal();
            }
        }
    });
});

// ========== FUNÇÕES DE NAVEGAÇÃO ==========

// Tab switching function
function switchTab(tabName) {
    // Update tab buttons
    tabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Update tab contents
    dashboardTab.classList.toggle('active', tabName === 'dashboard');
    profileTab.classList.toggle('active', tabName === 'profile');
    historyTab.classList.toggle('active', tabName === 'history');
    
    currentTab = tabName;
    
    // If switching to profile tab, load current user data
    if (tabName === 'profile' && currentUser) {
        loadProfileData();
    }
    
    // If switching to history tab, load history
    if (tabName === 'history' && currentUser) {
        if (currentUser.role === 'passenger') {
            loadPassengerHistory(currentUser.uid);
        } else {
            loadDriverHistory(currentUser.uid);
        }
    }
}

// ========== FUNÇÕES DE WHATSAPP ==========

// Function to open WhatsApp
function openWhatsApp(phone, name, role) {
    // Format phone number (remove non-digits and add country code if needed)
    let formattedPhone = phone.replace(/\D/g, '');
    
    // Add Brazil country code if not present
    if (!formattedPhone.startsWith('55') && formattedPhone.length <= 11) {
        formattedPhone = '55' + formattedPhone;
    }
    
    // Create message based on role
    let message = '';
    if (role === 'passageiro') {
        message = `Olá ${name}! Sou seu passageiro do MotoZap. Podemos combinar os detalhes da corrida?`;
    } else {
        message = `Olá ${name}! Sou seu piloto do MotoZap. Estou a caminho para buscá-lo.`;
    }
    
    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);
    
    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
    
    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
}

// ========== FUNÇÕES DE AUTENTICAÇÃO ==========

function openAuthModal(role) {
    userRole = role;
    isLoginMode = true;
    updateAuthForm();
    authModal.style.display = 'flex';
}

function closeAuthModal() {
    authModal.style.display = 'none';
    resetAuthForm();
}

function toggleAuthFormMode(e) {
    e.preventDefault();
    isLoginMode = !isLoginMode;
    updateAuthForm();
}

function updateAuthForm() {
    if (isLoginMode) {
        modalTitle.textContent = `Entrar como ${userRole === 'passenger' ? 'Passageiro' : 'Piloto'}`;
        authSubmit.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar';
        toggleAuthMode.textContent = 'Não tem uma conta? Cadastre-se';
        
        nameField.style.display = 'none';
        phoneField.style.display = 'none';
        vehicleField.style.display = 'none';
    } else {
        modalTitle.textContent = `Cadastrar como ${userRole === 'passenger' ? 'Passageiro' : 'Piloto'}`;
        authSubmit.innerHTML = '<i class="fas fa-user-plus"></i> Cadastrar';
        toggleAuthMode.textContent = 'Já tem uma conta? Faça login';
        
        nameField.style.display = 'block';
        phoneField.style.display = 'block';
        vehicleField.style.display = userRole === 'driver' ? 'block' : 'none';
        
        if (userRole === 'driver') {
            document.getElementById('vehicle').required = true;
        } else {
            document.getElementById('vehicle').required = false;
        }
    }
    
    hideStatusMessage();
}

function resetAuthForm() {
    authForm.reset();
    hideStatusMessage();
}

function showStatusMessage(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message status-${type}`;
    statusMessage.style.display = 'block';
}

function hideStatusMessage() {
    statusMessage.style.display = 'none';
}

async function handleAuthSubmit(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        showStatusMessage('Por favor, preencha todos os campos obrigatórios.', 'error');
        return;
    }
    
    if (password.length < 6) {
        showStatusMessage('A senha deve ter pelo menos 6 caracteres.', 'error');
        return;
    }
    
    try {
        if (isLoginMode) {
            showStatusMessage('Entrando...', 'info');
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            showStatusMessage('Login realizado com sucesso!', 'success');
            
            setTimeout(() => {
                closeAuthModal();
                loadUserData(userCredential.user.uid);
            }, 1500);
        } else {
            const name = document.getElementById('name')?.value.trim() || '';
            const phone = document.getElementById('phone')?.value.trim() || '';
            const vehicle = userRole === 'driver' ? document.getElementById('vehicle')?.value.trim() || '' : '';
            
            if (!name || !phone) {
                showStatusMessage('Por favor, preencha todos os campos obrigatórios.', 'error');
                return;
            }
            
            if (userRole === 'driver' && !vehicle) {
                showStatusMessage('Por favor, informe a placa da moto.', 'error');
                return;
            }
            
            showStatusMessage('Criando conta...', 'info');
            
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            const userData = {
                name: name,
                email: email,
                phone: phone,
                role: userRole,
                createdAt: new Date().toISOString(),
                uid: user.uid
            };
            
            if (userRole === 'driver') {
                userData.vehicle = vehicle;
                userData.available = false;
                userData.rating = 5.0;
                userData.totalRides = 0;
            }
            
            await database.ref('users/' + user.uid).set(userData);
            
            if (userRole === 'driver') {
                await database.ref('drivers/' + user.uid).set({
                    name: name,
                    email: email,
                    phone: phone,
                    vehicle: vehicle,
                    available: false,
                    rating: 5.0,
                    totalRides: 0,
                    createdAt: new Date().toISOString()
                });
            } else {
                await database.ref('passengers/' + user.uid).set({
                    name: name,
                    email: email,
                    phone: phone,
                    createdAt: new Date().toISOString()
                });
            }
            
            showStatusMessage('Conta criada com sucesso! Redirecionando...', 'success');
            
            setTimeout(() => {
                closeAuthModal();
                loadUserData(user.uid);
            }, 1500);
        }
    } catch (error) {
        console.error('Authentication error:', error);
        let errorMessage = 'Ocorreu um erro. Tente novamente.';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'Este e-mail já está em uso.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'E-mail inválido.';
                break;
            case 'auth/weak-password':
                errorMessage = 'Senha muito fraca. Use pelo menos 6 caracteres.';
                break;
            case 'auth/user-not-found':
                errorMessage = 'Usuário não encontrado.';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Senha incorreta.';
                break;
            case 'auth/network-request-failed':
                errorMessage = 'Erro de conexão. Verifique sua internet.';
                break;
        }
        
        showStatusMessage(errorMessage, 'error');
    }
}

// ========== FUNÇÕES DE USUÁRIO ==========

async function loadUserData(userId) {
    try {
        const userSnapshot = await database.ref('users/' + userId).once('value');
        const userData = userSnapshot.val();
        
        if (userData) {
            // Load additional data based on role
            if (userData.role === 'driver') {
                const driverSnapshot = await database.ref('drivers/' + userId).once('value');
                const driverData = driverSnapshot.val();
                if (driverData) {
                    Object.assign(userData, driverData);
                }
            } else {
                const passengerSnapshot = await database.ref('passengers/' + userId).once('value');
                const passengerData = passengerSnapshot.val();
                if (passengerData) {
                    Object.assign(userData, passengerData);
                }
            }
            
            // Add auth email
            userData.email = auth.currentUser.email;
            
            currentUser = { ...auth.currentUser, ...userData };
            
            console.log('Dados do usuário carregados:', currentUser);
            
            // Update UI
            userName.textContent = currentUser.name || 'Usuário';
            userRoleElement.textContent = currentUser.role === 'passenger' ? 'Passageiro' : 'Piloto';
            userAvatar.textContent = (currentUser.name && currentUser.name.charAt(0).toUpperCase()) || 'U';
            
            // Set up specific dashboards
            if (currentUser.role === 'passenger') {
                passengerDashboard.style.display = 'block';
                driverDashboard.style.display = 'none';
                notificationBell.style.display = 'none';
                document.getElementById('passengerHistory').style.display = 'block';
                document.getElementById('driverHistory').style.display = 'none';
                loadPassengerHistory(userId);
                listenToPassengerRides(userId);
            } else {
                passengerDashboard.style.display = 'none';
                driverDashboard.style.display = 'block';
                notificationBell.style.display = 'block';
                document.getElementById('passengerHistory').style.display = 'none';
                document.getElementById('driverHistory').style.display = 'block';
                setupDriverAvailability(userId);
                loadDriverHistory(userId);
                listenToRideRequests();
                listenToDriverActiveRide(userId);
                listenForNewRides();
                
                showMobileNotification({
                    title: 'Bem-vindo, Piloto!',
                    message: 'Você agora está online e receberá notificações de novas corridas.',
                    type: 'success'
                });
            }
            
            showDashboard();
            
        } else {
            await auth.signOut();
            showMainScreen();
            alert('Dados do usuário não encontrados. Por favor, faça login novamente.');
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        showMobileNotification({
            title: 'Erro',
            message: 'Erro ao carregar dados do usuário.',
            type: 'error'
        });
    }
}

function showMainScreen() {
    mainScreen.style.display = 'block';
    dashboardScreen.style.display = 'none';
    
    // Remove listeners
    if (rideRequestsListener) {
        rideRequestsListener();
        rideRequestsListener = null;
    }
    if (passengerRideListener) {
        passengerRideListener();
        passengerRideListener = null;
    }
    if (driverActiveRideListener) {
        driverActiveRideListener();
        driverActiveRideListener = null;
    }
}

function showDashboard() {
    mainScreen.style.display = 'none';
    dashboardScreen.style.display = 'block';
    switchTab('dashboard');
}

function handleLogout() {
    if (currentUser && currentUser.role === 'driver') {
        database.ref('drivers/' + currentUser.uid).update({
            available: false,
            lastUpdate: new Date().toISOString()
        });
    }
    
    auth.signOut().then(() => {
        currentUser = null;
        currentRideId = null;
        notificationCount = 0;
        updateNotificationBadge();
        showMainScreen();
    }).catch((error) => {
        console.error('Logout error:', error);
        showMobileNotification({
            title: 'Erro',
            message: 'Erro ao fazer logout.',
            type: 'error'
        });
    });
}

// ========== FUNÇÕES DE PERFIL ==========

function loadProfileData() {
    if (!currentUser) return;
    
    profileName.value = currentUser.name || '';
    profileEmail.value = currentUser.email || '';
    profilePhone.value = currentUser.phone || '';
    
    if (currentUser.role === 'driver') {
        profileVehicleField.style.display = 'block';
        profileVehicle.value = currentUser.vehicle || '';
    } else {
        profileVehicleField.style.display = 'none';
    }
    
    // Clear password fields
    currentPassword.value = '';
    newPassword.value = '';
    confirmPassword.value = '';
    
    hideProfileStatusMessage();
}

function showProfileStatusMessage(message, type) {
    profileStatusMessage.textContent = message;
    profileStatusMessage.className = `status-message status-${type}`;
    profileStatusMessage.style.display = 'block';
    
    if (type === 'success') {
        setTimeout(() => {
            hideProfileStatusMessage();
        }, 5000);
    }
}

function hideProfileStatusMessage() {
    profileStatusMessage.style.display = 'none';
}

// Format phone input
function formatPhoneInput(e) {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.length > 11) {
        value = value.substring(0, 11);
    }
    
    // Formatar enquanto digita
    if (value.length > 0) {
        if (value.length <= 2) {
            value = `(${value}`;
        } else if (value.length <= 7) {
            value = `(${value.substring(0,2)}) ${value.substring(2)}`;
        } else if (value.length <= 11) {
            value = `(${value.substring(0,2)}) ${value.substring(2,7)}-${value.substring(7)}`;
        }
    }
    
    e.target.value = value;
}

function validatePhone(phone) {
    const phoneDigits = phone.replace(/\D/g, '');
    return phoneDigits.length >= 10 && phoneDigits.length <= 11;
}

function formatPhone(phone) {
    const phoneDigits = phone.replace(/\D/g, '');
    
    if (phoneDigits.length === 11) {
        return `(${phoneDigits.substring(0,2)}) ${phoneDigits.substring(2,7)}-${phoneDigits.substring(7)}`;
    } else if (phoneDigits.length === 10) {
        return `(${phoneDigits.substring(0,2)}) ${phoneDigits.substring(2,6)}-${phoneDigits.substring(6)}`;
    }
    
    return phone;
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    
    // Validate required fields
    if (!profileName.value.trim()) {
        showProfileStatusMessage('Por favor, informe seu nome completo.', 'error');
        return;
    }
    
    if (!profilePhone.value.trim()) {
        showProfileStatusMessage('Por favor, informe seu telefone.', 'error');
        return;
    }
    
    // Validate phone
    if (!validatePhone(profilePhone.value)) {
        showProfileStatusMessage('Por favor, informe um telefone válido com DDD (10 ou 11 dígitos).', 'error');
        return;
    }
    
    // Validate vehicle plate for drivers
    if (currentUser.role === 'driver' && profileVehicle.value.trim()) {
        const plateRegex = /^[A-Z]{3}-\d{4}$|^[A-Z]{3}\d{4}$/i;
        if (!plateRegex.test(profileVehicle.value.trim())) {
            showProfileStatusMessage('Formato de placa inválido. Use formato ABC-1234 ou ABC1234.', 'error');
            return;
        }
    }
    
    // Validate password change
    if (newPassword.value || confirmPassword.value) {
        if (!currentPassword.value) {
            showProfileStatusMessage('Para alterar a senha, informe a senha atual.', 'error');
            return;
        }
        
        if (newPassword.value.length < 6) {
            showProfileStatusMessage('A nova senha deve ter pelo menos 6 caracteres.', 'error');
            return;
        }
        
        if (newPassword.value !== confirmPassword.value) {
            showProfileStatusMessage('As novas senhas não coincidem.', 'error');
            return;
        }
    }
    
    try {
        showProfileStatusMessage('Atualizando perfil...', 'info');
        
        // Format phone number
        const formattedPhone = formatPhone(profilePhone.value.trim());
        
        // Prepare update data
        const updates = {
            name: profileName.value.trim(),
            phone: formattedPhone,
            updatedAt: new Date().toISOString()
        };
        
        // Add vehicle for drivers
        if (currentUser.role === 'driver') {
            updates.vehicle = profileVehicle.value.trim().toUpperCase();
        }
        
        console.log('Atualizando perfil com dados:', updates);
        
        // Update in Firebase Realtime Database
        await database.ref('users/' + currentUser.uid).update(updates);
        
        // Update in specific collection (passengers or drivers)
        if (currentUser.role === 'passenger') {
            await database.ref('passengers/' + currentUser.uid).update(updates);
        } else {
            await database.ref('drivers/' + currentUser.uid).update(updates);
            
            // Update in active rides if any
            if (currentRideId) {
                await database.ref('rides/' + currentRideId).update({
                    driverName: updates.name,
                    driverPhone: updates.phone
                });
            }
        }
        
        // Update local currentUser object
        Object.assign(currentUser, updates);
        
        // Update UI
        userName.textContent = updates.name;
        userAvatar.textContent = updates.name.charAt(0).toUpperCase();
        
        // Update password if provided
        if (newPassword.value && newPassword.value.length >= 6) {
            console.log('Tentando atualizar senha...');
            
            try {
                const credential = firebase.auth.EmailAuthProvider.credential(
                    currentUser.email,
                    currentPassword.value
                );
                
                await auth.currentUser.reauthenticateWithCredential(credential);
                console.log('Reautenticação bem-sucedida');
                
                await auth.currentUser.updatePassword(newPassword.value);
                console.log('Senha atualizada com sucesso');
                
                // Clear password fields
                currentPassword.value = '';
                newPassword.value = '';
                confirmPassword.value = '';
                
            } catch (authError) {
                console.error('Erro na autenticação para alterar senha:', authError);
                if (authError.code === 'auth/wrong-password') {
                    showProfileStatusMessage('Senha atual incorreta. A senha não foi alterada, mas os outros dados foram atualizados.', 'error');
                    return;
                }
                throw authError;
            }
        }
        
        showProfileStatusMessage('Perfil atualizado com sucesso!', 'success');
        
        // Show mobile notification
        showMobileNotification({
            title: 'Perfil Atualizado!',
            message: 'Seus dados foram atualizados com sucesso.',
            type: 'success'
        });
        
        // Switch back to dashboard after 2 seconds
        setTimeout(() => {
            switchTab('dashboard');
        }, 2000);
        
    } catch (error) {
        console.error('Erro completo ao atualizar perfil:', error);
        let errorMessage = 'Ocorreu um erro ao atualizar o perfil. Tente novamente.';
        
        switch (error.code) {
            case 'auth/wrong-password':
                errorMessage = 'Senha atual incorreta. A senha não foi alterada.';
                break;
            case 'auth/requires-recent-login':
                errorMessage = 'Por favor, faça login novamente para alterar a senha.';
                break;
            case 'auth/weak-password':
                errorMessage = 'A nova senha é muito fraca. Use pelo menos 6 caracteres.';
                break;
            case 'auth/network-request-failed':
                errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
                break;
        }
        
        showProfileStatusMessage(errorMessage, 'error');
        
        showMobileNotification({
            title: 'Erro ao Atualizar',
            message: errorMessage,
            type: 'error'
        });
    }
}

// ========== FUNÇÕES DE DRIVER ==========

// Driver Availability Functions
function setupDriverAvailability(userId) {
    const toggleAvailabilityBtn = document.getElementById('toggleAvailabilityBtn');
    const availabilityText = document.getElementById('availabilityText');
    const availabilityStatus = document.getElementById('availabilityStatus');
    
    database.ref('drivers/' + userId + '/available').once('value')
        .then(snapshot => {
            const isAvailable = snapshot.val() || false;
            updateDriverAvailabilityUI(isAvailable);
        });
    
    toggleAvailabilityBtn.addEventListener('click', () => {
        database.ref('drivers/' + userId + '/available').once('value')
            .then(snapshot => {
                const currentStatus = snapshot.val() || false;
                const newStatus = !currentStatus;
                
                database.ref('drivers/' + userId).update({
                    available: newStatus,
                    lastUpdate: new Date().toISOString()
                });
                
                updateDriverAvailabilityUI(newStatus);
                
                if (newStatus) {
                    showMobileNotification({
                        title: 'Disponível',
                        message: 'Agora você está disponível para receber corridas!',
                        type: 'success'
                    });
                } else {
                    showMobileNotification({
                        title: 'Indisponível',
                        message: 'Você está indisponível para corridas.',
                        type: 'info'
                    });
                }
            });
    });
    
    function updateDriverAvailabilityUI(isAvailable) {
        if (isAvailable) {
            availabilityText.textContent = 'Ficar Indisponível';
            availabilityStatus.textContent = 'Status: Disponível para corridas';
            availabilityStatus.style.color = '#0a5c36';
        } else {
            availabilityText.textContent = 'Ficar Disponível';
            availabilityStatus.textContent = 'Status: Indisponível';
            availabilityStatus.style.color = '#dc3545';
        }
    }
}

// Listen to ride requests for drivers
function listenToRideRequests() {
    const rideRequestsList = document.getElementById('rideRequestsList');
    const noRequestsMessage = document.getElementById('noRequestsMessage');
    
    if (rideRequestsListener) {
        rideRequestsListener();
    }
    
    rideRequestsListener = database.ref('rides')
        .orderByChild('status')
        .equalTo('pending')
        .on('value', (snapshot) => {
            const rides = snapshot.val();
            rideRequestsList.innerHTML = '';
            
            if (rides) {
                noRequestsMessage.style.display = 'none';
                
                Object.keys(rides).forEach(rideId => {
                    const ride = rides[rideId];
                    
                    // Check if driver is available
                    database.ref('drivers/' + currentUser.uid + '/available').once('value')
                        .then(driverSnapshot => {
                            const isAvailable = driverSnapshot.val();
                            
                            if (isAvailable) {
                                const rideElement = createRideRequestElement(rideId, ride);
                                rideRequestsList.appendChild(rideElement);
                            }
                        });
                });
                
                if (rideRequestsList.children.length === 0) {
                    noRequestsMessage.style.display = 'block';
                }
            } else {
                noRequestsMessage.style.display = 'block';
            }
        });
}

// Listen for new rides (for notifications)
function listenForNewRides() {
    let lastRideId = null;
    
    database.ref('rides')
        .orderByChild('status')
        .equalTo('pending')
        .on('child_added', (snapshot) => {
            const ride = snapshot.val();
            const rideId = snapshot.key;
            
            // Only notify if this is a new ride and driver is available
            if (rideId !== lastRideId) {
                lastRideId = rideId;
                
                database.ref('drivers/' + currentUser.uid + '/available').once('value')
                    .then(driverSnapshot => {
                        const isAvailable = driverSnapshot.val();
                        
                        if (isAvailable && currentUser.uid !== ride.passengerId) {
                            // Show mobile notification
                            const notificationId = showMobileNotification({
                                title: 'Nova Corrida Disponível!',
                                message: `${ride.passengerName} solicitou uma corrida de ${ride.pickup} para ${ride.destination} por R$ ${ride.price}`,
                                type: 'new-ride',
                                rideId: rideId,
                                passengerName: ride.passengerName,
                                passengerPhone: ride.passengerPhone,
                                pickup: ride.pickup,
                                destination: ride.destination,
                                price: ride.price,
                                actions: [
                                    {
                                        text: 'Aceitar',
                                        type: 'accept',
                                        rideId: rideId
                                    },
                                    {
                                        text: 'Recusar',
                                        type: 'decline',
                                        rideId: rideId
                                    },
                                    {
                                        text: 'Ver',
                                        type: 'view'
                                    }
                                ]
                            });
                            
                            // Store ride info with notification
                            const notificationElement = document.getElementById(notificationId);
                            if (notificationElement) {
                                notificationElement.dataset.rideId = rideId;
                            }
                        }
                    });
            }
        });
}

function createRideRequestElement(rideId, ride) {
    const div = document.createElement('div');
    div.className = 'driver-card';
    div.innerHTML = `
        <h4 style="color: #FF6600; margin-bottom: 10px;">Nova Corrida Disponível</h4>
        <p><strong>Passageiro:</strong> ${ride.passengerName}</p>
        <p><strong>De:</strong> ${ride.pickup}</p>
        <p><strong>Para:</strong> ${ride.destination}</p>
        <p><strong>Valor Sugerido:</strong> R$ ${ride.price}</p>
        <p><strong>Telefone:</strong> ${ride.passengerPhone || 'Não informado'}</p>
        <div style="margin-top: 15px; display: flex; gap: 10px;">
            <button class="btn-action accept-ride-btn" data-ride-id="${rideId}" style="background-color: #0a5c36;">
                <i class="fas fa-check"></i> Aceitar
            </button>
            <button class="btn-action decline-ride-btn" data-ride-id="${rideId}" style="background-color: #dc3545;">
                <i class="fas fa-times"></i> Recusar
            </button>
        </div>
    `;
    
    return div;
}

// Listen to passenger rides
function listenToPassengerRides(userId) {
    if (passengerRideListener) {
        passengerRideListener();
    }
    
    passengerRideListener = database.ref('rides')
        .orderByChild('passengerId')
        .equalTo(userId)
        .on('value', (snapshot) => {
            const rides = snapshot.val();
            
            if (rides) {
                // Find active ride (pending or accepted)
                Object.keys(rides).forEach(rideId => {
                    const ride = rides[rideId];
                    if (ride.status === 'pending' || ride.status === 'accepted' || ride.status === 'started') {
                        currentRideId = rideId;
                        updatePassengerRideStatus(ride);
                    }
                });
            }
        });
}

// Listen to driver active ride
function listenToDriverActiveRide(driverId) {
    if (driverActiveRideListener) {
        driverActiveRideListener();
    }
    
    driverActiveRideListener = database.ref('rides')
        .orderByChild('driverId')
        .equalTo(driverId)
        .on('value', (snapshot) => {
            const rides = snapshot.val();
            
            if (rides) {
                Object.keys(rides).forEach(rideId => {
                    const ride = rides[rideId];
                    if (ride.status === 'accepted' || ride.status === 'started') {
                        currentRideId = rideId;
                        showDriverActiveRide(ride);
                    }
                });
            }
        });
}

// Update passenger ride status with WhatsApp section
function updatePassengerRideStatus(ride) {
    const rideStatus = document.getElementById('rideStatus');
    const rideStatusIcon = document.getElementById('rideStatusIcon');
    const rideStatusTitle = document.getElementById('rideStatusTitle');
    const rideDetails = document.getElementById('rideDetails');
    
    rideStatus.style.display = 'block';
    
    let statusText = '';
    let iconClass = 'fas fa-spinner fa-spin';
    let title = 'Status da Corrida';
    
    switch(ride.status) {
        case 'pending':
            statusText = 'Aguardando aceitação de um piloto...';
            iconClass = 'fas fa-spinner fa-spin';
            title = 'Buscando Piloto';
            break;
        case 'accepted':
            statusText = `Piloto ${ride.driverName} aceitou sua corrida!`;
            iconClass = 'fas fa-check-circle';
            title = 'Corrida Aceita';
            
            if (ride.driverName && ride.driverPhone) {
                driverContactName.textContent = ride.driverName;
                driverPhoneNumber.textContent = ride.driverPhone;
                whatsappSection.style.display = 'block';
                
                const whatsappUrl = createWhatsAppUrl(ride.driverPhone, ride.driverName, 'passageiro');
                whatsappPassengerBtn.href = whatsappUrl;
                callPassengerBtn.href = `tel:${ride.driverPhone.replace(/\D/g, '')}`;
            }
            
            // Show notification to passenger with WhatsApp option
            showMobileNotification({
                title: 'Corrida Aceita!',
                message: `Piloto ${ride.driverName} aceitou sua corrida. Telefone: ${ride.driverPhone || 'Não informado'}`,
                type: 'ride-accepted',
                driverName: ride.driverName,
                driverPhone: ride.driverPhone,
                actions: ride.driverPhone ? [
                    {
                        text: 'WhatsApp',
                        type: 'whatsapp',
                        phone: ride.driverPhone,
                        name: ride.driverName,
                        role: 'passageiro'
                    },
                    {
                        text: 'Ver',
                        type: 'view'
                    }
                ] : [
                    {
                        text: 'Ver',
                        type: 'view'
                    }
                ]
            });
            break;
        case 'started':
            statusText = `Piloto ${ride.driverName} iniciou a corrida!`;
            iconClass = 'fas fa-motorcycle';
            title = 'Corrida em Andamento';
            
            // Keep WhatsApp section visible
            if (ride.driverName && ride.driverPhone) {
                driverContactName.textContent = ride.driverName;
                driverPhoneNumber.textContent = ride.driverPhone;
                whatsappSection.style.display = 'block';
            }
            
            // Show notification to passenger
            showMobileNotification({
                title: 'Corrida Iniciada!',
                message: `Piloto ${ride.driverName} iniciou a corrida.`,
                type: 'ride-started'
            });
            break;
        case 'completed':
            statusText = 'Corrida finalizada com sucesso!';
            iconClass = 'fas fa-flag-checkered';
            title = 'Corrida Concluída';
            
            // Hide WhatsApp section when ride is completed
            whatsappSection.style.display = 'none';
            
            // Show notification to passenger
            showMobileNotification({
                title: 'Corrida Concluída!',
                message: `Sua corrida foi finalizada com sucesso. Valor: R$ ${ride.price}`,
                type: 'success'
            });
            break;
        case 'cancelled':
            statusText = 'Corrida cancelada.';
            iconClass = 'fas fa-times-circle';
            title = 'Corrida Cancelada';
            
            // Hide WhatsApp section when ride is cancelled
            whatsappSection.style.display = 'none';
            break;
    }
    
    rideStatusIcon.className = iconClass;
    rideStatusTitle.textContent = title;
    
    rideDetails.innerHTML = `
        <div class="ride-details">
            <div class="ride-detail-item">
                <span><strong>Partida:</strong></span>
                <span>${ride.pickup}</span>
            </div>
            <div class="ride-detail-item">
                <span><strong>Destino:</strong></span>
                <span>${ride.destination}</span>
            </div>
            <div class="ride-detail-item">
                <span><strong>Valor:</strong></span>
                <span>R$ ${ride.price}</span>
            </div>
            ${ride.driverName ? `
            <div class="ride-detail-item">
                <span><strong>Piloto:</strong></span>
                <span>${ride.driverName}</span>
            </div>
            <div class="ride-detail-item">
                <span><strong>Telefone do Piloto:</strong></span>
                <span>${ride.driverPhone || 'Não informado'}</span>
            </div>
            <div class="ride-detail-item">
                <span><strong>Status:</strong></span>
                <span style="color: ${getStatusColor(ride.status)}">${getStatusText(ride.status)}</span>
            </div>
            ` : ''}
        </div>
    `;
    
    const cancelBtn = document.getElementById('cancelRideBtn');
    if (ride.status === 'pending') {
        cancelBtn.style.display = 'inline-block';
    } else {
        cancelBtn.style.display = 'none';
    }
}

// Show driver active ride with WhatsApp section
function showDriverActiveRide(ride) {
    const activeRide = document.getElementById('activeRide');
    const activeRideDetails = document.getElementById('activeRideDetails');
    const startRideBtn = document.getElementById('startRideBtn');
    const completeRideBtn = document.getElementById('completeRideBtn');
    
    activeRide.style.display = 'block';
    
    activeRideDetails.innerHTML = `
        <div class="ride-details">
            <div class="ride-detail-item">
                <span><strong>Passageiro:</strong></span>
                <span>${ride.passengerName}</span>
            </div>
            <div class="ride-detail-item">
                <span><strong>Telefone:</strong></span>
                <span>${ride.passengerPhone || 'Não informado'}</span>
            </div>
            <div class="ride-detail-item">
                <span><strong>Partida:</strong></span>
                <span>${ride.pickup}</span>
            </div>
            <div class="ride-detail-item">
                <span><strong>Destino:</strong></span>
                <span>${ride.destination}</span>
            </div>
            <div class="ride-detail-item">
                <span><strong>Valor:</strong></span>
                <span>R$ ${ride.price}</span>
            </div>
            <div class="ride-detail-item">
                <span><strong>Status:</strong></span>
                <span style="color: ${getStatusColor(ride.status)}">${getStatusText(ride.status)}</span>
            </div>
        </div>
    `;
    
    if (ride.status === 'accepted' || ride.status === 'started') {
        if (ride.passengerName && ride.passengerPhone) {
            passengerContactName.textContent = ride.passengerName;
            passengerPhoneNumber.textContent = ride.passengerPhone;
            whatsappDriverSection.style.display = 'block';
            
            const whatsappUrl = createWhatsAppUrl(ride.passengerPhone, ride.passengerName, 'piloto');
            whatsappDriverBtn.href = whatsappUrl;
            callDriverBtn.href = `tel:${ride.passengerPhone.replace(/\D/g, '')}`;
        }
    } else {
        whatsappDriverSection.style.display = 'none';
    }
    
    if (ride.status === 'accepted') {
        startRideBtn.style.display = 'inline-block';
        completeRideBtn.style.display = 'none';
    } else if (ride.status === 'started') {
        startRideBtn.style.display = 'none';
        completeRideBtn.style.display = 'inline-block';
    }
    
    document.getElementById('activeRideRequests').style.display = 'none';
}

// Create WhatsApp URL
function createWhatsAppUrl(phone, name, role) {
    let formattedPhone = phone.replace(/\D/g, '');
    
    if (!formattedPhone.startsWith('55') && formattedPhone.length <= 11) {
        formattedPhone = '55' + formattedPhone;
    }
    
    let message = '';
    if (role === 'passageiro') {
        message = `Olá ${name}! Sou seu passageiro do MotoZap. Podemos combinar os detalhes da corrida?`;
    } else {
        message = `Olá ${name}! Sou seu piloto do MotoZap. Estou a caminho para buscá-lo.`;
    }
    
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
}

// Load passenger ride history
async function loadPassengerHistory(userId) {
    try {
        const historySnapshot = await database.ref('rides').orderByChild('passengerId').equalTo(userId).once('value');
        const history = historySnapshot.val();
        
        const historyList = document.getElementById('historyList');
        const noHistoryMessage = document.getElementById('noHistoryMessage');
        
        if (history) {
            noHistoryMessage.style.display = 'none';
            historyList.style.display = 'block';
            historyList.innerHTML = '';
            
            Object.keys(history).forEach(key => {
                const ride = history[key];
                const rideElement = document.createElement('div');
                rideElement.className = 'driver-card';
                rideElement.innerHTML = `
                    <p><strong>De:</strong> ${ride.pickup}</p>
                    <p><strong>Para:</strong> ${ride.destination}</p>
                    <p><strong>Piloto:</strong> ${ride.driverName || 'Aguardando'}</p>
                    <p><strong>Valor:</strong> R$ ${ride.price || '0,00'}</p>
                    <p><strong>Status:</strong> <span style="color: ${getStatusColor(ride.status)}">${getStatusText(ride.status)}</span></p>
                    <p><strong>Data:</strong> ${new Date(ride.createdAt).toLocaleDateString('pt-BR')}</p>
                `;
                historyList.appendChild(rideElement);
            });
        } else {
            noHistoryMessage.style.display = 'block';
            historyList.style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading passenger history:', error);
    }
}

// Load driver ride history
async function loadDriverHistory(userId) {
    try {
        const historySnapshot = await database.ref('rides').orderByChild('driverId').equalTo(userId).once('value');
        const history = historySnapshot.val();
        
        const driverHistoryList = document.getElementById('driverHistoryList');
        const driverNoHistoryMessage = document.getElementById('driverNoHistoryMessage');
        
        if (history) {
            driverNoHistoryMessage.style.display = 'none';
            driverHistoryList.style.display = 'block';
            driverHistoryList.innerHTML = '';
            
            Object.keys(history).forEach(key => {
                const ride = history[key];
                const rideElement = document.createElement('div');
                rideElement.className = 'driver-card';
                rideElement.innerHTML = `
                    <p><strong>Passageiro:</strong> ${ride.passengerName}</p>
                    <p><strong>Rota:</strong> ${ride.pickup} → ${ride.destination}</p>
                    <p><strong>Valor:</strong> R$ ${ride.price || '0,00'}</p>
                    <p><strong>Status:</strong> <span style="color: ${getStatusColor(ride.status)}">${getStatusText(ride.status)}</span></p>
                    <p><strong>Data:</strong> ${new Date(ride.createdAt).toLocaleDateString('pt-BR')}</p>
                `;
                driverHistoryList.appendChild(rideElement);
            });
        } else {
            driverNoHistoryMessage.style.display = 'block';
            driverHistoryList.style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading driver history:', error);
    }
}

// Helper functions
function getStatusColor(status) {
    switch(status) {
        case 'pending': return '#FF9900';
        case 'accepted': return '#0a5c36';
        case 'started': return '#2c5282';
        case 'completed': return '#0a5c36';
        case 'cancelled': return '#dc3545';
        default: return '#666';
    }
}

function getStatusText(status) {
    switch(status) {
        case 'pending': return 'Pendente';
        case 'accepted': return 'Aceita';
        case 'started': return 'Em Andamento';
        case 'completed': return 'Concluída';
        case 'cancelled': return 'Cancelada';
        default: return status;
    }
}

// ========== FUNÇÕES DE NOTIFICAÇÕES ==========

// Show mobile notification
function showMobileNotification(data) {
    const notificationId = 'notification-' + Date.now();
    const notification = document.createElement('div');
    notification.className = `mobile-notification ${data.type || ''}`;
    notification.id = notificationId;
    
    const time = new Date().toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    let actionsHTML = '';
    if (data.actions && data.actions.length > 0) {
        actionsHTML = '<div class="notification-actions">';
        data.actions.forEach(action => {
            if (action.type === 'whatsapp') {
                actionsHTML += `
                    <button class="notification-btn whatsapp" onclick="handleNotificationAction('${notificationId}', '${action.type}', '${action.phone || ''}', '${action.name || ''}', '${action.role || ''}')">
                        <i class="fab fa-whatsapp"></i> ${action.text}
                    </button>
                `;
            } else if (action.type === 'accept' || action.type === 'decline') {
                actionsHTML += `
                    <button class="notification-btn ${action.type}" onclick="handleNotificationAction('${notificationId}', '${action.type}', '${action.rideId || ''}')">
                        ${action.text}
                    </button>
                `;
            } else {
                actionsHTML += `
                    <button class="notification-btn ${action.type}" onclick="handleNotificationAction('${notificationId}', '${action.type}')">
                        ${action.text}
                    </button>
                `;
            }
        });
        actionsHTML += '</div>';
    }
    
    notification.innerHTML = `
        <button class="notification-close" onclick="removeNotification('${notificationId}')">&times;</button>
        <div class="notification-header">
            <div class="notification-title">
                <i class="fas fa-bell"></i> ${data.title}
            </div>
            <div class="notification-time">${time}</div>
        </div>
        <div class="notification-body">${data.message}</div>
        ${actionsHTML}
    `;
    
    mobileNotifications.appendChild(notification);
    
    // Play notification sound
    if (notificationAudio) {
        notificationAudio.currentTime = 0;
        notificationAudio.play().catch(e => console.log("Erro ao tocar som:", e));
    }
    
    // Vibrate if supported
    if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
    }
    
    // Update badge count
    if (data.type === 'new-ride') {
        notificationCount++;
        updateNotificationBadge();
    }
    
    // Auto-remove notification after 30 seconds
    setTimeout(() => {
        removeNotification(notificationId);
    }, 30000);
    
    return notificationId;
}

// Remove notification
function removeNotification(id) {
    const notification = document.getElementById(id);
    if (notification) {
        notification.classList.add('hiding');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
}

// Handle notification action
window.handleNotificationAction = function(notificationId, actionType, param1, param2, param3) {
    removeNotification(notificationId);
    
    switch(actionType) {
        case 'accept':
            // Aceitar corrida
            if (param1) {
                acceptRideFromNotification(param1);
            }
            break;
        case 'decline':
            // Recusar corrida
            if (param1) {
                declineRideFromNotification(param1);
            }
            break;
        case 'whatsapp':
            // Open WhatsApp
            if (param1 && param2 && param3) {
                openWhatsApp(param1, param2, param3);
            }
            break;
        case 'view':
            // Switch to dashboard tab
            switchTab('dashboard');
            break;
    }
}

// Update notification badge
function updateNotificationBadge() {
    if (notificationCount > 0) {
        notificationBadge.textContent = notificationCount > 9 ? '9+' : notificationCount;
        notificationBadge.style.display = 'flex';
    } else {
        notificationBadge.style.display = 'none';
    }
}

// Accept ride from notification
async function acceptRideFromNotification(rideId) {
    if (!currentUser || currentUser.role !== 'driver') {
        showMobileNotification({
            title: 'Erro',
            message: 'Apenas motoristas podem aceitar corridas.',
            type: 'error'
        });
        return;
    }
    
    try {
        const rideSnapshot = await database.ref('rides/' + rideId).once('value');
        const ride = rideSnapshot.val();
        
        if (!ride) {
            showMobileNotification({
                title: 'Erro',
                message: 'Corrida não encontrada.',
                type: 'error'
            });
            return;
        }
        
        await database.ref('rides/' + rideId).update({
            status: 'accepted',
            driverId: currentUser.uid,
            driverName: currentUser.name,
            driverPhone: currentUser.phone,
            acceptedAt: new Date().toISOString()
        });
        
        await database.ref('drivers/' + currentUser.uid).update({
            available: false,
            lastUpdate: new Date().toISOString()
        });
        
        // Mostrar notificação no app
        showMobileNotification({
            title: 'Corrida Aceita!',
            message: `Você aceitou a corrida de ${ride.passengerName}`,
            type: 'success'
        });
        
        // Enviar notificação para o passageiro
        await sendPushNotification(ride.passengerId, {
            title: 'Corrida Aceita!',
            body: `Piloto ${currentUser.name} aceitou sua corrida. Telefone: ${currentUser.phone}`,
            data: {
                type: 'ride-accepted',
                driverName: currentUser.name,
                driverPhone: currentUser.phone,
                role: 'passageiro'
            }
        });
        
    } catch (error) {
        console.error('Erro ao aceitar corrida da notificação:', error);
        showMobileNotification({
            title: 'Erro',
            message: 'Erro ao aceitar corrida.',
            type: 'error'
        });
    }
}

// Decline ride from notification
async function declineRideFromNotification(rideId) {
    try {
        await database.ref('rides/' + rideId).update({
            status: 'cancelled',
            cancelledAt: new Date().toISOString(),
            cancelledBy: 'driver'
        });
        
        showMobileNotification({
            title: 'Corrida Recusada',
            message: 'Você recusou a corrida.',
            type: 'info'
        });
        
    } catch (error) {
        console.error('Erro ao recusar corrida da notificação:', error);
        showMobileNotification({
            title: 'Erro',
            message: 'Erro ao recusar corrida.',
            type: 'error'
        });
    }
}

// Ride request functionality
document.getElementById('requestRideBtn')?.addEventListener('click', async () => {
    const pickup = document.getElementById('pickupLocation').value;
    const destination = document.getElementById('destination').value;
    const price = document.getElementById('ridePrice').value;
    
    if (!pickup || !destination) {
        showMobileNotification({
            title: 'Erro',
            message: 'Por favor, preencha os campos de partida e destino.',
            type: 'error'
        });
        return;
    }
    
    if (!price || price < 5) {
        showMobileNotification({
            title: 'Erro',
            message: 'Por favor, informe um valor mínimo de R$ 5,00.',
            type: 'error'
        });
        return;
    }
    
    try {
        const rideData = {
            passengerId: currentUser.uid,
            passengerName: currentUser.name,
            passengerPhone: currentUser.phone,
            pickup: pickup,
            destination: destination,
            price: parseFloat(price).toFixed(2),
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        
        const newRideRef = database.ref('rides').push();
        await newRideRef.set(rideData);
        
        currentRideId = newRideRef.key;
        
        updatePassengerRideStatus(rideData);
        loadPassengerHistory(currentUser.uid);
        
        showMobileNotification({
            title: 'Corrida Solicitada!',
            message: 'Aguarde um piloto aceitar sua corrida.',
            type: 'success'
        });
        
        // Notificar motoristas disponíveis
        const availableDrivers = await getAvailableDrivers();
        for (const driver of availableDrivers) {
            await sendPushNotification(driver.uid, {
                title: 'Nova Corrida Disponível!',
                body: `${currentUser.name} solicitou uma corrida de ${pickup} para ${destination} por R$ ${price}`,
                data: {
                    type: 'new-ride',
                    rideId: newRideRef.key,
                    passengerName: currentUser.name,
                    passengerPhone: currentUser.phone,
                    pickup: pickup,
                    destination: destination,
                    price: price
                }
            });
        }
        
    } catch (error) {
        console.error('Error requesting ride:', error);
        showMobileNotification({
            title: 'Erro',
            message: 'Erro ao solicitar corrida. Tente novamente.',
            type: 'error'
        });
    }
});

// Get available drivers
async function getAvailableDrivers() {
    try {
        const driversSnapshot = await database.ref('drivers')
            .orderByChild('available')
            .equalTo(true)
            .once('value');
        
        const drivers = driversSnapshot.val();
        const availableDrivers = [];
        
        if (drivers) {
            Object.keys(drivers).forEach(driverId => {
                if (driverId !== currentUser.uid) {
                    availableDrivers.push({
                        uid: driverId,
                        ...drivers[driverId]
                    });
                }
            });
        }
        
        return availableDrivers;
    } catch (error) {
        console.error('Erro ao obter motoristas disponíveis:', error);
        return [];
    }
}

// Send push notification (simulated)
async function sendPushNotification(toUserId, notificationData) {
    try {
        // Obter token FCM do destinatário
        const userSnapshot = await database.ref('users/' + toUserId).once('value');
        const userData = userSnapshot.val();
        
        if (!userData || !userData.fcmToken) {
            console.log('Usuário não tem token FCM registrado');
            return false;
        }
        
        // Simular envio de notificação push
        console.log('Simulando envio de push para:', userData.fcmToken);
        console.log('Dados:', notificationData);
        
        // Mostrar notificação local para teste
        if (toUserId === currentUser?.uid) {
            showMobileNotification({
                title: notificationData.title,
                message: notificationData.body,
                type: notificationData.data?.type || 'info',
                data: notificationData.data
            });
        }
        
        return true;
    } catch (error) {
        console.error('Erro ao enviar notificação push:', error);
        return false;
    }
}

// Cancel ride for passenger
document.getElementById('cancelRideBtn')?.addEventListener('click', async () => {
    if (!currentRideId) return;
    
    if (confirm('Tem certeza que deseja cancelar esta corrida?')) {
        try {
            await database.ref('rides/' + currentRideId).update({
                status: 'cancelled',
                cancelledAt: new Date().toISOString()
            });
            
            // Make driver available again if there was one
            const rideSnapshot = await database.ref('rides/' + currentRideId).once('value');
            const ride = rideSnapshot.val();
            
            if (ride && ride.driverId) {
                await database.ref('drivers/' + ride.driverId).update({
                    available: true,
                    lastUpdate: new Date().toISOString()
                });
                
                // Notificar o motorista sobre o cancelamento
                await sendPushNotification(ride.driverId, {
                    title: 'Corrida Cancelada',
                    body: `O passageiro ${ride.passengerName} cancelou a corrida.`,
                    data: {
                        type: 'ride-cancelled',
                        passengerName: ride.passengerName
                    }
                });
            }
            
            showMobileNotification({
                title: 'Corrida Cancelada',
                message: 'Sua corrida foi cancelada com sucesso.',
                type: 'info'
            });
            
            loadPassengerHistory(currentUser.uid);
            
        } catch (error) {
            console.error('Error cancelling ride:', error);
            showMobileNotification({
                title: 'Erro',
                message: 'Erro ao cancelar corrida.',
                type: 'error'
            });
        }
    }
});

// Event delegation for ride request buttons
document.getElementById('rideRequestsList')?.addEventListener('click', async (e) => {
    const rideId = e.target.closest('button')?.dataset.rideId;
    if (!rideId) return;
    
    const rideSnapshot = await database.ref('rides/' + rideId).once('value');
    const ride = rideSnapshot.val();
    
    if (!ride) return;
    
    if (e.target.closest('.accept-ride-btn')) {
        try {
            await database.ref('rides/' + rideId).update({
                status: 'accepted',
                driverId: currentUser.uid,
                driverName: currentUser.name,
                driverPhone: currentUser.phone,
                acceptedAt: new Date().toISOString()
            });
            
            await database.ref('drivers/' + currentUser.uid).update({
                available: false,
                lastUpdate: new Date().toISOString()
            });
            
            // Show notification with WhatsApp option
            showMobileNotification({
                title: 'Corrida Aceita!',
                message: `Você aceitou a corrida de ${ride.passengerName}. Telefone: ${ride.passengerPhone || 'Não informado'}`,
                type: 'ride-accepted',
                passengerName: ride.passengerName,
                passengerPhone: ride.passengerPhone,
                actions: ride.passengerPhone ? [
                    {
                        text: 'WhatsApp',
                        type: 'whatsapp',
                        phone: ride.passengerPhone,
                        name: ride.passengerName,
                        role: 'piloto'
                    },
                    {
                        text: 'Ver',
                        type: 'view'
                    }
                ] : [
                    {
                        text: 'Ver',
                        type: 'view'
                    }
                ]
            });
            
            // Enviar notificação para o passageiro
            await sendPushNotification(ride.passengerId, {
                title: 'Corrida Aceita!',
                body: `Piloto ${currentUser.name} aceitou sua corrida. Telefone: ${currentUser.phone}`,
                data: {
                    type: 'ride-accepted',
                    driverName: currentUser.name,
                    driverPhone: currentUser.phone,
                    role: 'passageiro'
                }
            });
            
        } catch (error) {
            console.error('Error accepting ride:', error);
            showMobileNotification({
                title: 'Erro',
                message: 'Erro ao aceitar corrida.',
                type: 'error'
            });
        }
        
    } else if (e.target.closest('.decline-ride-btn')) {
        if (confirm('Recusar esta corrida?')) {
            try {
                await database.ref('rides/' + rideId).update({
                    status: 'cancelled',
                    cancelledAt: new Date().toISOString(),
                    cancelledBy: 'driver'
                });
                
                showMobileNotification({
                    title: 'Corrida Recusada',
                    message: 'Você recusou a corrida.',
                    type: 'info'
                });
                
                // Notificar o passageiro
                await sendPushNotification(ride.passengerId, {
                    title: 'Corrida Recusada',
                    body: 'Infelizmente um piloto recusou sua corrida. Por favor, solicite novamente.',
                    data: {
                        type: 'ride-declined'
                    }
                });
                
            } catch (error) {
                console.error('Error declining ride:', error);
                showMobileNotification({
                    title: 'Erro',
                    message: 'Erro ao recusar corrida.',
                    type: 'error'
                });
            }
        }
    }
});

// Start ride for driver
document.getElementById('startRideBtn')?.addEventListener('click', async () => {
    if (!currentRideId) return;
    
    try {
        await database.ref('rides/' + currentRideId).update({
            status: 'started',
            startedAt: new Date().toISOString()
        });
        
        showMobileNotification({
            title: 'Corrida Iniciada!',
            message: 'Você iniciou a corrida.',
            type: 'ride-started'
        });
        
        // Notificar o passageiro
        const rideSnapshot = await database.ref('rides/' + currentRideId).once('value');
        const ride = rideSnapshot.val();
        
        if (ride) {
            await sendPushNotification(ride.passengerId, {
                title: 'Corrida Iniciada!',
                body: `Piloto ${currentUser.name} iniciou a corrida.`,
                data: {
                    type: 'ride-started',
                    driverName: currentUser.name
                }
            });
        }
        
    } catch (error) {
        console.error('Error starting ride:', error);
        showMobileNotification({
            title: 'Erro',
            message: 'Erro ao iniciar corrida.',
            type: 'error'
        });
    }
});

// Complete ride for driver
document.getElementById('completeRideBtn')?.addEventListener('click', async () => {
    if (!currentRideId) return;
    
    if (confirm('Confirmar finalização da corrida?')) {
        try {
            await database.ref('rides/' + currentRideId).update({
                status: 'completed',
                completedAt: new Date().toISOString()
            });
            
            await database.ref('drivers/' + currentUser.uid).update({
                available: true,
                lastUpdate: new Date().toISOString()
            });
            
            // Update driver stats
            const driverSnapshot = await database.ref('drivers/' + currentUser.uid).once('value');
            const driverData = driverSnapshot.val();
            const newTotalRides = (driverData.totalRides || 0) + 1;
            
            await database.ref('drivers/' + currentUser.uid).update({
                totalRides: newTotalRides
            });
            
            document.getElementById('activeRide').style.display = 'none';
            whatsappDriverSection.style.display = 'none';
            
            showMobileNotification({
                title: 'Corrida Concluída!',
                message: `Corrida finalizada com sucesso!`,
                type: 'success'
            });
            
            // Notificar o passageiro
            const rideSnapshot = await database.ref('rides/' + currentRideId).once('value');
            const ride = rideSnapshot.val();
            
            if (ride) {
                await sendPushNotification(ride.passengerId, {
                    title: 'Corrida Concluída!',
                    body: `Sua corrida foi finalizada com sucesso. Valor: R$ ${ride.price}`,
                    data: {
                        type: 'ride-completed',
                        price: ride.price
                    }
                });
            }
            
            loadDriverHistory(currentUser.uid);
            setupDriverAvailability(currentUser.uid);
            
            document.getElementById('activeRideRequests').style.display = 'block';
            
        } catch (error) {
            console.error('Error completing ride:', error);
            showMobileNotification({
                title: 'Erro',
                message: 'Erro ao finalizar corrida.',
                type: 'error'
            });
        }
    }
});

// Cancel active ride for driver
document.getElementById('cancelActiveRideBtn')?.addEventListener('click', async () => {
    if (!currentRideId) return;
    
    if (confirm('Cancelar esta corrida?')) {
        try {
            const rideSnapshot = await database.ref('rides/' + currentRideId).once('value');
            const ride = rideSnapshot.val();
            
            await database.ref('rides/' + currentRideId).update({
                status: 'cancelled',
                cancelledAt: new Date().toISOString(),
                cancelledBy: 'driver'
            });
            
            await database.ref('drivers/' + currentUser.uid).update({
                available: true,
                lastUpdate: new Date().toISOString()
            });
            
            document.getElementById('activeRide').style.display = 'none';
            whatsappDriverSection.style.display = 'none';
            
            showMobileNotification({
                title: 'Corrida Cancelada',
                message: 'Você cancelou a corrida.',
                type: 'info'
            });
            
            // Notificar o passageiro
            if (ride) {
                await sendPushNotification(ride.passengerId, {
                    title: 'Corrida Cancelada',
                    body: `O piloto ${currentUser.name} cancelou a corrida.`,
                    data: {
                        type: 'ride-cancelled',
                        driverName: currentUser.name
                    }
                });
            }
            
            setupDriverAvailability(currentUser.uid);
            document.getElementById('activeRideRequests').style.display = 'block';
            
        } catch (error) {
            console.error('Error cancelling active ride:', error);
            showMobileNotification({
                title: 'Erro',
                message: 'Erro ao cancelar corrida.',
                type: 'error'
            });
        }
    }
});