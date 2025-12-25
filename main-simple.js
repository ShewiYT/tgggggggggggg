// main-simple.js - Исправленная версия с полной интеграцией Telegram

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Инициализация приложения...');
    
    // 1. Инициализация хранилища
    initStorage();
    
    // 2. Инициализация пользователя (ОБЯЗАТЕЛЬНО через Telegram)
    await initTelegramUser();
    
    // 3. Гарантируем показ главного меню
    forceShowMainMenu();
    
    // 4. Настройка обработчиков
    setupEventListeners();
    
    // 5. Обновление UI
    updateUI();
    
    // 6. Показ приветствия
    showWelcomeMessage();
    
    console.log('✅ Приложение готово!');
});

// Инициализация хранилища
function initStorage() {
    // Базовая инициализация
    if (!localStorage.getItem('ticTacToeUsers')) {
        localStorage.setItem('ticTacToeUsers', JSON.stringify([]));
    }
    if (!localStorage.getItem('ticTacToeGames')) {
        localStorage.setItem('ticTacToeGames', JSON.stringify([]));
    }
    if (!localStorage.getItem('ticTacToeTransactions')) {
        localStorage.setItem('ticTacToeTransactions', JSON.stringify([]));
    }
    if (!localStorage.getItem('botCommissions')) {
        localStorage.setItem('botCommissions', JSON.stringify([]));
    }
    
    console.log('Хранилище инициализировано');
}

// Инициализация пользователя Telegram
async function initTelegramUser() {
    console.log('🔐 Инициализация пользователя Telegram...');
    
    // Проверяем наличие Telegram Web App
    if (window.Telegram && Telegram.WebApp) {
        try {
            Telegram.WebApp.ready();
            Telegram.WebApp.expand();
            
            const tgUser = Telegram.WebApp.initDataUnsafe?.user;
            
            if (tgUser && tgUser.id) {
                console.log('Пользователь Telegram найден:', tgUser);
                
                // Парсим данные из Telegram
                const user = await parseTelegramUser(tgUser);
                setCurrentUser(user);
                
                // Обновляем аватар и имя в реальном времени
                updateTelegramUserInfo(tgUser);
                
                return user;
            } else {
                console.warn('Данные пользователя Telegram не найдены');
                createFallbackUser();
            }
        } catch (error) {
            console.error('Ошибка Telegram Web App:', error);
            createFallbackUser();
        }
    } else {
        console.warn('Telegram Web App не обнаружен. Локальный режим.');
        createFallbackUser();
    }
}

// Парсинг данных пользователя из Telegram
async function parseTelegramUser(tgUser) {
    const users = JSON.parse(localStorage.getItem('ticTacToeUsers') || '[]');
    const telegramId = tgUser.id;
    
    // Ищем существующего пользователя
    let user = users.find(u => u.telegramId === telegramId);
    
    if (!user) {
        // Создаем нового пользователя
        user = {
            id: Date.now(),
            telegramId: telegramId,
            username: generateUsername(tgUser),
            firstName: tgUser.first_name || '',
            lastName: tgUser.last_name || '',
            languageCode: tgUser.language_code || 'ru',
            isPremium: tgUser.is_premium || false,
            gameBalance: 100, // Стартовый баланс
            realBalance: 0,
            totalGames: 0,
            totalWins: 0,
            isAdmin: telegramId === 6283217323, // Специальный Telegram ID для админа
            isPartner: false,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        };
        
        // Если есть фото, сохраняем ссылку
        if (tgUser.photo_url) {
            user.photoUrl = tgUser.photo_url;
        }
        
        users.push(user);
        localStorage.setItem('ticTacToeUsers', JSON.stringify(users));
        
        console.log('Создан новый пользователь:', user.username);
    } else {
        // Обновляем последний логин
        user.lastLogin = new Date().toISOString();
        
        // Обновляем данные если изменились
        if (tgUser.photo_url && !user.photoUrl) {
            user.photoUrl = tgUser.photo_url;
        }
        
        // Сохраняем обновления
        const index = users.findIndex(u => u.id === user.id);
        if (index !== -1) {
            users[index] = user;
            localStorage.setItem('ticTacToeUsers', JSON.stringify(users));
        }
    }
    
    // Устанавливаем как текущего пользователя
    localStorage.setItem('currentUserId', user.id.toString());
    
    return user;
}

