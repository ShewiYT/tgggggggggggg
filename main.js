// main.js - Основной файл инициализации приложения

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Инициализация приложения...');
    
    try {
        // 1. Инициализация хранилища
        initStorage();
        console.log('Хранилище инициализировано');
        
        // 2. Инициализация пользователя
        await initUserSystem();
        
        // 3. Инициализация платежной системы
        await initPaymentSystem();
        
        // 4. Инициализация партнёрской системы
        initPartnerSystem();
        
        // 5. Инициализация системы комиссий
        initCommissionSystem();
        
        // 6. Инициализация бота
        initBotSystem();
        
        console.log('Приложение успешно инициализировано');
        
        // Показываем приветственное сообщение
        showWelcomeMessage();
        
    } catch (error) {
        console.error('Ошибка инициализации приложения:', error);
        showNotification('Ошибка загрузки приложения. Пожалуйста, перезагрузите страницу.', 'error');
    }
});

// Инициализация системы пользователей
async function initUserSystem() {
    console.log('Инициализация системы пользователей...');
    
    let currentUser = null;
    
    // Проверяем Telegram Web App
    if (window.Telegram && Telegram.WebApp) {
        console.log('Обнаружен Telegram Web App');
        currentUser = await initTelegramUser();
    } else {
        console.log('Локальный режим (без Telegram)');
        currentUser = initLocalUser();
    }
    
    // Устанавливаем текущего пользователя
    if (currentUser) {
        setCurrentUser(currentUser);
        
        // Выдаем стартовый баланс если нужно
        grantStartBalance(currentUser);
        
        // Обновляем UI
        updateUserUI(currentUser);
        
        console.log('Пользователь инициализирован:', currentUser.username);
    }
    
    return currentUser;
}

// Инициализация пользователя Telegram
async function initTelegramUser() {
    try {
        Telegram.WebApp.ready();
        Telegram.WebApp.expand();
        
        const tgUser = Telegram.WebApp.initDataUnsafe?.user;
        if (!tgUser) {
            console.warn('Пользователь Telegram не найден');
            return initLocalUser();
        }
        
        console.log('Пользователь Telegram:', tgUser);
        
        // Специальный пользователь с Telegram ID 6283217323 - админ
        if (tgUser.id === 6283217323) {
            return createOrGetAdminUser(tgUser);
        } else {
            return createOrGetRegularUser(tgUser);
        }
        
    } catch (error) {
        console.error('Ошибка инициализации Telegram пользователя:', error);
        return initLocalUser();
    }
}

// Создание или получение администратора
function createOrGetAdminUser(tgUser) {
    const username = tgUser.username || `admin_${tgUser.id}`;
    const password = tgUser.id.toString();
    
    let user = getUserByCredentials(username, password);
    
    if (!user) {
        console.log('Создаем нового администратора...');
        user = createUser(username, password);
        user.isAdmin = true;
        user.isPartner = true;
        user.realBalance = 10000;
        user.gameBalance = 5000;
        user.telegramId = tgUser.id;
        user.telegramData = {
            first_name: tgUser.first_name,
            last_name: tgUser.last_name,
            photo_url: tgUser.photo_url
        };
        updateUser(user);
    }
    
    // Обновляем данные Telegram если нужно
    if (!user.telegramId) {
        user.telegramId = tgUser.id;
        user.telegramData = {
            first_name: tgUser.first_name,
            last_name: tgUser.last_name,
            photo_url: tgUser.photo_url
        };
        updateUser(user);
    }
    
    return user;
}

// Создание или получение обычного пользователя
function createOrGetRegularUser(tgUser) {
    const username = tgUser.username || `user_${tgUser.id}`;
    const password = tgUser.id.toString();
    
    let user = getUserByCredentials(username, password);
    
    if (!user) {
        console.log('Создаем нового пользователя...');
        user = createUser(username, password);
        user.telegramId = tgUser.id;
        user.telegramData = {
            first_name: tgUser.first_name,
            last_name: tgUser.last_name,
            photo_url: tgUser.photo_url
        };
        
        // Проверяем реферальный код если есть
        const urlParams = new URLSearchParams(window.location.search);
        const refCode = urlParams.get('ref');
        if (refCode) {
            user.referredBy = refCode;
        }
        
        updateUser(user);
    }
    
    return user;
}

