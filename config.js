// config.js - Конфигурация приложения

const CONFIG = {
    // CryptoBot настройки
    CRYPTOBOT: {
        API_TOKEN: '506569:AA7e1N4yD35IV8z7GHdP3D5AAbcy6Dpu9ZY', // Замените на ваш реальный токен
        TEST_MODE: false,
        SUPPORTED_ASSETS: ['USDT', 'BTC', 'ETH', 'TON'],
        DEFAULT_ASSET: 'USDT'
    },
    
    // Настройки комиссий
    COMMISSIONS: {
        DEPOSIT_FEE: 0, // 0% за пополнение через CryptoBot
        WITHDRAWAL_FEE: 0.02, // 2% за вывод
        GAME_COMMISSION: 0.05, // 5% комиссия бота
        PARTNER_COMMISSION: 0.10 // 10% партнерская комиссия
    },
    
    // Лимиты
    LIMITS: {
        MIN_DEPOSIT: 1, // Минимальное пополнение в USD
        MAX_DEPOSIT: 10000, // Максимальное пополнение в USD
        MIN_WITHDRAWAL: 10, // Минимальный вывод в USD
        MAX_WITHDRAWAL: 5000, // Максимальный вывод в USD
        MIN_BET: 1, // Минимальная ставка
        MAX_BET: 1000 // Максимальная ставка
    },
    
    // Настройки игры
    GAME: {
        START_BALANCE: 100, // Стартовый игровой баланс
        BOT_DIFFICULTY: 'medium', // Сложность бота
        GAME_TIMEOUT: 300 // Таймаут игры в секундах
    },
    
    // Админ настройки
    ADMIN: {
        USERNAME: 'KovalchukAdmin',
        PASSWORD: '99Adidas.Shewi12011979',
        TELEGRAM_ADMIN_ID: 6283217323
    },
    
    // URL и пути
    URLS: {
        BASE: window.location.origin,
        CRYPTOBOT_WEBHOOK: '/cryptobot-webhook.html',
        PAYMENT_SUCCESS: '/payment-success.html'
    }
};

// Функция для сохранения токена CryptoBot
function setCryptoBotToken(token) {
    localStorage.setItem('cryptobot_api_token', token);
    CONFIG.CRYPTOBOT.API_TOKEN = token;
    return token;
}

// Функция для получения токена
function getCryptoBotToken() {
    return localStorage.getItem('cryptobot_api_token') || CONFIG.CRYPTOBOT.API_TOKEN;
}

// Экспорт конфигурации
window.APP_CONFIG = CONFIG;
window.setCryptoBotToken = setCryptoBotToken;
window.getCryptoBotToken = getCryptoBotToken;