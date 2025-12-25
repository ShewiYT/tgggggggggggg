
// main-simple.js - Простая и надежная инициализация

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Приложение запускается...');
    
    // 1. Гарантируем, что главное меню видно
    forceShowMainMenu();
    
    // 2. Инициализируем базовые данные
    initBasicStorage();
    
    // 3. Создаем тестового пользователя если нет
    initTestUser();
    
    // 4. Настраиваем обработчики
    setupEventListeners();
    
    // 5. Обновляем UI
    updateUI();
    
    console.log('✅ Главное меню готово!');
});

// Принудительно показываем главное меню
function forceShowMainMenu() {
    const gameContainer = document.getElementById('game-container');
    const mainMenu = document.querySelector('.main-menu');
    
    if (gameContainer) {
        gameContainer.style.display = 'none';
        gameContainer.innerHTML = '';
    }
    
    if (mainMenu) {
        mainMenu.style.display = 'flex';
    }
    
    // Скрываем все модальные окна
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

// Инициализация базового хранилища
function initBasicStorage() {
    if (!localStorage.getItem('ticTacToeUsers')) {
        localStorage.setItem('ticTacToeUsers', JSON.stringify([]));
        console.log('Создано пустое хранилище пользователей');
    }
    
    if (!localStorage.getItem('ticTacToeGames')) {
        localStorage.setItem('ticTacToeGames', JSON.stringify([]));
    }
    
    if (!localStorage.getItem('ticTacToeTransactions')) {
        localStorage.setItem('ticTacToeTransactions', JSON.stringify([]));
    }
}

// Создание тестового пользователя
function initTestUser() {
    const users = JSON.parse(localStorage.getItem('ticTacToeUsers') || '[]');
    
    if (users.length === 0) {
        // Создаем обычного пользователя
        const testUser = {
            id: 1,
            username: 'Игрок',
            gameBalance: 100,
            realBalance: 0,
            totalGames: 0,
            totalWins: 0,
            isAdmin: false,
            isPartner: false,
            createdAt: new Date().toISOString()
        };
        
        users.push(testUser);
        localStorage.setItem('ticTacToeUsers', JSON.stringify(users));
        localStorage.setItem('currentUserId', '1');
        
        console.log('Создан тестовый пользователь с балансом 100 монет');
    }
    
    // Проверяем Telegram Web App
    if (window.Telegram && Telegram.WebApp) {
        Telegram.WebApp.ready();
        Telegram.WebApp.expand();
        
        const tgUser = Telegram.WebApp.initDataUnsafe?.user;
        if (tgUser) {
            console.log('Обнаружен пользователь Telegram:', tgUser);
            
            // Telegram ID 6283217323 - админ
            if (tgUser.id === 6283217323) {
                createOrUpdateAdminUser(tgUser);
            } else {
                createOrUpdateTelegramUser(tgUser);
            }
        }
    }
}

// Создание/обновление администратора
function createOrUpdateAdminUser(tgUser) {
    const users = JSON.parse(localStorage.getItem('ticTacToeUsers') || '[]');
    const username = tgUser.username || `admin_${tgUser.id}`;
    
    let adminUser = users.find(u => u.username === 'KovalchukAdmin');
    
    if (!adminUser) {
        adminUser = {
            id: 999,
            username: 'KovalchukAdmin',
            gameBalance: 5000,
            realBalance: 10000,
            totalGames: 0,
            totalWins: 0,
            isAdmin: true,
            isPartner: true,
            telegramId: tgUser.id,
            createdAt: new Date().toISOString()
        };
        
        users.push(adminUser);
        localStorage.setItem('ticTacToeUsers', JSON.stringify(users));
        console.log('Создан администратор KovalchukAdmin');
    }
    
    localStorage.setItem('currentUserId', adminUser.id.toString());
    return adminUser;
}

// Создание/обновление пользователя Telegram
function createOrUpdateTelegramUser(tgUser) {
    const users = JSON.parse(localStorage.getItem('ticTacToeUsers') || '[]');
    const username = tgUser.username || `user_${tgUser.id}`;
    const telegramId = tgUser.id;
    
    let user = users.find(u => u.telegramId === telegramId);
    
    if (!user) {
        user = {
            id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 100,
            username: username,
            gameBalance: 100,
            realBalance: 0,
            totalGames: 0,
            totalWins: 0,
            isAdmin: false,
            isPartner: false,
            telegramId: telegramId,
            createdAt: new Date().toISOString()
        };
        
        users.push(user);
        localStorage.setItem('ticTacToeUsers', JSON.stringify(users));
        console.log('Создан новый пользователь Telegram:', username);
    }
    
    localStorage.setItem('currentUserId', user.id.toString());
    return user;
}

// Настройка обработчиков событий
function setupEventListeners() {
    console.log('Настраиваем обработчики событий...');
    
    // Кнопка профиля
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
        profileBtn.addEventListener('click', function() {
            window.location.href = 'profile.html';
        });
    }
    
    // Кнопка админ-панели
    const adminBtn = document.getElementById('adminBtn');
    if (adminBtn) {
        adminBtn.addEventListener('click', function() {
            window.location.href = 'admin.html';
        });
    }
    
    // Кнопка партнёр-панели
    const partnerBtn = document.getElementById('partnerBtn');
    if (partnerBtn) {
        partnerBtn.addEventListener('click', function() {
            window.location.href = 'partner.html';
        });
    }
    
    // Кнопка истории
    const historyBtn = document.getElementById('historyBtn');
    if (historyBtn) {
        historyBtn.addEventListener('click', showHistoryModal);
    }
    
    // Кнопка пополнения
    const depositBtn = document.getElementById('depositBtn');
    if (depositBtn) {
        depositBtn.addEventListener('click', showDepositModal);
    }
    
    // Кнопка вывода
    const withdrawBtn = document.getElementById('withdrawBtn');
    if (withdrawBtn) {
        withdrawBtn.addEventListener('click', showWithdrawModal);
    }
    
    // Кнопка правил
    const rulesBtn = document.getElementById('rulesBtn');
    if (rulesBtn) {
        rulesBtn.addEventListener('click', showRulesModal);
    }
    
    // Карточки игр
    setupGameCards();
    
    // Модальное окно ставок
    setupBetModal();
}

