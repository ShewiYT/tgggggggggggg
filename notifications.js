// Система уведомлений и модальных окон

// Типы уведомлений
const NOTIFICATION_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
};

// Создать уведомление
function createNotification(message, type = NOTIFICATION_TYPES.INFO, duration = 3000) {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    // Иконка в зависимости от типа
    let icon = 'info-circle';
    switch(type) {
        case NOTIFICATION_TYPES.SUCCESS:
            icon = 'check-circle';
            break;
        case NOTIFICATION_TYPES.ERROR:
            icon = 'exclamation-circle';
            break;
        case NOTIFICATION_TYPES.WARNING:
            icon = 'exclamation-triangle';
            break;
    }
    
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Добавляем стили, если их нет
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: var(--bg-card);
                border-left: 4px solid;
                border-radius: var(--border-radius);
                padding: 16px;
                min-width: 300px;
                max-width: 400px;
                box-shadow: var(--shadow-lg);
                z-index: 10000;
                transform: translateX(400px);
                transition: transform 0.3s ease;
            }
            
            .notification.show {
                transform: translateX(0);
            }
            
            .notification-success {
                border-left-color: var(--success-color);
            }
            
            .notification-error {
                border-left-color: var(--danger-color);
            }
            
            .notification-warning {
                border-left-color: var(--warning-color);
            }
            
            .notification-info {
                border-left-color: var(--info-color);
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .notification-content i {
                font-size: 20px;
            }
            
            .notification-success .notification-content i {
                color: var(--success-color);
            }
            
            .notification-error .notification-content i {
                color: var(--danger-color);
            }
            
            .notification-warning .notification-content i {
                color: var(--warning-color);
            }
            
            .notification-info .notification-content i {
                color: var(--info-color);
            }
            
            .notification-close {
                margin-left: auto;
                background: none;
                border: none;
                color: var(--text-secondary);
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                transition: var(--transition);
            }
            
            .notification-close:hover {
                color: var(--text-primary);
                background: rgba(255, 255, 255, 0.1);
            }
        `;
        document.head.appendChild(styles);
    }
    
    // Добавляем в DOM
    document.body.appendChild(notification);
    
    // Показываем с анимацией
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Обработчик закрытия
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        closeNotification(notification);
    });
    
    // Автоматическое закрытие
    if (duration > 0) {
        setTimeout(() => {
            closeNotification(notification);
        }, duration);
    }
    
    return notification;
}

// Закрыть уведомление
function closeNotification(notification) {
    notification.classList.remove('show');
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

// Модальные окна
function createModal(options) {
    const {
        title,
        content,
        type = 'info',
        showClose = true,
        buttons = [],
        onClose = null
    } = options;
    
    // Создаем фон
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    
    // Создаем модальное окно
    const modal = document.createElement('div');
    modal.className = `modal modal-${type}`;
    
    // Заголовок
    let header = '';
    if (title) {
        header = `
            <div class="modal-header">
                <h2>${title}</h2>
                ${showClose ? '<button class="modal-close"><i class="fas fa-times"></i></button>' : ''}
            </div>
        `;
    }
    
    // Контент
    const body = typeof content === 'string' ? content : content.outerHTML;
    
    // Кнопки
    let footer = '';
    if (buttons.length > 0) {
        footer = `
            <div class="modal-footer">
                ${buttons.map(btn => `
                    <button class="${btn.class || 'btn-primary'}" 
                            data-action="${btn.action || 'close'}">
                        ${btn.text}
                    </button>
                `).join('')}
            </div>
        `;
    }
    
    modal.innerHTML = `
        <div class="modal-dialog">
            ${header}
            <div class="modal-body">${body}</div>
            ${footer}
        </div>
    `;
    
    // Стили для модальных окон
    if (!document.querySelector('#modal-styles')) {
        const styles = document.createElement('style');
        styles.id = 'modal-styles';
        styles.textContent = `
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                animation: fadeIn 0.3s ease;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            .modal-dialog {
                background: var(--bg-card);
                border-radius: var(--border-radius);
                max-width: 500px;
                width: 100%;
                max-height: 90vh;
                overflow-y: auto;
                animation: slideIn 0.3s ease;
            }
            
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                border-bottom: 1px solid var(--border-color);
            }
            
            .modal-header h2 {
                margin: 0;
                font-size: 20px;
            }
            
            .modal-close {
                background: none;
                border: none;
                color: var(--text-secondary);
                cursor: pointer;
                font-size: 20px;
                padding: 4px;
                border-radius: 4px;
                transition: var(--transition);
            }
            
            .modal-close:hover {
                color: var(--text-primary);
                background: rgba(255, 255, 255, 0.1);
            }
            
            .modal-body {
                padding: 20px;
            }
            
            .modal-footer {
                display: flex;
                gap: 12px;
                padding: 20px;
                border-top: 1px solid var(--border-color);
                justify-content: flex-end;
            }
            
            .modal-success {
                border-top: 4px solid var(--success-color);
            }
            
            .modal-error {
                border-top: 4px solid var(--danger-color);
            }
            
            .modal-warning {
                border-top: 4px solid var(--warning-color);
            }
            
            .modal-info {
                border-top: 4px solid var(--info-color);
            }
        `;
        document.head.appendChild(styles);
    }
    
    // Добавляем в DOM
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Обработчики событий
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            closeModal(overlay);
            if (onClose) onClose();
        });
    }
    
    // Обработчики кнопок
    modal.querySelectorAll('[data-action]').forEach(button => {
        button.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action === 'close') {
                closeModal(overlay);
                if (onClose) onClose();
            }
        });
    });
    
    // Закрытие по клику на фон
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeModal(overlay);
            if (onClose) onClose();
        }
    });
    
    return { overlay, modal };
}

// Закрыть модальное окно
function closeModal(overlay) {
    overlay.style.opacity = '0';
    setTimeout(() => {
        if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
    }, 300);
}

// Специализированные модальные окна

// Модальное окно выигрыша с комиссией
function showWinModal(winnings, commission = 0, balanceType = 'game') {
    const currency = balanceType === 'game' ? 'игр.' : 'USD';
    
    const content = `
        <div style="text-align: center; padding: 20px 0;">
            <div style="font-size: 72px; color: var(--success-color); margin-bottom: 20px;">
                <i class="fas fa-trophy"></i>
            </div>
            <h3 style="margin-bottom: 16px;">Поздравляем с победой!</h3>
            <div style="font-size: 32px; color: var(--success-color); margin-bottom: 20px;">
                +${winnings} ${currency}
            </div>
            
            ${commission > 0 ? `
                <div style="background: rgba(255, 107, 53, 0.1); padding: 16px; border-radius: var(--border-radius); margin-bottom: 20px;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                        <i class="fas fa-percentage" style="color: var(--warning-color);"></i>
                        <span>Бот удержал 5% комиссии:</span>
                    </div>
                    <div style="font-size: 20px; color: var(--warning-color);">
                        ${commission} ${currency}
                    </div>
                    <div style="font-size: 14px; color: var(--text-secondary); margin-top: 8px;">
                        На ваш баланс зачислено: <strong>${winnings} ${currency}</strong>
                    </div>
                </div>
            ` : ''}
            
            <div style="font-size: 14px; color: var(--text-secondary); margin-top: 20px;">
                <i class="fas fa-info-circle"></i>
                ${commission > 0 
                    ? 'Комиссия взимается только за онлайн-игры на реальный баланс' 
                    : 'Игра без комиссии'}
            </div>
        </div>
    `;
    
    createModal({
        title: 'Результат игры',
        content: content,
        type: 'success',
        buttons: [{
            text: 'Продолжить',
            class: 'btn-primary',
            action: 'close'
        }]
    });
}

// Модальное окно проигрыша
function showLossModal(lostAmount, balanceType = 'game') {
    const currency = balanceType === 'game' ? 'игр.' : 'USD';
    
    createModal({
        title: 'Результат игры',
        content: `
            <div style="text-align: center; padding: 20px 0;">
                <div style="font-size: 72px; color: var(--danger-color); margin-bottom: 20px;">
                    <i class="fas fa-times-circle"></i>
                </div>
                <h3 style="margin-bottom: 16px;">К сожалению, вы проиграли</h3>
                <div style="font-size: 32px; color: var(--danger-color); margin-bottom: 20px;">
                    -${lostAmount} ${currency}
                </div>
                <div style="font-size: 14px; color: var(--text-secondary);">
                    <i class="fas fa-lightbulb"></i>
                    Попробуйте сыграть с ботом для тренировки
                </div>
            </div>
        `,
        type: 'error',
        buttons: [{
            text: 'Новая игра',
            class: 'btn-primary',
            action: 'close'
        }]
    });
}

// Модальное окно пополнения баланса
function showDepositModal() {
    createModal({
        title: 'Пополнение баланса',
        content: `
            <div style="padding: 20px 0;">
                <div class="deposit-methods">
                    <h4 style="margin-bottom: 16px;">Выберите способ пополнения:</h4>
                    
                    <div class="method-option" style="padding: 16px; background: var(--bg-secondary); border-radius: var(--border-radius); margin-bottom: 12px; cursor: pointer;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="font-size: 24px; color: var(--success-color);">
                                <i class="fab fa-bitcoin"></i>
                            </div>
                            <div>
                                <div style="font-weight: 600;">Криптовалюта</div>
                                <div style="font-size: 14px; color: var(--text-secondary);">BTC, ETH, USDT</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="method-option" style="padding: 16px; background: var(--bg-secondary); border-radius: var(--border-radius); margin-bottom: 12px; cursor: pointer;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="font-size: 24px; color: var(--info-color);">
                                <i class="fas fa-credit-card"></i>
                            </div>
                            <div>
                                <div style="font-weight: 600;">Банковская карта</div>
                                <div style="font-size: 14px; color: var(--text-secondary);">Visa, Mastercard</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="method-option" style="padding: 16px; background: var(--bg-secondary); border-radius: var(--border-radius); cursor: pointer;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="font-size: 24px; color: var(--warning-color);">
                                <i class="fas fa-wallet"></i>
                            </div>
                            <div>
                                <div style="font-weight: 600;">Электронный кошелёк</div>
                                <div style="font-size: 14px; color: var(--text-secondary);">WebMoney, Qiwi, YooMoney</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div style="margin-top: 24px;">
                    <h4 style="margin-bottom: 12px;">Сумма пополнения:</h4>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
                        <button class="amount-btn" data-amount="10">10 USD</button>
                        <button class="amount-btn" data-amount="50">50 USD</button>
                        <button class="amount-btn" data-amount="100">100 USD</button>
                        <button class="amount-btn" data-amount="500">500 USD</button>
                        <button class="amount-btn" data-amount="1000">1000 USD</button>
                        <input type="number" placeholder="Другая сумма" style="grid-column: span 3; padding: 12px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--border-radius); color: var(--text-primary);">
                    </div>
                </div>
            </div>
        `,
        buttons: [{
            text: 'Отмена',
            class: 'btn-secondary',
            action: 'close'
        }, {
            text: 'Пополнить',
            class: 'btn-primary',
            action: 'deposit'
        }]
    });
}

// Экспортируем функции
window.notificationsModule = {
    createNotification,
    createModal,
    showWinModal,
    showLossModal,
    showDepositModal,
    NOTIFICATION_TYPES
};

// Создаем глобальные функции для удобства
window.showNotification = createNotification;
window.showModal = createModal;