// Инициализация локального пользователя (для тестирования без Telegram)
function initLocalUser() {
    const users = getUsers();
    
    if (users.length === 0) {
        // Создаем тестового пользователя
        console.log('Создаем тестового пользователя...');
        const testUser = createUser('ТестовыйИгрок', 'test123');
        testUser.gameBalance = 100;
        testUser.realBalance = 50;
        updateUser(testUser);
        return testUser;
    }
    
    // Возвращаем первого пользователя или текущего
    const currentUserId = localStorage.getItem('currentUserId');
    if (currentUserId) {
        const user = getUserById(parseInt(currentUserId));
        if (user) return user;
    }
    
    return users[0];
}

// Выдача стартового баланса
function grantStartBalance(user) {
    // Проверяем, выдавался ли уже стартовый баланс
    const startBalanceGranted = localStorage.getItem(`startBalanceGranted_${user.id}`);
    
    if (!startBalanceGranted && (user.gameBalance === undefined || user.gameBalance < 100)) {
        user.gameBalance = 100; // Стартовый баланс
        updateUser(user);
        localStorage.setItem(`startBalanceGranted_${user.id}`, 'true');
        console.log('Выдан стартовый баланс 100 монет для пользователя:', user.username);
        
        // Показываем уведомление (только при первом входе)
        setTimeout(() => {
            showNotification('🎉 Добро пожаловать! Вам начислен стартовый бонус: 100 игровых монет!', 'success');
        }, 1000);
    }
}

// Обновление UI пользователя
function updateUserUI(user) {
    // Обновляем имя в шапке
    const usernameElement = document.getElementById('username');
    if (usernameElement) {
        usernameElement.textContent = user.username || 'Игрок';
    }
    
    // Обновляем аватар если есть Telegram фото
    const avatarElement = document.getElementById('userAvatar');
    if (avatarElement && user.telegramData?.photo_url) {
        avatarElement.innerHTML = `<img src="${user.telegramData.photo_url}" alt="Аватар">`;
    }
    
    // Обновляем балансы
    if (typeof updateBalanceDisplay === 'function') {
        updateBalanceDisplay();
    }
    
    // Обновляем кнопки по ролям
    if (typeof updateUIByRole === 'function') {
        updateUIByRole();
    }
}

// Инициализация платежной системы
async function initPaymentSystem() {
    console.log('Инициализация платежной системы...');
    
    // Инициализация CryptoBot
    await initCryptoBotSystem();
    
    // Инициализация основной платежной системы
    if (typeof initPaymentSystem === 'function') {
        const paymentSystem = initPaymentSystem();
        console.log('Платежная система инициализирована:', paymentSystem);
    }
    
    return true;
}

// Инициализация CryptoBot
async function initCryptoBotSystem() {
    try {
        // Получаем токен из конфигурации
        const token = getCryptoBotToken();
        
        if (token && token !== 'ВАШ_API_ТОКЕН') {
            console.log('Инициализация CryptoBot с токеном:', token.substring(0, 10) + '...');
            
            if (typeof initCryptoBot === 'function') {
                const cryptoBot = initCryptoBot(token);
                const initResult = await cryptoBot.init();
                
                if (initResult.success) {
                    console.log('CryptoBot успешно инициализирован');
                    window.CryptoBot = cryptoBot;
                    return true;
                } else {
                    console.warn('CryptoBot не удалось инициализировать:', initResult.error);
                }
            }
        } else {
            console.warn('Токен CryptoBot не настроен. Используется тестовый режим.');
        }
    } catch (error) {
        console.error('Ошибка инициализации CryptoBot:', error);
    }
    
    return false;
}