// Настройка карточек игр
function setupGameCards() {
    // Игра с ботом
    const playWithBot = document.getElementById('playWithBot');
    if (playWithBot) {
        playWithBot.addEventListener('click', function() {
            console.log('Выбрана игра с ботом');
            showBetModal('bot', 'Бот');
        });
    }
    
    // Онлайн игра
    const playOnline = document.getElementById('playOnline');
    if (playOnline) {
        playOnline.addEventListener('click', function() {
            console.log('Выбрана онлайн игра');
            showBetModal('online', 'Онлайн соперник');
        });
    }
    
    // Создать лобби
    const createLobby = document.getElementById('createLobby');
    if (createLobby) {
        createLobby.addEventListener('click', function() {
            console.log('Создание лобби');
            showBetModal('private', 'Друг');
        });
    }
    
    // Быстрая игра
    const quickPlay = document.getElementById('quickPlay');
    if (quickPlay) {
        quickPlay.addEventListener('click', function() {
            console.log('Быстрая игра');
            showBetModal('quick', 'Случайный соперник');
        });
    }
}

// Настройка модального окна ставок
function setupBetModal() {
    const cancelBtn = document.getElementById('cancelBet');
    const confirmBtn = document.getElementById('confirmBet');
    const balanceRadios = document.querySelectorAll('input[name="balanceType"]');
    const amountButtons = document.querySelectorAll('.amount-btn');
    const customAmountInput = document.getElementById('customAmount');
    
    let currentBet = {
        amount: 0,
        balanceType: 'game',
        gameMode: null,
        opponent: null
    };
    
    // Отмена
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            document.getElementById('betModal').style.display = 'none';
            currentBet = { amount: 0, balanceType: 'game', gameMode: null, opponent: null };
        });
    }
    
    // Подтверждение
    if (confirmBtn) {
        confirmBtn.addEventListener('click', function() {
            processBet(currentBet);
        });
    }
    
    // Выбор типа баланса
    balanceRadios.forEach(radio => {
        radio.addEventListener('change', function(e) {
            currentBet.balanceType = e.target.value;
            updateCommissionNotice(currentBet.gameMode, currentBet.balanceType);
        });
    });
    
    // Кнопки суммы
    amountButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            amountButtons.forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            currentBet.amount = parseInt(e.target.dataset.amount);
            customAmountInput.value = '';
        });
    });
    
    // Пользовательская сумма
    if (customAmountInput) {
        customAmountInput.addEventListener('input', function(e) {
            amountButtons.forEach(btn => btn.classList.remove('active'));
            currentBet.amount = parseInt(e.target.value) || 0;
        });
    }
    
    // Сохраняем в глобальную переменную
    window.currentBet = currentBet;
}