// Генерация имени пользователя из данных Telegram
function generateUsername(tgUser) {
    if (tgUser.username) {
        return tgUser.username;
    }
    
    if (tgUser.first_name && tgUser.last_name) {
        return `${tgUser.first_name}_${tgUser.last_name}`.substring(0, 20);
    }
    
    if (tgUser.first_name) {
        return tgUser.first_name.substring(0, 20);
    }
    
    return `Player_${tgUser.id.toString().slice(-6)}`;
}

// Создание резервного пользователя (если нет Telegram)
function createFallbackUser() {
    const users = JSON.parse(localStorage.getItem('ticTacToeUsers') || '[]');
    
    // Проверяем есть ли уже пользователи
    if (users.length === 0) {
        const fallbackUser = {
            id: 1,
            username: 'Игрок',
            gameBalance: 100,
            realBalance: 0,
            totalGames: 0,
            totalWins: 0,
            isAdmin: false,
            isPartner: false,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        };
        
        users.push(fallbackUser);
        localStorage.setItem('ticTacToeUsers', JSON.stringify(users));
        localStorage.setItem('currentUserId', '1');
        
        console.log('Создан резервный пользователь');
        return fallbackUser;
    }
    
    return users[0];
}

// Обновление информации пользователя Telegram в UI
function updateTelegramUserInfo(tgUser) {
    const usernameElement = document.getElementById('username');
    const avatarElement = document.getElementById('userAvatar');
    
    if (usernameElement) {
        usernameElement.textContent = tgUser.first_name || tgUser.username || 'Игрок';
    }
    
    if (avatarElement && tgUser.photo_url) {
        // Создаем изображение для предзагрузки
        const img = new Image();
        img.onload = function() {
            avatarElement.innerHTML = '';
            avatarElement.appendChild(img);
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.borderRadius = '50%';
            img.style.objectFit = 'cover';
        };
        img.onerror = function() {
            // Если фото не загрузилось, показываем иконку
            avatarElement.innerHTML = '<i class="fas fa-user"></i>';
        };
        img.src = tgUser.photo_url;
    }
}

// Принудительный показ главного меню
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

// Получение текущего пользователя
function getCurrentUser() {
    const userId = localStorage.getItem('currentUserId');
    if (!userId) return null;
    
    const users = JSON.parse(localStorage.getItem('ticTacToeUsers') || '[]');
    return users.find(u => u.id.toString() === userId);
}

// Установка текущего пользователя
function setCurrentUser(user) {
    if (user && user.id) {
        localStorage.setItem('currentUserId', user.id.toString());
        return true;
    }
    return false;
}

