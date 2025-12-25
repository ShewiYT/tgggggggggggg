
// В начало game.js добавьте:
function checkAndGrantStartBalance() {
    const user = getCurrentUser();
    if (!user) return;
    
    // Проверяем, выдавался ли уже стартовый баланс
    const startBalanceGranted = localStorage.getItem(`startBalanceGranted_${user.id}`);
    
    if (!startBalanceGranted && (user.gameBalance === undefined || user.gameBalance < 100)) {
        user.gameBalance = 100; // Стартовый баланс
        updateUser(user);
        localStorage.setItem(`startBalanceGranted_${user.id}`, 'true');
        
        // Показываем уведомление
        if (window.showNotification) {
            showNotification('🎉 Вам начислен стартовый бонус: 100 игровых монет!', 'success');
        }
    }
}

// Вызовите эту функцию при инициализации игры
document.addEventListener('DOMContentLoaded', function() {
    checkAndGrantStartBalance();
});


// Логика игры в крестики-нолики

let gameState = {
    board: Array(9).fill(''),
    currentPlayer: 'X',
    gameActive: true,
    gameMode: null, // 'bot', 'online', 'private'
    opponent: null,
    stake: 0,
    balanceType: 'game',
    winner: null,
    result: null, // 'win', 'lose', 'draw'
    startTime: null,
    endTime: null
};

// DOM элементы
let cells = [];
let currentPlayerElement = null;
let gameStatusElement = null;

// Инициализация игры
function initGame() {
    // Получаем элементы DOM
    cells = document.querySelectorAll('.cell');
    currentPlayerElement = document.getElementById('currentPlayer');
    gameStatusElement = document.getElementById('gameStatus');
    
    // Создаем игровое поле, если его нет
    if (!document.querySelector('.game-board')) {
        createGameBoard();
    }
    
    // Добавляем обработчики событий
    cells.forEach((cell, index) => {
        cell.addEventListener('click', () => handleCellClick(index));
    });
    
    // Сбрасываем состояние игры
    resetGame();
}