// Показать модальное окно ставок
function showBetModal(gameMode, opponent) {
    const modal = document.getElementById('betModal');
    if (!modal) return;
    
    window.currentBet.gameMode = gameMode;
    window.currentBet.opponent = opponent;
    
    // Показываем/скрываем уведомление о комиссии
    updateCommissionNotice(gameMode, window.currentBet.balanceType);
    
    modal.style.display = 'flex';
}

// Обновить уведомление о комиссии
function updateCommissionNotice(gameMode, balanceType) {
    const notice = document.getElementById('commissionNotice');
    if (!notice) return;
    
    if (gameMode === 'online' && balanceType === 'real') {
        notice.style.display = 'flex';
    } else {
        notice.style.display = 'none';
    }
}

// Обработка ставки
function processBet(bet) {
    const user = getCurrentUser();
    if (!user) {
        alert('Пожалуйста, войдите в систему');
        return;
    }
    
    // Проверка суммы
    if (bet.amount < 1) {
        alert('Минимальная сумма ставки: 1');
        return;
    }
    
    // Проверка баланса
    if (bet.balanceType === 'game' && user.gameBalance < bet.amount) {
        alert('Недостаточно игровых средств');
        return;
    }
    
    if (bet.balanceType === 'real' && user.realBalance < bet.amount) {
        alert('Недостаточно реальных средств');
        return;
    }
    
    // Списываем ставку
    if (bet.balanceType === 'game') {
        user.gameBalance -= bet.amount;
    } else {
        user.realBalance -= bet.amount;
    }
    
    // Сохраняем пользователя
    const users = JSON.parse(localStorage.getItem('ticTacToeUsers') || '[]');
    const userIndex = users.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
        users[userIndex] = user;
        localStorage.setItem('ticTacToeUsers', JSON.stringify(users));
    }
    
    // Закрываем модальное окно
    document.getElementById('betModal').style.display = 'none';
    
    // Начинаем игру
    startGame(bet);
    
    // Сбрасываем ставку
    window.currentBet = { amount: 0, balanceType: 'game', gameMode: null, opponent: null };
}