// Обновление UI
function updateUI() {
    const user = getCurrentUser();
    if (!user) return;
    
    // Имя пользователя
    const usernameElement = document.getElementById('username');
    if (usernameElement && !usernameElement.textContent) {
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
    
    // Аватар
    const avatarElement = document.getElementById('userAvatar');
    if (avatarElement && user.photoUrl && !avatarElement.querySelector('img')) {
        const img = document.createElement('img');
        img.src = user.photoUrl;
        img.alt = 'Аватар';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.borderRadius = '50%';
        img.style.objectFit = 'cover';
        avatarElement.innerHTML = '';
        avatarElement.appendChild(img);
    }
}

// Обновление отображения баланса
function updateBalanceDisplay() {
    const user = getCurrentUser();
    if (!user) return;
    
    const realBalanceEl = document.getElementById('realBalance');
    const gameBalanceEl = document.getElementById('gameBalance');
    
    if (realBalanceEl) {
        realBalanceEl.textContent = (user.realBalance || 0).toFixed(2);
    }
    
    if (gameBalanceEl) {
        gameBalanceEl.textContent = (user.gameBalance || 0).toFixed(0);
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    console.log('Настройка обработчиков событий...');
    
    // Навигация
    document.getElementById('profileBtn')?.addEventListener('click', () => {
        window.location.href = 'profile.html';
    });
    
    document.getElementById('adminBtn')?.addEventListener('click', () => {
        window.location.href = 'admin.html';
    });
    
    document.getElementById('partnerBtn')?.addEventListener('click', () => {
        window.location.href = 'partner.html';
    });
    
    document.getElementById('historyBtn')?.addEventListener('click', showHistoryModal);
    document.getElementById('rulesBtn')?.addEventListener('click', showRulesModal);
    
    // Кнопки пополнения и вывода
    document.getElementById('depositBtn')?.addEventListener('click', showRealDepositModal);
    document.getElementById('withdrawBtn')?.addEventListener('click', showWithdrawModal);
    
    // Карточки игр
    setupGameCards();
    
    // Модальное окно ставок
    setupBetModal();
}

// Настройка карточек игр
function setupGameCards() {
    const cards = {
        'playWithBot': { mode: 'bot', opponent: 'Бот' },
        'playOnline': { mode: 'online', opponent: 'Онлайн соперник' },
        'createLobby': { mode: 'private', opponent: 'Друг' },
        'quickPlay': { mode: 'quick', opponent: 'Случайный соперник' }
    };
    
    Object.keys(cards).forEach(cardId => {
        const card = document.getElementById(cardId);
        if (card) {
            card.addEventListener('click', () => {
                const user = getCurrentUser();
                if (!user) {
                    showNotification('Ошибка авторизации. Перезагрузите приложение.', 'error');
                    return;
                }
                
                console.log(`Выбрана игра: ${cards[cardId].opponent}`);
                showBetModal(cards[cardId].mode, cards[cardId].opponent);
            });
        }
    });
}

// Настройка модального окна ставок
function setupBetModal() {
    const cancelBtn = document.getElementById('cancelBet');
    const confirmBtn = document.getElementById('confirmBet');
    const balanceRadios = document.querySelectorAll('input[name="balanceType"]');
    const amountButtons = document.querySelectorAll('.amount-btn');
    const customAmountInput = document.getElementById('customAmount');
    
    window.currentBet = {
        amount: 10,
        balanceType: 'game',
        gameMode: null,
        opponent: null
    };
    
    // Устанавливаем первую кнопку суммы как активную
    if (amountButtons.length > 0) {
        amountButtons[0].classList.add('active');
        window.currentBet.amount = parseInt(amountButtons[0].dataset.amount) || 10;
    }
    
    // Отмена
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            document.getElementById('betModal').style.display = 'none';
            window.currentBet = { amount: 10, balanceType: 'game', gameMode: null, opponent: null };
        });
    }
    
    // Подтверждение
    if (confirmBtn) {
        confirmBtn.addEventListener('click', processBet);
    }
    
    // Выбор типа баланса
    balanceRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            window.currentBet.balanceType = e.target.value;
            updateCommissionNotice();
        });
    });
    
    // Кнопки суммы
    amountButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            amountButtons.forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            window.currentBet.amount = parseInt(e.target.dataset.amount);
            customAmountInput.value = '';
        });
    });
    
    // Пользовательская сумма
    if (customAmountInput) {
        customAmountInput.addEventListener('input', (e) => {
            amountButtons.forEach(btn => btn.classList.remove('active'));
            window.currentBet.amount = parseInt(e.target.value) || 0;
        });
    }
}