// Создание игрового поля
function createGameBoard() {
    const container = document.querySelector('.container');
    
    // Сохраняем оригинальное меню
    const mainMenu = document.querySelector('.main-menu');
    mainMenu.classList.add('hidden');
    
    // Создаем контейнер игры
    const gameContainer = document.createElement('div');
    gameContainer.className = 'game-container';
    gameContainer.innerHTML = `
        <div class="game-header">
            <button class="btn-icon" id="backToMenu">
                <i class="fas fa-arrow-left"></i>
            </button>
            <h2>Игра</h2>
            <div class="game-timer" id="gameTimer">00:00</div>
        </div>
        
        <div class="game-info">
            <div class="player-info" id="playerX">
                <div class="player-avatar">
                    <i class="fas fa-times"></i>
                </div>
                <span class="player-name" id="playerXName">Вы (X)</span>
                <span class="player-stake" id="playerXStake">Ставка: 0</span>
            </div>
            
            <div class="vs">VS</div>
            
            <div class="player-info" id="playerO">
                <div class="player-avatar">
                    <i class="far fa-circle"></i>
                </div>
                <span class="player-name" id="playerOName">Противник (O)</span>
                <span class="player-stake" id="playerOStake">Ставка: 0</span>
            </div>
        </div>
        
        <div class="game-board" id="gameBoard">
            ${Array(9).fill('<div class="cell"></div>').join('')}
        </div>
        
        <div class="game-status" id="gameStatus">
            <div class="current-player">
                Сейчас ходит: <span id="currentPlayer">X</span>
            </div>
            <div class="game-result" id="gameResult"></div>
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
    
    container.appendChild(gameContainer);
    
    // Инициализируем элементы
    cells = document.querySelectorAll('.cell');
    currentPlayerElement = document.getElementById('currentPlayer');
    gameStatusElement = document.getElementById('gameStatus');
    
    // Добавляем обработчики событий
    document.getElementById('backToMenu').addEventListener('click', showMainMenu);
    document.getElementById('restartGame').addEventListener('click', resetGame);
    document.getElementById('continueGame').addEventListener('click', continueGame);
    
    cells.forEach((cell, index) => {
        cell.addEventListener('click', () => handleCellClick(index));
    });
    
    // Запускаем таймер
    gameState.startTime = Date.now();
    updateGameTimer();
}

// Обработка клика по ячейке
function handleCellClick(index) {
    // Проверяем условия для хода
    if (!gameState.gameActive || 
        gameState.board[index] !== '' || 
        (gameState.gameMode === 'bot' && gameState.currentPlayer === 'O')) {
        return;
    }
    
    // Делаем ход
    makeMove(index);
    
    // Если игра с ботом и игра еще активна
    if (gameState.gameMode === 'bot' && gameState.gameActive && gameState.currentPlayer === 'O') {
        setTimeout(makeBotMove, 500); // Задержка для реалистичности
    }
    
    // Если онлайн игра, отправляем ход
    if (gameState.gameMode === 'online' && window.multiplayer) {
        window.multiplayer.sendMove(index);
    }
}

// Сделать ход
function makeMove(index) {
    // Обновляем доску
    gameState.board[index] = gameState.currentPlayer;
    
    // Обновляем отображение
    const cell = cells[index];
    cell.textContent = gameState.currentPlayer;
    cell.classList.add(gameState.currentPlayer.toLowerCase());
    
    // Проверяем победителя
    checkWinner();
    
    // Меняем игрока
    if (gameState.gameActive) {
        gameState.currentPlayer = gameState.currentPlayer === 'X' ? 'O' : 'X';
        updateGameStatus();
    }
}

// Проверка победителя
function checkWinner() {
    const winningCombinations = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Горизонтали
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Вертикали
        [0, 4, 8], [2, 4, 6] // Диагонали
    ];
    
    // Проверяем все комбинации
    for (const combination of winningCombinations) {
        const [a, b, c] = combination;
        if (gameState.board[a] && 
            gameState.board[a] === gameState.board[b] && 
            gameState.board[a] === gameState.board[c]) {
            
            // Найден победитель
            gameState.gameActive = false;
            gameState.winner = gameState.board[a];
            gameState.result = gameState.winner === 'X' ? 'win' : 'lose';
            gameState.endTime = Date.now();
            
            // Подсвечиваем выигрышную комбинацию
            combination.forEach(index => {
                cells[index].classList.add('winning');
            });
            
            // Показываем результат
            showGameResult();
            
            // Обрабатываем выигрыш
            processGameResult();
            
            return;
        }
    }
    
    // Проверяем ничью
    if (!gameState.board.includes('') && gameState.gameActive) {
        gameState.gameActive = false;
        gameState.result = 'draw';
        gameState.endTime = Date.now();
        showGameResult();
        processGameResult();
    }
}

// Показать результат игры
function showGameResult() {
    const resultElement = document.getElementById('gameResult');
    
    if (gameState.result === 'win') {
        resultElement.innerHTML = `
            <div class="result-win">
                <i class="fas fa-trophy"></i>
                <span>Вы выиграли!</span>
            </div>
        `;
    } else if (gameState.result === 'lose') {
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
    }
    
    // Показываем кнопку продолжения
    document.getElementById('continueGame').style.display = 'block';
}

// Обработать результат игры
function processGameResult() {
    const gameDuration = Math.floor((gameState.endTime - gameState.startTime) / 1000);
    
    // Сохраняем игру в историю
    const gameRecord = {
        id: Date.now(),
        mode: gameState.gameMode,
        opponent: gameState.opponent,
        stake: gameState.stake,
        balanceType: gameState.balanceType,
        result: gameState.result,
        winner: gameState.winner,
        duration: gameDuration,
        timestamp: new Date().toISOString(),
        board: [...gameState.board]
    };
    
    // Если была ставка, обрабатываем финансовый результат
    if (gameState.stake > 0) {
        processBetResult(gameRecord);
    }
    
    saveGameToHistory(gameRecord);
    
    // Обновляем статистику
    updateUserStats(gameRecord);
}

// Обработать результат ставки
function processBetResult(gameRecord) {
    const user = getCurrentUser();
    
    if (!user) return;
    
    if (gameRecord.result === 'win') {
        // Рассчитываем выигрыш с учетом комиссии
        let userWinnings = gameRecord.stake * 2;
        let commission = 0;
        
        // Проверяем условия для комиссии
        const shouldApplyComm = shouldApplyCommission(
            gameRecord.balanceType,
            gameRecord.result,
            gameRecord.opponent
        );
        
        if (shouldApplyComm) {
            [userWinnings, commission] = calculateCommission(gameRecord.stake);
            
            // Сохраняем комиссию
            gameRecord.commission = commission;
            gameRecord.netWinnings = userWinnings;
            
            // Обновляем фонд бота
            updateBotCommissionFund(commission, gameRecord);
            
            // Показываем уведомление о комиссии
            showCommissionNotification(commission);
        }
        
        // Зачисляем выигрыш на баланс
        if (gameRecord.balanceType === 'game') {
            updateGameBalance(userWinnings);
        } else {
            updateRealBalance(userWinnings);
        }
        
        // Показываем результат с комиссией
        showWinModal(userWinnings, commission, gameRecord.balanceType);
        
    } else if (gameRecord.result === 'lose') {
        // Ставка уже списана в начале игры
        // Показываем уведомление о проигрыше
        showLossModal(gameRecord.stake);
    }
}

// Показать модальное окно выигрыша
function showWinModal(winnings, commission, balanceType) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    
    const currency = balanceType === 'game' ? 'игр.' : 'USD';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="result-icon">
                <i class="fas fa-trophy" style="color: var(--success-color); font-size: 48px;"></i>
            </div>
            <h2>Поздравляем!</h2>
            <p class="result-text">Вы выиграли <span class="highlight">${winnings} ${currency}</span></p>
            
            ${commission > 0 ? `
                <div class="commission-info">
                    <i class="fas fa-info-circle"></i>
                    <p>Бот удержал 5% комиссии: <span class="commission-amount">${commission} ${currency}</span></p>
                    <p class="small">На ваш баланс зачислено: <strong>${winnings} ${currency}</strong></p>
                </div>
            ` : ''}
            
            <div class="modal-actions">
                <button class="btn-primary" id="closeResultModal">
                    <i class="fas fa-check"></i> Продолжить
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('closeResultModal').addEventListener('click', () => {
        modal.remove();
    });
}

// Показать уведомление о комиссии
function showCommissionNotification(commission) {
    const notification = document.getElementById('commissionNotification');
    const amountElement = document.getElementById('commissionAmount');
    
    amountElement.textContent = commission;
    notification.style.display = 'flex';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 5000);
}

// Обновить статус игры
function updateGameStatus() {
    if (currentPlayerElement) {
        currentPlayerElement.textContent = gameState.currentPlayer;
    }
}

// Сбросить игру
function resetGame() {
    gameState.board = Array(9).fill('');
    gameState.currentPlayer = 'X';
    gameState.gameActive = true;
    gameState.winner = null;
    gameState.result = null;
    gameState.startTime = Date.now();
    
    // Очищаем поле
    cells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('x', 'o', 'winning');
    });
    
    // Обновляем статус
    updateGameStatus();
    
    // Скрываем результат
    const resultElement = document.getElementById('gameResult');
    if (resultElement) {
        resultElement.innerHTML = '';
    }
    
    // Скрываем кнопку продолжения
    const continueBtn = document.getElementById('continueGame');
    if (continueBtn) {
        continueBtn.style.display = 'none';
    }
}

// Обновить таймер игры
function updateGameTimer() {
    const timerElement = document.getElementById('gameTimer');
    if (!timerElement || !gameState.startTime) return;
    
    const update = () => {
        if (!gameState.gameActive) return;
        
        const now = Date.now();
        const diff = Math.floor((now - gameState.startTime) / 1000);
        const minutes = Math.floor(diff / 60).toString().padStart(2, '0');
        const seconds = (diff % 60).toString().padStart(2, '0');
        
        timerElement.textContent = `${minutes}:${seconds}`;
        
        requestAnimationFrame(update);
    };
    
    update();
}

// Продолжить игру (после завершения)
function continueGame() {
    if (gameState.gameMode === 'online' || gameState.gameMode === 'private') {
        // Для онлайн игр возвращаемся в меню
        showMainMenu();
    } else {
        // Для игры с ботом начинаем новую
        resetGame();
    }
}

// Показать главное меню
function showMainMenu() {
    const gameContainer = document.querySelector('.game-container');
    const mainMenu = document.querySelector('.main-menu');
    
    if (gameContainer) {
        gameContainer.remove();
    }
    
    if (mainMenu) {
        mainMenu.classList.remove('hidden');
    }
    
    // Обновляем балансы
    updateBalanceDisplay();
}

// Начать игру с параметрами
function startGame(mode, opponent, stake, balanceType) {
    gameState.gameMode = mode;
    gameState.opponent = opponent;
    gameState.stake = stake;
    gameState.balanceType = balanceType;
    
    // Списываем ставку
    if (stake > 0) {
        if (balanceType === 'game') {
            updateGameBalance(-stake);
        } else {
            updateRealBalance(-stake);
        }
    }
    
    // Обновляем отображение ставок
    updateStakeDisplay(stake);
    
    // Создаем игровое поле
    createGameBoard();
    
    // Если игра с ботом и бот ходит первым
    if (mode === 'bot' && Math.random() > 0.5) {
        gameState.currentPlayer = 'O';
        updateGameStatus();
        setTimeout(makeBotMove, 1000);
    }
}

// Обновить отображение ставок
function updateStakeDisplay(stake) {
    const playerXStake = document.getElementById('playerXStake');
    const playerOStake = document.getElementById('playerOStake');
    
    if (playerXStake) {
        playerXStake.textContent = `Ставка: ${stake}`;
    }
    
    if (playerOStake) {
        playerOStake.textContent = `Ставка: ${stake}`;
    }
}

// Экспортируем функции для использования в других файлах
window.gameModule = {
    initGame,
    startGame,
    resetGame,
    showMainMenu
};

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', initGame);