// Начать игру
function startGame(bet) {
    console.log('Начинаем игру:', bet);
    
    // Скрываем главное меню
    document.querySelector('.main-menu').style.display = 'none';
    
    // Создаем игровое поле
    const gameContainer = document.getElementById('game-container');
    gameContainer.innerHTML = `
        <div class="game-header">
            <button class="btn-icon" id="backToMenu">
                <i class="fas fa-arrow-left"></i>
            </button>
            <h2>Игра</h2>
            <div class="game-timer">00:00</div>
        </div>
        
        <div class="game-info">
            <div class="player-info">
                <div class="player-avatar">
                    <i class="fas fa-times"></i>
                </div>
                <span class="player-name">Вы (X)</span>
                <span class="player-stake">Ставка: ${bet.amount}</span>
            </div>
            
            <div class="vs">VS</div>
            
            <div class="player-info">
                <div class="player-avatar">
                    <i class="far fa-circle"></i>
                </div>
                <span class="player-name">${bet.opponent} (O)</span>
                <span class="player-stake">Ставка: ${bet.amount}</span>
            </div>
        </div>
        
        <div class="game-board">
            <div class="cell" data-index="0"></div>
            <div class="cell" data-index="1"></div>
            <div class="cell" data-index="2"></div>
            <div class="cell" data-index="3"></div>
            <div class="cell" data-index="4"></div>
            <div class="cell" data-index="5"></div>
            <div class="cell" data-index="6"></div>
            <div class="cell" data-index="7"></div>
            <div class="cell" data-index="8"></div>
        </div>
        
        <div class="game-status">
            <div class="current-player">
                Сейчас ходит: <span id="currentPlayer">X</span>
            </div>
            <div class="game-result"></div>
        </div>
        
        <div class="game-actions">
            <button class="btn-secondary" id="restartGame">
                <i class="fas fa-redo"></i> Новая игра
            </button>
            <button class="btn-primary" id="continueGame" style="display: none;">
                <i class="fas fa-play"></i> Продолжить
            </button>
        </div>
    `;
    
    // Показываем игровое поле
    gameContainer.style.display = 'block';
    
    // Кнопка возврата в меню
    document.getElementById('backToMenu').addEventListener('click', function() {
        gameContainer.style.display = 'none';
        document.querySelector('.main-menu').style.display = 'flex';
        updateUI();
    });
    
    // Инициализируем игру
    initSimpleGame(bet);
}

// Простая игра
function initSimpleGame(bet) {
    const cells = document.querySelectorAll('.cell');
    let currentPlayer = 'X';
    let gameActive = true;
    let board = ['', '', '', '', '', '', '', '', ''];
    
    // Обработчики для клеток
    cells.forEach(cell => {
        cell.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            
            if (!gameActive || board[index] !== '') return;
            
            // Ход игрока
            board[index] = currentPlayer;
            this.textContent = currentPlayer;
            this.classList.add(currentPlayer.toLowerCase());
            
            // Проверяем победителя
            if (checkWinner(board, currentPlayer)) {
                gameActive = false;
                showGameResult('win', bet);
                return;
            }
            
            // Проверяем ничью
            if (!board.includes('')) {
                gameActive = false;
                showGameResult('draw', bet);
                return;
            }
            
            // Меняем игрока
            currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
            document.getElementById('currentPlayer').textContent = currentPlayer;
            
            // Если игра с ботом и сейчас ход бота
            if (bet.gameMode === 'bot' && currentPlayer === 'O' && gameActive) {
                setTimeout(makeBotMove, 500);
            }
        });
    });
    
    // Если игра с ботом и бот ходит первым
    if (bet.gameMode === 'bot' && Math.random() > 0.5) {
        currentPlayer = 'O';
        document.getElementById('currentPlayer').textContent = currentPlayer;
        setTimeout(makeBotMove, 1000);
    }
    
    // Ход бота
    function makeBotMove() {
        if (!gameActive) return;
        
        // Находим пустые клетки
        const emptyCells = [];
        cells.forEach((cell, index) => {
            if (board[index] === '') {
                emptyCells.push(index);
            }
        });
        
        if (emptyCells.length === 0) return;
        
        // Случайный ход
        const randomIndex = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        
        board[randomIndex] = 'O';
        cells[randomIndex].textContent = 'O';
        cells[randomIndex].classList.add('o');
        
        // Проверяем победителя
        if (checkWinner(board, 'O')) {
            gameActive = false;
            showGameResult('lose', bet);
            return;
        }
        
        // Проверяем ничью
        if (!board.includes('')) {
            gameActive = false;
            showGameResult('draw', bet);
            return;
        }
        
        // Возвращаем ход игроку
        currentPlayer = 'X';
        document.getElementById('currentPlayer').textContent = currentPlayer;
    }
    
    // Проверка победителя
    function checkWinner(board, player) {
        const winningCombinations = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Горизонтали
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Вертикали
            [0, 4, 8], [2, 4, 6] // Диагонали
        ];
        
        return winningCombinations.some(combination => {
            return combination.every(index => board[index] === player);
        });
    }
}

