// cryptobot.js - Интеграция с CryptoBot платежной системой

class CryptoBotPayment {
    constructor(apiToken, testMode = false) {
        this.apiToken = apiToken;
        this.testMode = testMode;
        this.baseURL = testMode 
            ? 'https://testnet-pay.crypt.bot'
            : 'https://pay.crypt.bot';
        
        this.webhookSet = false;
        this.init();
    }
    
    async init() {
        console.log('Инициализация CryptoBot платежной системы...');
        
        try {
            // Проверяем соединение с API
            const me = await this.getMe();
            console.log('CryptoBot подключен:', me);
            
            // Настраиваем webhook для уведомлений
            await this.setupWebhook();
            
            return {
                success: true,
                user: me
            };
        } catch (error) {
            console.error('Ошибка инициализации CryptoBot:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // 1. Получить информацию о боте
    async getMe() {
        const response = await this.request('getMe');
        return response.result;
    }
    
    // 2. Создать инвойс (счет на оплату)
    async createInvoice(userId, amount, currency = 'USD', description = 'Пополнение баланса') {
        try {
            // Конвертируем сумму в криптовалюту
            const exchange = await this.getExchangeRates();
            
            // Выбираем криптовалюту (по умолчанию USDT)
            const asset = 'USDT';
            const rate = exchange.find(r => r.source === asset && r.target === currency);
            
            if (!rate) {
                throw new Error(`Курс для ${asset} не найден`);
            }
            
            // Рассчитываем сумму в криптовалюте
            const amountCrypto = (amount / rate.rate).toFixed(6);
            
            // Создаем инвойс
            const response = await this.request('createInvoice', {
                asset: asset,
                amount: amountCrypto,
                description: description,
                hidden_message: `Пополнение на ${amount} ${currency}`,
                paid_btn_name: 'return',
                paid_btn_url: window.location.origin + '/payment-success.html',
                payload: JSON.stringify({
                    userId: userId,
                    amount: amount,
                    currency: currency,
                    type: 'deposit'
                })
            });
            
            return {
                success: true,
                invoiceId: response.result.invoice_id,
                invoiceUrl: response.result.pay_url,
                amountCrypto: amountCrypto,
                asset: asset,
                amountFiat: amount,
                currency: currency,
                expiresAt: response.result.expires_at
            };
        } catch (error) {
            console.error('Ошибка создания инвойса:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // 3. Проверить статус инвойса
    async getInvoice(invoiceId) {
        try {
            const response = await this.request('getInvoices', {
                invoice_ids: invoiceId
            });
            
            if (response.result.items.length === 0) {
                throw new Error('Инвойс не найден');
            }
            
            const invoice = response.result.items[0];
            return {
                success: true,
                invoice: invoice,
                status: invoice.status,
                paid: invoice.status === 'paid'
            };
        } catch (error) {
            console.error('Ошибка проверки инвойса:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // 4. Получить курсы обмена
    async getExchangeRates() {
        try {
            const response = await this.request('getExchangeRates');
            return response.result;
        } catch (error) {
            console.error('Ошибка получения курсов:', error);
            throw error;
        }
    }
    
    // 5. Создать вывод средств
    async createWithdrawal(userId, amount, asset = 'USDT', address, extraId = '') {
        try {
            const response = await this.request('transfer', {
                user_id: userId,
                asset: asset,
                amount: amount,
                spend_id: `withdrawal_${Date.now()}_${userId}`,
                comment: 'Вывод средств с игровой платформы'
            });
            
            return {
                success: true,
                transferId: response.result.id,
                status: response.result.status
            };
        } catch (error) {
            console.error('Ошибка вывода средств:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // 6. Настроить webhook для уведомлений
    async setupWebhook() {
        if (this.webhookSet) return;
        
        try {
            // URL для получения уведомлений о платежах
            const webhookUrl = window.location.origin + '/cryptobot-webhook.html';
            
            const response = await this.request('setWebhook', {
                url: webhookUrl,
                event_types: ['invoice_paid', 'transfer_completed']
            });
            
            this.webhookSet = true;
            console.log('Webhook настроен:', response.result);
            
            return {
                success: true,
                url: webhookUrl
            };
        } catch (error) {
            console.error('Ошибка настройки webhook:', error);
            // Продолжаем работу без webhook
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // 7. Получить баланс
    async getBalance() {
        try {
            const response = await this.request('getBalance');
            return response.result;
        } catch (error) {
            console.error('Ошибка получения баланса:', error);
            throw error;
        }
    }
    
    // 8. Получить историю транзакций
    async getHistory(asset = 'USDT', limit = 100, offset = 0) {
        try {
            const response = await this.request('getTransfers', {
                asset: asset,
                limit: limit,
                offset: offset
            });
            
            return response.result.items;
        } catch (error) {
            console.error('Ошибка получения истории:', error);
            throw error;
        }
    }
    
    // Базовый метод для запросов к API
    async request(method, params = {}) {
        const url = `${this.baseURL}/${method}`;
        
        const headers = {
            'Crypto-Pay-API-Token': this.apiToken,
            'Content-Type': 'application/json'
        };
        
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(params)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.ok) {
            throw new Error(`API error: ${data.error?.name || 'Unknown error'}`);
        }
        
        return data;
    }
    
    // Генерация QR-кода для платежа
    generateQRCode(invoiceUrl) {
        // Используем Google Charts API для генерации QR-кода
        const qrCodeUrl = `https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${encodeURIComponent(invoiceUrl)}&choe=UTF-8`;
        return qrCodeUrl;
    }
    
    // Форматирование суммы криптовалюты
    formatCryptoAmount(amount, asset) {
        const decimals = {
            'BTC': 8,
            'ETH': 6,
            'USDT': 2,
            'TON': 2
        };
        
        const decimalPlaces = decimals[asset] || 6;
        return parseFloat(amount).toFixed(decimalPlaces);
    }
    
    // Получить список поддерживаемых активов
    getSupportedAssets() {
        return [
            { code: 'BTC', name: 'Bitcoin', icon: 'fab fa-bitcoin' },
            { code: 'ETH', name: 'Ethereum', icon: 'fab fa-ethereum' },
            { code: 'USDT', name: 'Tether (TRC20)', icon: 'fas fa-coins' },
            { code: 'TON', name: 'Toncoin', icon: 'fas fa-gem' },
            { code: 'BNB', name: 'Binance Coin', icon: 'fab fa-btc' },
            { code: 'TRX', name: 'TRON', icon: 'fas fa-bolt' }
        ];
    }
}

// Создаем глобальный экземпляр CryptoBot
let cryptoBotInstance = null;

// Инициализация CryptoBot
function initCryptoBot(apiToken, testMode = false) {
    if (!apiToken) {
        console.warn('CryptoBot API токен не указан. Используется тестовый режим.');
        // Для тестирования можно использовать тестовый токен
        apiToken = 'test_token';
        testMode = true;
    }
    
    cryptoBotInstance = new CryptoBotPayment(apiToken, testMode);
    return cryptoBotInstance;
}

// Создание платежа через CryptoBot
async function createCryptoPayment(userId, amount, currency = 'USD') {
    if (!cryptoBotInstance) {
        throw new Error('CryptoBot не инициализирован');
    }
    
    return await cryptoBotInstance.createInvoice(userId, amount, currency);
}

// Проверка статуса платежа
async function checkCryptoPayment(invoiceId) {
    if (!cryptoBotInstance) {
        throw new Error('CryptoBot не инициализирован');
    }
    
    return await cryptoBotInstance.getInvoice(invoiceId);
}

// Вывод средств через CryptoBot
async function createCryptoWithdrawal(userId, amount, asset, address) {
    if (!cryptoBotInstance) {
        throw new Error('CryptoBot не инициализирован');
    }
    
    return await cryptoBotInstance.createWithdrawal(userId, amount, asset, address);
}

// Получить баланс CryptoBot
async function getCryptoBalance() {
    if (!cryptoBotInstance) {
        throw new Error('CryptoBot не инициализирован');
    }
    
    return await cryptoBotInstance.getBalance();
}

// Генерация QR-кода
function generateCryptoQR(invoiceUrl) {
    if (!cryptoBotInstance) {
        throw new Error('CryptoBot не инициализирован');
    }
    
    return cryptoBotInstance.generateQRCode(invoiceUrl);
}

// Показать модальное окно оплаты через CryptoBot
function showCryptoPaymentModal(userId, amount, currency = 'USD', onSuccess = null) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
        <div class="modal-content">
            <h2><i class="fas fa-coins"></i> Оплата через CryptoBot</h2>
            <div class="payment-loading" id="cryptoLoading">
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
                <p>Создание счета на оплату...</p>
            </div>
            
            <div class="payment-content" id="cryptoContent" style="display: none;">
                <div class="payment-info">
                    <div class="payment-amount">
                        <span class="label">Сумма:</span>
                        <span class="value">${amount} ${currency}</span>
                    </div>
                    <div class="payment-crypto" id="cryptoAmountInfo">
                        <!-- Информация о сумме в криптовалюте -->
                    </div>
                    <div class="payment-expires" id="cryptoExpires">
                        <!-- Время истечения -->
                    </div>
                </div>
                
                <div class="payment-qr" id="cryptoQR">
                    <!-- QR-код -->
                </div>
                
                <div class="payment-actions">
                    <a class="btn-primary" id="cryptoPayLink" target="_blank">
                        <i class="fab fa-telegram"></i> Оплатить в Telegram
                    </a>
                    <button class="btn-secondary" id="cryptoCopyLink">
                        <i class="fas fa-copy"></i> Копировать ссылку
                    </button>
                </div>
                
                <div class="payment-instructions">
                    <h3><i class="fas fa-info-circle"></i> Как оплатить:</h3>
                    <ol>
                        <li>Нажмите "Оплатить в Telegram" или отсканируйте QR-код</li>
                        <li>В открывшемся Telegram боте подтвердите оплату</li>
                        <li>После успешной оплаты баланс пополнится автоматически</li>
                    </ol>
                </div>
                
                <div class="payment-status" id="cryptoStatus">
                    <!-- Статус оплаты -->
                </div>
            </div>
            
            <div class="payment-error" id="cryptoError" style="display: none;">
                <div class="error-icon">
                    <i class="fas fa-exclamation-circle"></i>
                </div>
                <p id="errorMessage">Ошибка при создании счета</p>
                <button class="btn-primary" onclick="window.location.reload()">
                    <i class="fas fa-redo"></i> Попробовать снова
                </button>
            </div>
            
            <div class="modal-actions">
                <button class="btn-secondary" id="closeCryptoModal">Отмена</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Закрытие модального окна
    modal.querySelector('#closeCryptoModal').addEventListener('click', () => {
        modal.remove();
    });
    
    // Закрытие по клику на фон
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    // Создаем инвойс
    createCryptoPayment(userId, amount, currency)
        .then(result => {
            const loading = modal.querySelector('#cryptoLoading');
            const content = modal.querySelector('#cryptoContent');
            const error = modal.querySelector('#cryptoError');
            
            if (result.success) {
                // Скрываем загрузку, показываем контент
                loading.style.display = 'none';
                content.style.display = 'block';
                
                // Заполняем информацию
                modal.querySelector('#cryptoAmountInfo').innerHTML = `
                    <span class="label">Сумма в криптовалюте:</span>
                    <span class="value crypto-amount">
                        <i class="${getCryptoIcon(result.asset)}"></i>
                        ${cryptoBotInstance.formatCryptoAmount(result.amountCrypto, result.asset)} ${result.asset}
                    </span>
                `;
                
                // Время истечения
                const expires = new Date(result.expiresAt * 1000);
                modal.querySelector('#cryptoExpires').innerHTML = `
                    <span class="label">Действителен до:</span>
                    <span class="value">${expires.toLocaleTimeString()}</span>
                `;
                
                // QR-код
                const qrCodeUrl = cryptoBotInstance.generateQRCode(result.invoiceUrl);
                modal.querySelector('#cryptoQR').innerHTML = `
                    <img src="${qrCodeUrl}" alt="QR код для оплаты" style="max-width: 200px; margin: 0 auto; display: block;">
                `;
                
                // Ссылка для оплаты
                const payLink = modal.querySelector('#cryptoPayLink');
                payLink.href = result.invoiceUrl;
                
                // Копирование ссылки
                modal.querySelector('#cryptoCopyLink').addEventListener('click', () => {
                    navigator.clipboard.writeText(result.invoiceUrl);
                    showNotification('Ссылка скопирована в буфер обмена', 'success');
                });
                
                // Запускаем проверку статуса платежа
                startPaymentPolling(result.invoiceId, modal, onSuccess);
                
            } else {
                // Показываем ошибку
                loading.style.display = 'none';
                error.style.display = 'block';
                modal.querySelector('#errorMessage').textContent = result.error;
            }
        })
        .catch(error => {
            console.error('Ошибка создания платежа:', error);
            const loading = modal.querySelector('#cryptoLoading');
            const errorDiv = modal.querySelector('#cryptoError');
            
            loading.style.display = 'none';
            errorDiv.style.display = 'block';
            modal.querySelector('#errorMessage').textContent = error.message;
        });
}

// Получить иконку для криптовалюты
function getCryptoIcon(asset) {
    const icons = {
        'BTC': 'fab fa-bitcoin',
        'ETH': 'fab fa-ethereum',
        'USDT': 'fas fa-coins',
        'TON': 'fas fa-gem',
        'BNB': 'fab fa-btc',
        'TRX': 'fas fa-bolt'
    };
    
    return icons[asset] || 'fas fa-coins';
}

// Опрос статуса платежа
function startPaymentPolling(invoiceId, modal, onSuccess) {
    const statusDiv = modal.querySelector('#cryptoStatus');
    let attempts = 0;
    const maxAttempts = 60; // 5 минут (каждые 5 секунд)
    
    statusDiv.innerHTML = `
        <div class="status-waiting">
            <i class="fas fa-clock"></i>
            <span>Ожидание оплаты...</span>
            <div class="status-timer" id="paymentTimer">05:00</div>
        </div>
    `;
    
    // Таймер
    let timeLeft = 300; // 5 минут в секундах
    const timerElement = modal.querySelector('#paymentTimer');
    
    const timer = setInterval(() => {
        timeLeft--;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            statusDiv.innerHTML = `
                <div class="status-expired">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Время на оплату истекло</span>
                    <button class="btn-outline" onclick="window.location.reload()">
                        <i class="fas fa-redo"></i> Создать новый счет
                    </button>
                </div>
            `;
        }
    }, 1000);
    
    // Проверка статуса
    const checkInterval = setInterval(async () => {
        attempts++;
        
        if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            clearInterval(timer);
            statusDiv.innerHTML = `
                <div class="status-error">
                    <i class="fas fa-exclamation-circle"></i>
                    <span>Время проверки истекло</span>
                </div>
            `;
            return;
        }
        
        try {
            const result = await checkCryptoPayment(invoiceId);
            
            if (result.paid) {
                clearInterval(checkInterval);
                clearInterval(timer);
                
                // Успешная оплата
                statusDiv.innerHTML = `
                    <div class="status-success">
                        <i class="fas fa-check-circle"></i>
                        <span>Оплата успешно получена!</span>
                        <div class="success-message">
                            Средства будут зачислены в течение 1-2 минут
                        </div>
                    </div>
                `;
                
                // Вызываем callback успеха
                if (typeof onSuccess === 'function') {
                    onSuccess(result.invoice);
                }
                
                // Закрываем модальное окно через 3 секунды
                setTimeout(() => {
                    modal.remove();
                    showNotification('✅ Оплата получена! Баланс пополнен.', 'success');
                }, 3000);
            }
        } catch (error) {
            console.error('Ошибка проверки статуса:', error);
        }
    }, 5000); // Проверяем каждые 5 секунд
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', async function() {
    // Получаем API токен из localStorage или конфигурации
    const apiToken = localStorage.getItem('cryptobot_api_token') || 'ВАШ_ТОКЕН_ЗДЕСЬ';
    
    // Инициализируем CryptoBot
    try {
        const cryptoBot = initCryptoBot(apiToken);
        const initResult = await cryptoBot.init();
        
        if (initResult.success) {
            console.log('CryptoBot успешно инициализирован:', initResult.user);
            
            // Сохраняем в глобальную переменную
            window.CryptoBot = cryptoBot;
            window.createCryptoPayment = createCryptoPayment;
            window.showCryptoPaymentModal = showCryptoPaymentModal;
            
            // Показываем кнопку CryptoBot в интерфейсе
            updatePaymentUI();
        } else {
            console.warn('CryptoBot в тестовом режиме:', initResult.error);
        }
    } catch (error) {
        console.error('Ошибка инициализации CryptoBot:', error);
    }
});

// Обновление UI для показа CryptoBot опций
function updatePaymentUI() {
    // Находим все модальные окна пополнения и добавляем CryptoBot опцию
    const paymentButtons = document.querySelectorAll('[onclick*="showPaymentModal"], [onclick*="showDepositModal"]');
    
    paymentButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Можно добавить перехват клика и показ выбора метода оплаты
        });
    });
}

// Глобальные функции для использования в других файлах
window.cryptoBotModule = {
    initCryptoBot,
    createCryptoPayment,
    checkCryptoPayment,
    showCryptoPaymentModal,
    getCryptoBalance
};