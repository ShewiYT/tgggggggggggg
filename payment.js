// payment.js - Система платежей с интеграцией CryptoBot

const PAYMENT_PROVIDERS = {
    CRYPTOBOT: 'cryptobot',
    CARD: 'card',
    TEST: 'test'
};

// Инициализация платежной системы
function initPaymentSystem() {
    console.log('Инициализация платежной системы...');
    
    // Проверяем наличие CryptoBot
    if (window.CryptoBot) {
        console.log('CryptoBot доступен для платежей');
    } else {
        console.warn('CryptoBot не инициализирован');
    }
    
    return {
        providers: PAYMENT_PROVIDERS,
        currencies: ['USD', 'EUR', 'RUB'],
        minAmount: 1,
        maxAmount: 10000
    };
}

// Показать выбор способа оплаты
function showPaymentSelection(balanceType = 'real', amount = 0) {
    const user = getCurrentUser();
    if (!user) {
        showNotification('Пожалуйста, войдите в систему', 'error');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
        <div class="modal-content">
            <h2><i class="fas fa-wallet"></i> Выберите способ оплаты</h2>
            <p style="margin-bottom: 20px; color: var(--text-secondary);">
                Сумма: <strong>${amount} ${balanceType === 'real' ? 'USD' : 'монет'}</strong>
            </p>
            
            <div class="payment-methods-grid">
                <!-- CryptoBot -->
                <div class="payment-method-card" data-method="cryptobot">
                    <div class="method-header">
                        <div class="method-icon cryptobot">
                            <i class="fas fa-robot"></i>
                        </div>
                        <div class="method-title">CryptoBot</div>
                    </div>
                    <div class="method-features">
                        <div class="feature">
                            <i class="fas fa-check"></i>
                            <span>Криптовалюта</span>
                        </div>
                        <div class="feature">
                            <i class="fas fa-check"></i>
                            <span>Без комиссии</span>
                        </div>
                        <div class="feature">
                            <i class="fas fa-check"></i>
                            <span>Мгновенно</span>
                        </div>
                    </div>
                    <div class="method-currencies">
                        <span class="currency-badge">BTC</span>
                        <span class="currency-badge">ETH</span>
                        <span class="currency-badge">USDT</span>
                        <span class="currency-badge">TON</span>
                    </div>
                    <div class="method-status">
                        ${window.CryptoBot ? '<span class="status-available">Доступно</span>' : '<span class="status-unavailable">Недоступно</span>'}
                    </div>
                </div>
                
                <!-- Карта -->
                <div class="payment-method-card" data-method="card">
                    <div class="method-header">
                        <div class="method-icon card">
                            <i class="fas fa-credit-card"></i>
                        </div>
                        <div class="method-title">Банковская карта</div>
                    </div>
                    <div class="method-features">
                        <div class="feature">
                            <i class="fas fa-check"></i>
                            <span>Visa/Mastercard</span>
                        </div>
                        <div class="feature">
                            <i class="fas fa-times"></i>
                            <span>Комиссия 3%</span>
                        </div>
                        <div class="feature">
                            <i class="fas fa-check"></i>
                            <span>5-10 минут</span>
                        </div>
                    </div>
                    <div class="method-status">
                        <span class="status-available">Доступно</span>
                    </div>
                </div>
                
                <!-- Тестовый платеж -->
                <div class="payment-method-card" data-method="test">
                    <div class="method-header">
                        <div class="method-icon test">
                            <i class="fas fa-vial"></i>
                        </div>
                        <div class="method-title">Тестовый платеж</div>
                    </div>
                    <div class="method-features">
                        <div class="feature">
                            <i class="fas fa-check"></i>
                            <span>Для разработки</span>
                        </div>
                        <div class="feature">
                            <i class="fas fa-check"></i>
                            <span>Без реальных денег</span>
                        </div>
                        <div class="feature">
                            <i class="fas fa-check"></i>
                            <span>Мгновенно</span>
                        </div>
                    </div>
                    <div class="method-status">
                        <span class="status-available">Доступно</span>
                    </div>
                </div>
            </div>
            
            <div class="modal-actions">
                <button class="btn-secondary" id="cancelSelection">Отмена</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Обработчики выбора метода
    modal.querySelectorAll('.payment-method-card').forEach(card => {
        card.addEventListener('click', function() {
            const method = this.dataset.method;
            
            // Проверка доступности CryptoBot
            if (method === 'cryptobot' && !window.CryptoBot) {
                showNotification('CryptoBot не доступен. Проверьте настройки API.', 'error');
                return;
            }
            
            switch(method) {
                case 'cryptobot':
                    modal.remove();
                    showCryptoBotPayment(amount, balanceType);
                    break;
                    
                case 'card':
                    modal.remove();
                    showCardPayment(amount, balanceType);
                    break;
                    
                case 'test':
                    modal.remove();
                    processTestPayment(amount, balanceType);
                    break;
            }
        });
    });
    
    // Отмена
    modal.querySelector('#cancelSelection').addEventListener('click', () => {
        modal.remove();
    });
    
    // Закрытие по клику на фон
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Платеж через CryptoBot
function showCryptoBotPayment(amount, balanceType) {
    const user = getCurrentUser();
    if (!user) {
        showNotification('Пожалуйста, войдите в систему', 'error');
        return;
    }
    
    if (balanceType !== 'real') {
        showNotification('CryptoBot доступен только для реального баланса', 'error');
        return;
    }
    
    // Проверяем минимальную сумму
    if (amount < 1) {
        showNotification('Минимальная сумма пополнения: 1 USD', 'error');
        return;
    }
    
    // Показываем модальное окно CryptoBot
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
        <div class="modal-content">
            <h2><i class="fas fa-robot"></i> Оплата через CryptoBot</h2>
            <div class="crypto-payment-content">
                <div class="payment-loading" id="cryptoLoading">
                    <div class="loading-spinner">
                        <i class="fas fa-spinner fa-spin"></i>
                    </div>
                    <p>Создание счета на оплату...</p>
                </div>
                
                <div class="payment-success" id="cryptoSuccess" style="display: none;">
                    <div class="success-icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <h3>Счет создан!</h3>
                    <div class="invoice-info" id="invoiceInfo"></div>
                    <div class="qr-code" id="cryptoQR"></div>
                    <div class="payment-actions">
                        <a class="btn-primary" id="cryptoPayLink" target="_blank">
                            <i class="fab fa-telegram"></i> Оплатить в Telegram
                        </a>
                        <button class="btn-secondary" id="cryptoCopyLink">
                            <i class="fas fa-copy"></i> Копировать ссылку
                        </button>
                    </div>
                    <div class="payment-status" id="cryptoStatus">
                        <div class="status-waiting">
                            <i class="fas fa-clock"></i>
                            <span>Ожидание оплаты...</span>
                        </div>
                    </div>
                </div>
                
                <div class="payment-error" id="cryptoError" style="display: none;">
                    <div class="error-icon">
                        <i class="fas fa-exclamation-circle"></i>
                    </div>
                    <h3>Ошибка</h3>
                    <p id="errorMessage"></p>
                    <button class="btn-primary" onclick="window.location.reload()">
                        <i class="fas fa-redo"></i> Попробовать снова
                    </button>
                </div>
            </div>
            
            <div class="modal-actions">
                <button class="btn-secondary" id="closeCryptoModal">Закрыть</button>
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
    
    // Создаем инвойс через CryptoBot
    createCryptoBotInvoice(user.id, amount)
        .then(result => {
            const loading = modal.querySelector('#cryptoLoading');
            const success = modal.querySelector('#cryptoSuccess');
            const error = modal.querySelector('#cryptoError');
            
            if (result.success) {
                // Скрываем загрузку, показываем успех
                loading.style.display = 'none';
                success.style.display = 'block';
                
                // Заполняем информацию о счете
                modal.querySelector('#invoiceInfo').innerHTML = `
                    <div class="info-row">
                        <span>Сумма:</span>
                        <strong>${amount} USD</strong>
                    </div>
                    <div class="info-row">
                        <span>В криптовалюте:</span>
                        <strong>${result.amountCrypto} ${result.asset}</strong>
                    </div>
                    <div class="info-row">
                        <span>Действителен до:</span>
                        <strong>${new Date(result.expiresAt * 1000).toLocaleTimeString()}</strong>
                    </div>
                `;
                
                // QR-код
                if (result.qrCode) {
                    modal.querySelector('#cryptoQR').innerHTML = `
                        <img src="${result.qrCode}" alt="QR код для оплаты" style="max-width: 200px;">
                    `;
                }
                
                // Ссылка для оплаты
                const payLink = modal.querySelector('#cryptoPayLink');
                payLink.href = result.invoiceUrl;
                
                // Копирование ссылки
                modal.querySelector('#cryptoCopyLink').addEventListener('click', () => {
                    navigator.clipboard.writeText(result.invoiceUrl);
                    showNotification('Ссылка скопирована в буфер обмена', 'success');
                });
                
                // Запускаем проверку статуса платежа
                startCryptoBotPaymentPolling(result.invoiceId, modal, amount);
                
            } else {
                // Показываем ошибку
                loading.style.display = 'none';
                error.style.display = 'block';
                modal.querySelector('#errorMessage').textContent = result.error || 'Ошибка при создании счета';
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

// Создание инвойса через CryptoBot
async function createCryptoBotInvoice(userId, amount) {
    try {
        if (!window.CryptoBot) {
            throw new Error('CryptoBot не инициализирован');
        }
        
        const response = await window.CryptoBot.createInvoice(
            userId, 
            amount, 
            'USD', 
            'Пополнение баланса в игре Крестики-Нолики'
        );
        
        return response;
    } catch (error) {
        console.error('Ошибка создания инвойса CryptoBot:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Опрос статуса платежа CryptoBot
function startCryptoBotPaymentPolling(invoiceId, modal, amount) {
    const statusDiv = modal.querySelector('#cryptoStatus');
    let attempts = 0;
    const maxAttempts = 120; // 10 минут (каждые 5 секунд)
    
    const checkInterval = setInterval(async () => {
        attempts++;
        
        if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            statusDiv.innerHTML = `
                <div class="status-timeout">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Время проверки истекло</span>
                    <p>Если вы оплатили счет, средства будут зачислены в течение часа</p>
                </div>
            `;
            return;
        }
        
        try {
            const result = await checkCryptoBotInvoice(invoiceId);
            
            if (result.paid) {
                clearInterval(checkInterval);
                
                // Успешная оплата
                statusDiv.innerHTML = `
                    <div class="status-success">
                        <i class="fas fa-check-circle"></i>
                        <span>Оплата успешно получена!</span>
                        <div class="success-message">
                            Зачисляем средства на ваш баланс...
                        </div>
                    </div>
                `;
                
                // Зачисляем средства
                processSuccessfulPayment(amount, 'real', 'cryptobot', invoiceId);
                
                // Закрываем модальное окно через 3 секунды
                setTimeout(() => {
                    modal.remove();
                    showNotification(`✅ Баланс пополнен на ${amount} USD!`, 'success');
                }, 3000);
            }
        } catch (error) {
            console.error('Ошибка проверки статуса:', error);
        }
    }, 5000); // Проверяем каждые 5 секунд
}

// Проверка статуса инвойса CryptoBot
async function checkCryptoBotInvoice(invoiceId) {
    try {
        if (!window.CryptoBot) {
            throw new Error('CryptoBot не инициализирован');
        }
        
        const response = await window.CryptoBot.getInvoice(invoiceId);
        return response;
    } catch (error) {
        console.error('Ошибка проверки инвойса:', error);
        throw error;
    }
}

// Обработка успешного платежа
function processSuccessfulPayment(amount, balanceType, method, paymentId = null) {
    const user = getCurrentUser();
    if (!user) return;
    
    // Обновляем баланс
    if (balanceType === 'real') {
        user.realBalance = (user.realBalance || 0) + parseFloat(amount);
    } else {
        user.gameBalance = (user.gameBalance || 0) + parseFloat(amount);
    }
    
    updateUser(user);
    
    // Сохраняем транзакцию
    saveTransaction({
        userId: user.id,
        type: 'deposit',
        amount: amount,
        balanceType: balanceType,
        method: method,
        paymentId: paymentId,
        status: 'completed',
        timestamp: new Date().toISOString()
    });
    
    // Обновляем отображение баланса
    updateBalanceDisplay();
    
    // Для партнеров - обновляем партнерский баланс если нужно
    if (user.isPartner && method === 'cryptobot') {
        // Можно добавить бонус партнеру за привлечение платежей
    }
    
    return true;
}

// Платеж картой (заглушка)
function showCardPayment(amount, balanceType) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
        <div class="modal-content">
            <h2><i class="fas fa-credit-card"></i> Оплата картой</h2>
            <div class="card-payment-content">
                <div class="payment-info">
                    <p>Сумма: <strong>${amount} ${balanceType === 'real' ? 'USD' : 'монет'}</strong></p>
                    <p>Комиссия: <strong>3%</strong></p>
                    <p>Итого: <strong>${(amount * 1.03).toFixed(2)} ${balanceType === 'real' ? 'USD' : 'монет'}</strong></p>
                </div>
                
                <div class="card-form">
                    <div class="form-group">
                        <label>Номер карты</label>
                        <input type="text" placeholder="0000 0000 0000 0000" maxlength="19">
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label>Срок действия</label>
                            <input type="text" placeholder="ММ/ГГ" maxlength="5">
                        </div>
                        <div class="form-group">
                            <label>CVV</label>
                            <input type="password" placeholder="123" maxlength="3">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Имя на карте</label>
                        <input type="text" placeholder="IVAN IVANOV">
                    </div>
                </div>
                
                <div class="payment-security">
                    <i class="fas fa-shield-alt"></i>
                    <span>Данные защищены SSL шифрованием</span>
                </div>
            </div>
            
            <div class="modal-actions">
                <button class="btn-secondary" id="cancelCardPayment">Отмена</button>
                <button class="btn-primary" id="confirmCardPayment">Оплатить ${(amount * 1.03).toFixed(2)}</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Отмена
    modal.querySelector('#cancelCardPayment').addEventListener('click', () => {
        modal.remove();
    });
    
    // Подтверждение
    modal.querySelector('#confirmCardPayment').addEventListener('click', () => {
        // В реальном приложении здесь будет интеграция с платежным шлюзом
        // Для демонстрации имитируем успешный платеж
        
        showNotification('Платеж обрабатывается...', 'info');
        
        setTimeout(() => {
            processSuccessfulPayment(amount, balanceType, 'card');
            modal.remove();
            showNotification(`✅ Баланс пополнен на ${amount} ${balanceType === 'real' ? 'USD' : 'монет'}!`, 'success');
        }, 2000);
    });
    
    // Закрытие по клику на фон
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Тестовый платеж (для разработки)
function processTestPayment(amount, balanceType) {
    const user = getCurrentUser();
    if (!user) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
        <div class="modal-content">
            <h2><i class="fas fa-vial"></i> Тестовый платеж</h2>
            <div class="test-payment-content">
                <div class="test-info">
                    <p>Это тестовый платеж. Никакие реальные деньги не будут списаны.</p>
                    <p>Сумма: <strong>${amount} ${balanceType === 'real' ? 'USD' : 'монет'}</strong></p>
                </div>
                
                <div class="test-actions">
                    <button class="btn-primary" id="simulateSuccess">
                        <i class="fas fa-check"></i> Имитировать успешный платеж
                    </button>
                    <button class="btn-secondary" id="simulateError">
                        <i class="fas fa-times"></i> Имитировать ошибку
                    </button>
                </div>
            </div>
            
            <div class="modal-actions">
                <button class="btn-secondary" id="cancelTest">Отмена</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Имитация успешного платежа
    modal.querySelector('#simulateSuccess').addEventListener('click', () => {
        processSuccessfulPayment(amount, balanceType, 'test');
        modal.remove();
        showNotification(`✅ Тестовый платеж: баланс пополнен на ${amount} ${balanceType === 'real' ? 'USD' : 'монет'}!`, 'success');
    });
    
    // Имитация ошибки
    modal.querySelector('#simulateError').addEventListener('click', () => {
        modal.remove();
        showNotification('❌ Тестовый платеж: произошла ошибка оплаты', 'error');
    });
    
    // Отмена
    modal.querySelector('#cancelTest').addEventListener('click', () => {
        modal.remove();
    });
    
    // Закрытие по клику на фон
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Показать модальное окно вывода средств
function showWithdrawModal() {
    const user = getCurrentUser();
    if (!user) {
        showNotification('Пожалуйста, войдите в систему', 'error');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
        <div class="modal-content">
            <h2><i class="fas fa-money-bill-wave"></i> Вывод средств</h2>
            <div class="withdrawal-content">
                <div class="balance-info">
                    <p>Доступно для вывода: <strong>${user.realBalance || 0} USD</strong></p>
                    <p class="small-text">Минимальная сумма вывода: 10 USD</p>
                </div>
                
                <div class="withdrawal-form">
                    <div class="form-group">
                        <label>Сумма вывода (USD)</label>
                        <input type="number" id="withdrawAmount" 
                               min="10" 
                               max="${user.realBalance || 0}" 
                               step="0.01"
                               placeholder="10.00">
                    </div>
                    
                    <div class="form-group">
                        <label>Способ вывода</label>
                        <select id="withdrawMethod">
                            <option value="cryptobot">Криптовалюта (CryptoBot)</option>
                            <option value="card">Банковская карта</option>
                            <option value="wallet">Электронный кошелёк</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label id="withdrawDetailsLabel">Крипто-кошелёк</label>
                        <input type="text" id="withdrawDetails" 
                               placeholder="Введите адрес кошелька">
                    </div>
                    
                    <div class="fee-info">
                        <p>Комиссия: <strong>2%</strong></p>
                        <p>Вы получите: <strong id="withdrawNetAmount">0.00 USD</strong></p>
                    </div>
                </div>
            </div>
            
            <div class="modal-actions">
                <button class="btn-secondary" id="cancelWithdraw">Отмена</button>
                <button class="btn-primary" id="confirmWithdraw">Вывести</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Обновление суммы после комиссии
    const amountInput = modal.querySelector('#withdrawAmount');
    const netAmountSpan = modal.querySelector('#withdrawNetAmount');
    const methodSelect = modal.querySelector('#withdrawMethod');
    const detailsLabel = modal.querySelector('#withdrawDetailsLabel');
    
    function updateNetAmount() {
        const amount = parseFloat(amountInput.value) || 0;
        const netAmount = amount * 0.98; // Минус 2% комиссия
        netAmountSpan.textContent = netAmount.toFixed(2) + ' USD';
    }
    
    function updateDetailsLabel() {
        const method = methodSelect.value;
        let label = '';
        let placeholder = '';
        
        switch(method) {
            case 'cryptobot':
                label = 'Крипто-кошелёк';
                placeholder = 'Введите адрес кошелька (USDT TRC20)';
                break;
            case 'card':
                label = 'Номер карты';
                placeholder = '0000 0000 0000 0000';
                break;
            case 'wallet':
                label = 'Кошелёк';
                placeholder = 'Номер электронного кошелька';
                break;
        }
        
        detailsLabel.textContent = label;
        modal.querySelector('#withdrawDetails').placeholder = placeholder;
    }
    
    amountInput.addEventListener('input', updateNetAmount);
    methodSelect.addEventListener('change', updateDetailsLabel);
    
    // Инициализация
    updateNetAmount();
    updateDetailsLabel();
    
    // Отмена
    modal.querySelector('#cancelWithdraw').addEventListener('click', () => {
        modal.remove();
    });
    
    // Подтверждение вывода
    modal.querySelector('#confirmWithdraw').addEventListener('click', async () => {
        const amount = parseFloat(amountInput.value);
        const method = methodSelect.value;
        const details = modal.querySelector('#withdrawDetails').value;
        
        // Валидация
        if (!amount || amount < 10) {
            showNotification('Минимальная сумма вывода: 10 USD', 'error');
            return;
        }
        
        if (amount > (user.realBalance || 0)) {
            showNotification('Недостаточно средств на балансе', 'error');
            return;
        }
        
        if (!details.trim()) {
            showNotification('Введите реквизиты для вывода', 'error');
            return;
        }
        
        // Для CryptoBot вывода
        if (method === 'cryptobot' && window.CryptoBot) {
            try {
                showNotification('Обрабатываем вывод через CryptoBot...', 'info');
                
                // Здесь будет реальный вызов API CryptoBot для вывода
                // Пока имитируем успешный вывод
                
                setTimeout(() => {
                    // Списываем средства
                    user.realBalance = (user.realBalance || 0) - amount;
                    updateUser(user);
                    
                    // Сохраняем транзакцию
                    saveTransaction({
                        userId: user.id,
                        type: 'withdrawal',
                        amount: amount,
                        method: 'cryptobot',
                        details: details,
                        status: 'pending',
                        timestamp: new Date().toISOString()
                    });
                    
                    modal.remove();
                    showNotification(`✅ Заявка на вывод ${amount} USD отправлена! Средства поступят в течение 24 часов.`, 'success');
                    updateBalanceDisplay();
                }, 1500);
                
            } catch (error) {
                showNotification('Ошибка при выводе через CryptoBot', 'error');
                console.error(error);
            }
        } else {
            // Для других методов
            user.realBalance = (user.realBalance || 0) - amount;
            updateUser(user);
            
            saveTransaction({
                userId: user.id,
                type: 'withdrawal',
                amount: amount,
                method: method,
                details: details,
                status: 'pending',
                timestamp: new Date().toISOString()
            });
            
            modal.remove();
            showNotification(`✅ Заявка на вывод ${amount} USD отправлена!`, 'success');
            updateBalanceDisplay();
        }
    });
    
    // Закрытие по клику на фон
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    // Инициализируем платежную систему
    const paymentSystem = initPaymentSystem();
    console.log('Платежная система инициализирована:', paymentSystem);
    
    // Глобальные функции для доступа из других файлов
    window.showPaymentSelection = showPaymentSelection;
    window.showWithdrawModal = showWithdrawModal;
    window.processSuccessfulPayment = processSuccessfulPayment;
});

// Стили для платежной системы
const paymentStyles = document.createElement('style');
paymentStyles.textContent = `
    .payment-methods-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 16px;
        margin: 24px 0;
    }
    
    .payment-method-card {
        background: var(--bg-secondary);
        border: 2px solid transparent;
        border-radius: var(--border-radius);
        padding: 20px;
        cursor: pointer;
        transition: var(--transition);
        position: relative;
    }
    
    .payment-method-card:hover:not(.disabled) {
        border-color: var(--primary-color);
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
    }
    
    .payment-method-card.disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
    
    .method-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
    }
    
    .method-icon {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        color: white;
    }
    
    .method-icon.cryptobot {
        background: linear-gradient(135deg, #0088cc, #00aced);
    }
    
    .method-icon.card {
        background: linear-gradient(135deg, #ff6b6b, #ff8e53);
    }
    
    .method-icon.test {
        background: linear-gradient(135deg, #4CAF50, #8BC34A);
    }
    
    .method-title {
        font-size: 18px;
        font-weight: 600;
    }
    
    .method-features {
        margin-bottom: 16px;
    }
    
    .feature {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        font-size: 14px;
        color: var(--text-secondary);
    }
    
    .feature i.fa-check {
        color: var(--success-color);
    }
    
    .feature i.fa-times {
        color: var(--danger-color);
    }
    
    .method-currencies {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-bottom: 12px;
    }
    
    .currency-badge {
        padding: 4px 12px;
        background: var(--bg-card);
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        color: var(--text-secondary);
    }
    
    .method-status {
        position: absolute;
        top: 12px;
        right: 12px;
    }
    
    .status-available {
        padding: 4px 8px;
        background: rgba(76, 175, 80, 0.2);
        color: var(--success-color);
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
    }
    
    .status-unavailable {
        padding: 4px 8px;
        background: rgba(244, 67, 54, 0.2);
        color: var(--danger-color);
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
    }
    
    /* CryptoBot платеж */
    .crypto-payment-content {
        margin: 20px 0;
    }
    
    .payment-loading {
        text-align: center;
        padding: 40px 20px;
    }
    
    .loading-spinner {
        font-size: 48px;
        color: var(--primary-color);
        margin-bottom: 20px;
    }
    
    .payment-success {
        text-align: center;
    }
    
    .success-icon {
        font-size: 64px;
        color: var(--success-color);
        margin-bottom: 20px;
    }
    
    .invoice-info {
        background: var(--bg-secondary);
        border-radius: var(--border-radius);
        padding: 20px;
        margin: 20px 0;
        text-align: left;
    }
    
    .info-row {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid var(--border-color);
    }
    
    .info-row:last-child {
        border-bottom: none;
    }
    
    .qr-code {
        margin: 20px 0;
    }
    
    .qr-code img {
        width: 200px;
        height: 200px;
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        padding: 10px;
        background: white;
    }
    
    .payment-actions {
        display: flex;
        gap: 12px;
        justify-content: center;
        margin: 20px 0;
    }
    
    .payment-status {
        margin-top: 20px;
        padding: 20px;
        background: var(--bg-secondary);
        border-radius: var(--border-radius);
    }
    
    .status-waiting, .status-success, .status-timeout {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        text-align: center;
    }
    
    .status-waiting i {
        font-size: 32px;
        color: var(--warning-color);
    }
    
    .status-success i {
        font-size: 32px;
        color: var(--success-color);
    }
    
    .status-timeout i {
        font-size: 32px;
        color: var(--danger-color);
    }
    
    .success-message {
        font-size: 14px;
        color: var(--text-secondary);
    }
    
    .payment-error {
        text-align: center;
        padding: 40px 20px;
    }
    
    .error-icon {
        font-size: 64px;
        color: var(--danger-color);
        margin-bottom: 20px;
    }
    
    /* Карточный платеж */
    .card-payment-content {
        margin: 20px 0;
    }
    
    .card-form {
        margin: 20px 0;
    }
    
    .form-group {
        margin-bottom: 16px;
    }
    
    .form-group label {
        display: block;
        margin-bottom: 8px;
        color: var(--text-secondary);
        font-size: 14px;
    }
    
    .form-group input,
    .form-group select {
        width: 100%;
        padding: 12px;
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius-sm);
        color: var(--text-primary);
        font-size: 16px;
    }
    
    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
    }
    
    .payment-security {
        display: flex;
        align-items: center;
        gap: 8px;
        justify-content: center;
        padding: 16px;
        background: rgba(76, 175, 80, 0.1);
        border-radius: var(--border-radius);
        color: var(--success-color);
        font-size: 14px;
        margin-top: 20px;
    }
    
    /* Вывод средств */
    .withdrawal-content {
        margin: 20px 0;
    }
    
    .balance-info {
        background: var(--bg-secondary);
        border-radius: var(--border-radius);
        padding: 20px;
        margin-bottom: 20px;
    }
    
    .small-text {
        font-size: 12px;
        color: var(--text-secondary);
        margin-top: 8px;
    }
    
    .fee-info {
        background: rgba(255, 152, 0, 0.1);
        border-radius: var(--border-radius);
        padding: 16px;
        margin: 20px 0;
    }
    
    .fee-info p {
        margin: 8px 0;
    }
    
    /* Тестовый платеж */
    .test-payment-content {
        margin: 20px 0;
    }
    
    .test-info {
        background: var(--bg-secondary);
        border-radius: var(--border-radius);
        padding: 20px;
        margin-bottom: 20px;
    }
    
    .test-actions {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
`;
document.head.appendChild(paymentStyles);