// Система ставок и управления балансами

let currentBet = {
    amount: 0,
    balanceType: 'game',
    gameMode: null,
    opponent: null
};

// Инициализация системы ставок
function initBetSystem() {
    // Обработчики для модального окна ставок
    const betModal = document.getElementById('betModal');
    const cancelBtn = document.getElementById('cancelBet');
    const confirmBtn = document.getElementById('confirmBet');
    const balanceRadios = document.querySelectorAll('input[name="balanceType"]');
    const amountButtons = document.querySelectorAll('.amount-btn');
    const customAmountInput = document.getElementById('customAmount');
    
    if (!betModal) return;
    
    // Обработчик отмены
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            betModal.style.display = 'none';
            currentBet = { amount: 0, balanceType: 'game', gameMode: null, opponent: null };
        });
    }
    
    // Обработчик подтверждения
    if (confirmBtn) {
        confirmBtn.addEventListener('click', confirmBet);
    }
    
    // Обработчики выбора типа баланса
    balanceRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            currentBet.balanceType = e.target.value;
            updateCommissionNotice();
        });
    });
    
    // Обработчики кнопок суммы
    amountButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            // Убираем активный класс у всех кнопок
            amountButtons.forEach(btn => btn.classList.remove('active'));
            
            // Добавляем активный класс нажатой кнопке
            e.target.classList.add('active');
            
            // Устанавливаем сумму
            currentBet.amount = parseInt(e.target.dataset.amount);
            customAmountInput.value = '';
            
            updateCommissionNotice();
        });
    });
    
    // Обработчик пользовательской суммы
    if (customAmountInput) {
        customAmountInput.addEventListener('input', (e) => {
            // Убираем активный класс у всех кнопок
            amountButtons.forEach(btn => btn.classList.remove('active'));
            
            // Устанавливаем пользовательскую сумму
            const value = parseInt(e.target.value) || 0;
            currentBet.amount = value;
            
            updateCommissionNotice();
        });
    }
}

// Обновить уведомление о комиссии
function updateCommissionNotice() {
    const notice = document.getElementById('commissionNotice');
    if (!notice) return;
    
    // Показываем уведомление только для онлайн игр с реальным балансом
    if (currentBet.gameMode === 'online' && currentBet.balanceType === 'real') {
        notice.style.display = 'flex';
    } else {
        notice.style.display = 'none';
    }
}

// Подтверждение ставки
function confirmBet() {
    const user = getCurrentUser();
    if (!user) {
        showNotification('Пожалуйста, войдите в систему', 'error');
        return;
    }
    
    // Проверка минимальной суммы
    if (currentBet.amount < 1) {
        showNotification('Минимальная сумма ставки: 1', 'error');
        return;
    }
    
    // Проверка баланса
    if (currentBet.balanceType === 'game' && user.gameBalance < currentBet.amount) {
        showNotification('Недостаточно игровых средств', 'error');
        return;
    }
    
    if (currentBet.balanceType === 'real' && user.realBalance < currentBet.amount) {
        showNotification('Недостаточно реальных средств', 'error');
        return;
    }
    
    // Создаем запись о ставке
    const betRecord = {
        id: Date.now(),
        userId: user.id,
        amount: currentBet.amount,
        balanceType: currentBet.balanceType,
        gameMode: currentBet.gameMode,
        timestamp: new Date().toISOString(),
        status: 'pending'
    };
    
    // Сохраняем ставку
    saveBet(betRecord);
    
    // Закрываем модальное окно
    document.getElementById('betModal').style.display = 'none';
    
    // Начинаем игру
    if (window.gameModule && window.gameModule.startGame) {
        let opponent = 'Игрок';
        if (currentBet.gameMode === 'bot') {
            opponent = 'Бот';
        } else if (currentBet.gameMode === 'online') {
            opponent = 'Онлайн соперник';
        }
        
        window.gameModule.startGame(
            currentBet.gameMode,
            opponent,
            currentBet.amount,
            currentBet.balanceType
        );
    }
    
    // Сбрасываем текущую ставку
    currentBet = { amount: 0, balanceType: 'game', gameMode: null, opponent: null };
}

// Сохранить ставку
function saveBet(betRecord) {
    const bets = getBets();
    bets.push(betRecord);
    localStorage.setItem('userBets', JSON.stringify(bets));
}

// Получить все ставки пользователя
function getBets() {
    return JSON.parse(localStorage.getItem('userBets')) || [];
}

// Получить историю ставок пользователя
function getUserBetHistory(userId) {
    const bets = getBets();
    const userBets = bets.filter(bet => bet.userId === userId);
    
    // Обогащаем данные информацией о комиссии
    return userBets.map(bet => {
        const game = findGameByBet(bet);
        if (game && game.commission) {
            bet.commission = game.commission;
            bet.netWinnings = game.netWinnings;
        }
        return bet;
    });
}

// Найти игру по ставке
function findGameByBet(bet) {
    const games = getGames();
    return games.find(game => 
        game.userId === bet.userId && 
        Math.abs(game.timestamp - bet.timestamp) < 60000 // В пределах минуты
    );
}

// Проверить доступный баланс для ставки
function getAvailableBalance(balanceType) {
    const user = getCurrentUser();
    if (!user) return 0;
    
    if (balanceType === 'game') {
        return user.gameBalance;
    } else {
        return user.realBalance;
    }
}

// Обновить отображение балансов
function updateBalanceDisplay() {
    const user = getCurrentUser();
    if (!user) return;
    
    const realBalanceEl = document.getElementById('realBalance');
    const gameBalanceEl = document.getElementById('gameBalance');
    
    if (realBalanceEl) {
        realBalanceEl.textContent = user.realBalance.toFixed(2);
    }
    
    if (gameBalanceEl) {
        gameBalanceEl.textContent = user.gameBalance;
    }
}

// Показать уведомление
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Анимация появления
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Автоматическое скрытие
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Установить параметры игры для ставки
function setGameModeForBet(mode, opponent) {
    currentBet.gameMode = mode;
    currentBet.opponent = opponent;
    
    // Показываем модальное окно ставок
    const betModal = document.getElementById('betModal');
    if (betModal) {
        betModal.style.display = 'flex';
        updateCommissionNotice();
    }
}

// Экспортируем функции
window.betsModule = {
    initBetSystem,
    setGameModeForBet,
    getUserBetHistory,
    getAvailableBalance,
    updateBalanceDisplay
};

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', initBetSystem);