// Показать результат игры
function showGameResult(result, bet) {
    const resultElement = document.querySelector('.game-result');
    const continueBtn = document.getElementById('continueGame');
    
    if (result === 'win') {
        resultElement.innerHTML = `
            <div class="result-win">
                <i class="fas fa-trophy"></i>
                <span>Вы выиграли!</span>
            </div>
        `;
        
        // Начисляем выигрыш
        processWin(bet);
        
    } else if (result === 'lose') {
        resultElement.innerHTML = `
            <div class="result-lose">
                <i class="fas fa-times-circle"></i>
                <span>Вы проиграли</span>
            </div>
        `;
    } else {
        resultElement.innerHTML = `
            <div class="result-draw">
                <i class="fas fa-handshake"></i>
                <span>Ничья!</span>
            </div>
        `;
        
        // Возвращаем ставку при ничье
        processDraw(bet);
    }
    
    if (continueBtn) {
        continueBtn.style.display = 'block';
        continueBtn.addEventListener('click', function() {
            document.getElementById('game-container').style.display = 'none';
            document.querySelector('.main-menu').style.display = 'flex';
            updateUI();
        });
    }
}

// Обработка выигрыша
function processWin(bet) {
    const user = getCurrentUser();
    if (!user) return;
    
    let winnings = bet.amount * 2;
    let commission = 0;
    
    // Комиссия 5% только для онлайн игр на реальный баланс
    if (bet.gameMode === 'online' && bet.balanceType === 'real') {
        commission = winnings * 0.05;
        winnings = winnings - commission;
        
        // Сохраняем комиссию
        saveCommission(commission, bet);
        
        // Показываем уведомление
        showNotification(`Комиссия бота: ${commission.toFixed(2)}`, 'info');
    }
    
    // Начисляем выигрыш
    if (bet.balanceType === 'game') {
        user.gameBalance += winnings;
    } else {
        user.realBalance += winnings;
    }
    
    // Сохраняем
    const users = JSON.parse(localStorage.getItem('ticTacToeUsers') || '[]');
    const userIndex = users.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
        users[userIndex] = user;
        localStorage.setItem('ticTacToeUsers', JSON.stringify(users));
    }
    
    // Сохраняем игру
    saveGame({
        userId: user.id,
        mode: bet.gameMode,
        opponent: bet.opponent,
        stake: bet.amount,
        balanceType: bet.balanceType,
        result: 'win',
        winnings: winnings,
        commission: commission,
        timestamp: new Date().toISOString()
    });
    
    // Показываем уведомление
    showNotification(`🎉 Вы выиграли ${winnings} ${bet.balanceType === 'game' ? 'монет' : 'USD'}!`, 'success');
}

// Обработка ничьи
function processDraw(bet) {
    const user = getCurrentUser();
    if (!user) return;
    
    // Возвращаем ставку
    if (bet.balanceType === 'game') {
        user.gameBalance += bet.amount;
    } else {
        user.realBalance += bet.amount;
    }
    
    // Сохраняем
    const users = JSON.parse(localStorage.getItem('ticTacToeUsers') || '[]');
    const userIndex = users.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
        users[userIndex] = user;
        localStorage.setItem('ticTacToeUsers', JSON.stringify(users));
    }
    
    // Сохраняем игру
    saveGame({
        userId: user.id,
        mode: bet.gameMode,
        opponent: bet.opponent,
        stake: bet.amount,
        balanceType: bet.balanceType,
        result: 'draw',
        timestamp: new Date().toISOString()
    });
}