// Инициализация партнёрской системы
function initPartnerSystem() {
    if (typeof initPartnerSystem === 'function') {
        initPartnerSystem();
        console.log('Партнёрская система инициализирована');
    }
    
    // Проверяем реферальные параметры в URL
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    
    if (refCode) {
        const user = getCurrentUser();
        if (user && !user.referredBy) {
            // Обрабатываем реферальную регистрацию
            processReferralRegistration(user.id, refCode);
            console.log('Реферальная регистрация обработана для пользователя:', user.username);
        }
        
        // Убираем параметр из URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

// Инициализация системы комиссий
function initCommissionSystem() {
    if (typeof initCommissionSystem === 'function') {
        initCommissionSystem();
        console.log('Система комиссий инициализирована');
    }
}

// Инициализация системы бота
function initBotSystem() {
    if (typeof initBot === 'function') {
        initBot();
        console.log('Система бота инициализирована');
    }
}

// Показ приветственного сообщения
function showWelcomeMessage() {
    const user = getCurrentUser();
    if (!user) return;
    
    // Проверяем, показывали ли уже приветствие сегодня
    const lastWelcome = localStorage.getItem(`lastWelcome_${user.id}`);
    const today = new Date().toDateString();
    
    if (lastWelcome !== today) {
        localStorage.setItem(`lastWelcome_${user.id}`, today);
        
        setTimeout(() => {
            if (user.gameBalance === 100) {
                showNotification(`Добро пожаловать, ${user.username}! 🎮 Начните игру с ботом для тренировки.`, 'info');
            } else if (user.isAdmin) {
                showNotification(`Администратор ${user.username}, добро пожаловать в панель управления!`, 'info');
            }
        }, 1500);
    }
}

// Функция для обработки реферальной регистрации
function processReferralRegistration(userId, referralCode) {
    const user = getUserById(userId);
    if (!user) return;
    
    // Находим партнёра по реферальному коду
    const partner = findPartnerByReferralCode(referralCode);
    if (!partner) return;
    
    // Сохраняем информацию о реферале
    user.referredBy = partner.id;
    user.referralCode = referralCode;
    updateUser(user);
    
    // Начисляем бонус партнёру за регистрацию
    awardReferralRegistrationBonus(partner.id, userId);
    
    console.log(`Пользователь ${user.username} зарегистрирован по реферальной ссылке партнёра ${partner.username}`);
    
    return partner;
}

// Поиск партнёра по реферальному коду
function findPartnerByReferralCode(code) {
    const users = getUsers();
    
    // Ищем пользователя с этим реферальным кодом
    return users.find(user => 
        user.isPartner && 
        (user.referralCodes?.includes(code) || user.id.toString() === code)
    );
}

// Начисление бонуса за регистрацию реферала
function awardReferralRegistrationBonus(partnerId, referralId) {
    const partner = getUserById(partnerId);
    if (!partner) return;
    
    // Создаем запись о реферале
    if (!partner.referrals) {
        partner.referrals = [];
    }
    
    partner.referrals.push({
        userId: referralId,
        date: new Date().toISOString(),
        type: 'registration',
        bonus: 0 // Бонус будет начислен после первой ставки
    });
    
    updateUser(partner);
    
    // Сохраняем транзакцию
    saveTransaction({
        userId: partnerId,
        type: 'referral_registration',
        amount: 0,
        referralId: referralId,
        status: 'pending',
        description: 'Новый реферал зарегистрирован'
    });
    
    console.log(`Бонус за регистрацию реферала начислен партнёру ${partner.username}`);
}

// Глобальные вспомогательные функции
function getCryptoBotToken() {
    // Пытаемся получить токен из разных источников
    const token = localStorage.getItem('cryptobot_api_token') || 
                  window.APP_CONFIG?.CRYPTOBOT?.API_TOKEN || 
                  '506569:AA7e1N4yD35IV8z7GHdP3D5AAbcy6Dpu9ZY';
    
    return token;
}

// Экспортируем функции для использования в других файлах
window.initUserSystem = initUserSystem;
window.initCryptoBotSystem = initCryptoBotSystem;
window.processReferralRegistration = processReferralRegistration;
window.getCryptoBotToken = getCryptoBotToken;