// Показать модальное окно ставок
function showBetModal(gameMode, opponent) {
    const modal = document.getElementById('betModal');
    if (!modal) return;
    
    window.currentBet.gameMode = gameMode;
    window.currentBet.opponent = opponent;
    
    updateCommissionNotice();
    modal.style.display = 'flex';
}

// Обновить уведомление о комиссии
function updateCommissionNotice() {
    const notice = document.getElementById('commissionNotice');
    if (!notice) return;
    
    if (window.currentBet.gameMode === 'online' && window.currentBet.balanceType === 'real') {
        notice.style.display = 'flex';
    } else {
        notice.style.display = 'none';
    }
}

// Обработка ставки
function processBet() {
    const user = getCurrentUser();
    if (!user) {
        showNotification('Ошибка авторизации', 'error');
        return;
    }
    
    // Проверка суммы
    if (window.currentBet.amount < 1) {
        showNotification('Минимальная сумма ставки: 1', 'error');
        return;
    }
    
    // Проверка баланса
    if (window.currentBet.balanceType === 'game' && user.gameBalance < window.currentBet.amount) {
        showNotification('Недостаточно игровых средств', 'error');
        return;
    }
    
    if (window.currentBet.balanceType === 'real' && user.realBalance < window.currentBet.amount) {
        showNotification('Недостаточно реальных средств', 'error');
        return;
    }
    
    // Списываем ставку
    const users = JSON.parse(localStorage.getItem('ticTacToeUsers') || '[]');
    const userIndex = users.findIndex(u => u.id === user.id);
    
    if (window.currentBet.balanceType === 'game') {
        user.gameBalance -= window.currentBet.amount;
    } else {
        user.realBalance -= window.currentBet.amount;
    }
    
    users[userIndex] = user;
    localStorage.setItem('ticTacToeUsers', JSON.stringify(users));
    
    // Закрываем модальное окно
    document.getElementById('betModal').style.display = 'none';
    
    // Начинаем игру
    startGame(window.currentBet);
    
    // Обновляем UI
    updateBalanceDisplay();
}

// Начать игру
function startGame(bet) {
    console.log('🎮 Начинаем игру:', bet);
    
    // Скрываем главное меню
    document.querySelector('.main-menu').style.display = 'none';
    
    // Создаем игровое поле
    const gameContainer = document.getElementById('game-container');
    gameContainer.innerHTML = createGameBoardHTML(bet);
    gameContainer.style.display = 'block';
    
    // Инициализируем игру
    initGame(bet);
}