// Сохранить игру
function saveGame(gameData) {
    const games = JSON.parse(localStorage.getItem('ticTacToeGames') || '[]');
    gameData.id = Date.now();
    games.push(gameData);
    localStorage.setItem('ticTacToeGames', JSON.stringify(games));
}

// Сохранить комиссию
function saveCommission(amount, bet) {
    const commissions = JSON.parse(localStorage.getItem('botCommissions') || '[]');
    commissions.push({
        amount: amount,
        userId: getCurrentUser().id,
        gameMode: bet.gameMode,
        stake: bet.amount,
        timestamp: new Date().toISOString()
    });
    localStorage.setItem('botCommissions', JSON.stringify(commissions));
}

// Обновление UI
function updateUI() {
    const user = getCurrentUser();
    if (!user) return;
    
    // Имя пользователя
    const usernameElement = document.getElementById('username');
    if (usernameElement) {
        usernameElement.textContent = user.username || 'Игрок';
    }
    
    // Балансы
    updateBalanceDisplay();
    
    // Роли
    const adminBtn = document.getElementById('adminBtn');
    const partnerBtn = document.getElementById('partnerBtn');
    
    if (adminBtn) {
        adminBtn.style.display = user.isAdmin ? 'block' : 'none';
    }
    
    if (partnerBtn) {
        partnerBtn.style.display = user.isPartner ? 'block' : 'none';
    }
    
    // Аватар Telegram
    if (window.Telegram && Telegram.WebApp) {
        const tgUser = Telegram.WebApp.initDataUnsafe?.user;
        if (tgUser && tgUser.photo_url) {
            const avatar = document.getElementById('userAvatar');
            if (avatar) {
                avatar.innerHTML = `<img src="${tgUser.photo_url}" alt="Аватар">`;
            }
        }
    }
}

// Модальные окна
function showHistoryModal() {
    alert('История игр - для полной функциональности откройте профиль');
}

function showDepositModal() {
    alert('Пополнение баланса - используйте CryptoBot для реальных платежей');
}

function showWithdrawModal() {
    alert('Вывод средств - доступен в партнёрской панели');
}

function showRulesModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Правила игры</h2>
            <div style="max-height: 400px; overflow-y: auto; padding: 10px;">
                <h3>🎮 Как играть</h3>
                <p>Игроки по очереди ставят крестики (X) и нолики (O).</p>
                <p>Цель - занять 3 клетки подряд.</p>
                
                <h3>💰 Ставки</h3>
                <p>• Игровой баланс - для тренировки</p>
                <p>• Реальный баланс - с настоящими деньгами</p>
                <p>• При выигрыше: ставка × 2</p>
                <p>• При ничье: возврат ставки</p>
                
                <h3>⚡ Комиссия 5%</h3>
                <p>Взимается только при:</p>
                <p>• Игре на реальном балансе</p>
                <p>• Победе в онлайн-игре</p>
                <p>• Размер: 5% от выигрыша</p>
            </div>
            <div class="modal-actions">
                <button class="btn-primary" id="closeRules">Понятно</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    
    modal.querySelector('#closeRules').addEventListener('click', function() {
        modal.remove();
    });
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Уведомления
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.display = 'flex';
    }, 10);
    
    setTimeout(() => {
        notification.style.display = 'none';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Экспортируем ключевые функции
window.getCurrentUser = getCurrentUser;
window.updateUI = updateUI;
window.showMainMenu = function() {
    document.getElementById('game-container').style.display = 'none';
    document.querySelector('.main-menu').style.display = 'flex';
    updateUI();
};