// Создание HTML игрового поля
function createGameBoardHTML(bet) {
    return `
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
            ${Array(9).fill().map((_, i) => 
                `<div class="cell" data-index="${i}"></div>`
            ).join('')}
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
}

// Инициализация игры
function initGame(bet) {
    const cells = document.querySelectorAll('.cell');
    let currentPlayer = 'X';
    let gameActive = true;
    let board = ['', '', '', '', '', '', '', '', ''];
    
    // Кнопка возврата в меню
    document.getElementById('backToMenu').addEventListener('click', () => {
        document.getElementById('game-container').style.display = 'none';
        document.querySelector('.main-menu').style.display = 'flex';
    });
    
    // Обработчики для клеток
    cells.forEach(cell => {
        cell.addEventListener('click', function() {
            if (!gameActive) return;
            
            const index = parseInt(this.dataset.index);
            
            if (board[index] !== '') return;
            
            // Ход игрока
            makeMove(index, currentPlayer);
            
            // Проверяем результат
            if (checkWinner(board, currentPlayer)) {
                endGame(currentPlayer === 'X' ? 'win' : 'lose', bet);
                return;
            }
            
            if (isBoardFull(board)) {
                endGame('draw', bet);
                return;
            }
            
            // Меняем игрока
            currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
            document.getElementById('currentPlayer').textContent = currentPlayer;
            
            // Если игра с ботом и сейчас ход бота
            if (bet.gameMode === 'bot' && currentPlayer === 'O') {
                setTimeout(() => makeBotMove(), 500);
            }
        });
    });
    
    // Если игра с ботом и бот ходит первым
    if (bet.gameMode === 'bot' && Math.random() > 0.5) {
        currentPlayer = 'O';
        document.getElementById('currentPlayer').textContent = currentPlayer;
        setTimeout(() => makeBotMove(), 1000);
    }
    
    // Ход игрока
    function makeMove(index, player) {
        board[index] = player;
        cells[index].textContent = player;
        cells[index].classList.add(player.toLowerCase());
    }
    
    // Ход бота
    function makeBotMove() {
        if (!gameActive) return;
        
        // Простой ИИ: сначала пытается выиграть, потом блокирует, потом случайный ход
        let move = findWinningMove(board, 'O') || 
                   findWinningMove(board, 'X') || 
                   findBestMove(board);
        
        if (move !== null) {
            makeMove(move, 'O');
            
            // Проверяем результат
            if (checkWinner(board, 'O')) {
                endGame('lose', bet);
                return;
            }
            
            if (isBoardFull(board)) {
                endGame('draw', bet);
                return;
            }
            
            // Возвращаем ход игроку
            currentPlayer = 'X';
            document.getElementById('currentPlayer').textContent = currentPlayer;
        }
    }
    
    // Поиск выигрышного хода
    function findWinningMove(board, player) {
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                const tempBoard = [...board];
                tempBoard[i] = player;
                if (checkWinner(tempBoard, player)) {
                    return i;
                }
            }
        }
        return null;
    }
    
    // Поиск лучшего хода
    function findBestMove(board) {
        // Центр
        if (board[4] === '') return 4;
        
        // Углы
        const corners = [0, 2, 6, 8];
        const emptyCorners = corners.filter(i => board[i] === '');
        if (emptyCorners.length > 0) {
            return emptyCorners[Math.floor(Math.random() * emptyCorners.length)];
        }
        
        // Стороны
        const sides = [1, 3, 5, 7];
        const emptySides = sides.filter(i => board[i] === '');
        if (emptySides.length > 0) {
            return emptySides[Math.floor(Math.random() * emptySides.length)];
        }
        
        return null;
    }
    
    // Проверка победителя
    function checkWinner(board, player) {
        const winPatterns = [
            [0,1,2], [3,4,5], [6,7,8], // Горизонтали
            [0,3,6], [1,4,7], [2,5,8], // Вертикали
            [0,4,8], [2,4,6] // Диагонали
        ];
        
        return winPatterns.some(pattern => 
            pattern.every(index => board[index] === player)
        );
    }
    
    // Проверка заполненности поля
    function isBoardFull(board) {
        return !board.includes('');
    }
    
    // Завершение игры
    function endGame(result, bet) {
        gameActive = false;
        
        const resultElement = document.querySelector('.game-result');
        const continueBtn = document.getElementById('continueGame');
        
        // Показываем результат
        if (result === 'win') {
            resultElement.innerHTML = `
                <div class="result-win">
                    <i class="fas fa-trophy"></i>
                    <span>Вы выиграли!</span>
                </div>
            `;
            processGameResult('win', bet);
        } else if (result === 'lose') {
            resultElement.innerHTML = `
                <div class="result-lose">
                    <i class="fas fa-times-circle"></i>
                    <span>Вы проиграли</span>
                </div>
            `;
            processGameResult('lose', bet);
        } else {
            resultElement.innerHTML = `
                <div class="result-draw">
                    <i class="fas fa-handshake"></i>
                    <span>Ничья!</span>
                </div>
            `;
            processGameResult('draw', bet);
        }
        
        // Показываем кнопку продолжения
        if (continueBtn) {
            continueBtn.style.display = 'block';
            continueBtn.addEventListener('click', () => {
                document.getElementById('game-container').style.display = 'none';
                document.querySelector('.main-menu').style.display = 'flex';
                updateUI();
            });
        }
    }
}

// Обработка результата игры
function processGameResult(result, bet) {
    const user = getCurrentUser();
    if (!user) return;
    
    // Обновляем статистику
    user.totalGames = (user.totalGames || 0) + 1;
    if (result === 'win') {
        user.totalWins = (user.totalWins || 0) + 1;
    }
    
    // Обрабатываем финансовый результат
    let winnings = 0;
    let commission = 0;
    
    if (result === 'win') {
        winnings = bet.amount * 2;
        
        // Комиссия 5% для онлайн игр на реальный баланс
        if (bet.gameMode === 'online' && bet.balanceType === 'real') {
            commission = winnings * 0.05;
            winnings -= commission;
            
            // Сохраняем комиссию
            saveBotCommission(commission, user.id, bet);
            
            // Показываем уведомление
            showNotification(`Бот удержал 5% комиссии: ${commission.toFixed(2)}`, 'info');
        }
        
        // Начисляем выигрыш
        if (bet.balanceType === 'game') {
            user.gameBalance += winnings;
        } else {
            user.realBalance += winnings;
        }
        
        showNotification(`🎉 Вы выиграли ${winnings} ${bet.balanceType === 'game' ? 'монет' : 'USD'}!`, 'success');
        
    } else if (result === 'draw') {
        // Возвращаем ставку при ничье
        if (bet.balanceType === 'game') {
            user.gameBalance += bet.amount;
        } else {
            user.realBalance += bet.amount;
        }
        showNotification('🤝 Ничья! Ставка возвращена', 'info');
    } else {
        // Проигрыш - ставка уже списана
        showNotification('😔 Вы проиграли', 'error');
    }
    
    // Сохраняем пользователя
    const users = JSON.parse(localStorage.getItem('ticTacToeUsers') || '[]');
    const userIndex = users.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
        users[userIndex] = user;
        localStorage.setItem('ticTacToeUsers', JSON.stringify(users));
    }
    
    // Сохраняем запись об игре
    saveGameRecord({
        userId: user.id,
        mode: bet.gameMode,
        opponent: bet.opponent,
        stake: bet.amount,
        balanceType: bet.balanceType,
        result: result,
        winnings: winnings,
        commission: commission,
        timestamp: new Date().toISOString()
    });
    
    // Обновляем UI
    updateBalanceDisplay();
}

// Сохранение записи игры
function saveGameRecord(gameData) {
    const games = JSON.parse(localStorage.getItem('ticTacToeGames') || '[]');
    gameData.id = Date.now();
    games.push(gameData);
    localStorage.setItem('ticTacToeGames', JSON.stringify(games));
}

// Сохранение комиссии бота
function saveBotCommission(amount, userId, bet) {
    const commissions = JSON.parse(localStorage.getItem('botCommissions') || '[]');
    commissions.push({
        id: Date.now(),
        amount: amount,
        userId: userId,
        gameMode: bet.gameMode,
        stake: bet.amount,
        timestamp: new Date().toISOString()
    });
    localStorage.setItem('botCommissions', JSON.stringify(commissions));
}

// Показать модальное окно пополнения
function showRealDepositModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2><i class="fas fa-wallet"></i> Пополнение баланса</h2>
            
            <div class="deposit-options">
                <div class="deposit-method" id="depositCrypto">
                    <div class="method-icon">
                        <i class="fas fa-coins"></i>
                    </div>
                    <div class="method-info">
                        <h3>Криптовалюта</h3>
                        <p>USDT, BTC, ETH через CryptoBot</p>
                    </div>
                </div>
                
                <div class="deposit-method" id="depositCard">
                    <div class="method-icon">
                        <i class="fas fa-credit-card"></i>
                    </div>
                    <div class="method-info">
                        <h3>Банковская карта</h3>
                        <p>Visa, Mastercard, Мир</p>
                    </div>
                </div>
                
                <div class="deposit-method" id="depositTest">
                    <div class="method-icon">
                        <i class="fas fa-vial"></i>
                    </div>
                    <div class="method-info">
                        <h3>Тестовое пополнение</h3>
                        <p>Для разработки и тестирования</p>
                    </div>
                </div>
            </div>
            
            <div class="modal-actions">
                <button class="btn-secondary" id="closeDeposit">Отмена</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    
    // Обработчики методов пополнения
    modal.querySelector('#depositCrypto').addEventListener('click', () => {
        modal.remove();
        showCryptoDepositModal();
    });
    
    modal.querySelector('#depositCard').addEventListener('click', () => {
        modal.remove();
        showCardDepositModal();
    });
    
    modal.querySelector('#depositTest').addEventListener('click', () => {
        modal.remove();
        showTestDepositModal();
    });
    
    modal.querySelector('#closeDeposit').addEventListener('click', () => {
        modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Пополнение криптовалютой
function showCryptoDepositModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2><i class="fas fa-coins"></i> Пополнение криптовалютой</h2>
            
            <div class="crypto-deposit-content">
                <div class="deposit-info">
                    <p>Для пополнения через CryptoBot:</p>
                    <ol>
                        <li>Перейдите в бота @CryptoBot</li>
                        <li>Отправьте команду /start</li>
                        <li>Выберите "Пополнить баланс"</li>
                        <li>Укажите сумму в USD</li>
                        <li>После оплаты баланс обновится автоматически</li>
                    </ol>
                </div>
                
                <div class="crypto-addresses">
                    <h3>Или отправьте на адрес:</h3>
                    <div class="address">
                        <span>USDT (TRC20):</span>
                        <code>Txxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</code>
                    </div>
                    <div class="address">
                        <span>BTC:</span>
                        <code>1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</code>
                    </div>
                </div>
            </div>
            
            <div class="modal-actions">
                <button class="btn-primary" id="openCryptoBot">Открыть CryptoBot</button>
                <button class="btn-secondary" id="closeCrypto">Закрыть</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    
    modal.querySelector('#openCryptoBot').addEventListener('click', () => {
        window.open('https://t.me/CryptoBot', '_blank');
    });
    
    modal.querySelector('#closeCrypto').addEventListener('click', () => {
        modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Пополнение картой
function showCardDepositModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2><i class="fas fa-credit-card"></i> Пополнение картой</h2>
            
            <div class="card-deposit-content">
                <div class="amount-selection">
                    <h3>Выберите сумму:</h3>
                    <div class="amount-buttons">
                        <button class="amount-btn" data-amount="10">10 USD</button>
                        <button class="amount-btn" data-amount="50">50 USD</button>
                        <button class="amount-btn" data-amount="100">100 USD</button>
                        <button class="amount-btn" data-amount="500">500 USD</button>
                    </div>
                    <input type="number" placeholder="Другая сумма" min="1" id="cardAmount">
                </div>
                
                <div class="payment-info">
                    <p>Комиссия: 3%</p>
                    <p>Минимальная сумма: 1 USD</p>
                    <p>Зачисление: моментально</p>
                </div>
            </div>
            
            <div class="modal-actions">
                <button class="btn-primary" id="processCardPayment">Пополнить</button>
                <button class="btn-secondary" id="closeCard">Отмена</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    
    let selectedAmount = 0;
    
    // Выбор суммы
    modal.querySelectorAll('.amount-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            modal.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            selectedAmount = parseInt(e.target.dataset.amount);
            modal.querySelector('#cardAmount').value = '';
        });
    });
    
    // Пользовательская сумма
    modal.querySelector('#cardAmount').addEventListener('input', (e) => {
        modal.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('active'));
        selectedAmount = parseInt(e.target.value) || 0;
    });
    
    // Обработка платежа
    modal.querySelector('#processCardPayment').addEventListener('click', ()
