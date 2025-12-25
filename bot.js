// ИИ-бот для игры в крестики-нолики с самообучением

const BOT_STORAGE_KEY = 'ticTacToeBotData';

class TicTacToeBot {
    constructor() {
        this.loadData();
        this.difficulty = 'medium'; // easy, medium, hard
    }
    
    // Загрузка данных бота
    loadData() {
        const data = localStorage.getItem(BOT_STORAGE_KEY);
        if (data) {
            const parsed = JSON.parse(data);
            this.gameHistory = parsed.gameHistory || [];
            this.winPatterns = parsed.winPatterns || {};
            this.learningRate = parsed.learningRate || 0.1;
        } else {
            this.gameHistory = [];
            this.winPatterns = {};
            this.learningRate = 0.1;
            this.saveData();
        }
    }
    
    // Сохранение данных бота
    saveData() {
        const data = {
            gameHistory: this.gameHistory.slice(-1000), // Храним последние 1000 игр
            winPatterns: this.winPatterns,
            learningRate: this.learningRate,
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem(BOT_STORAGE_KEY, JSON.stringify(data));
    }
    
    // Сделать ход
    makeMove(board, player = 'O') {
        const emptyCells = this.getEmptyCells(board);
        
        if (emptyCells.length === 0) return -1;
        
        // Выбор стратегии в зависимости от сложности
        let move;
        switch(this.difficulty) {
            case 'easy':
                move = this.getEasyMove(emptyCells);
                break;
            case 'hard':
                move = this.getHardMove(board, player, emptyCells);
                break;
            case 'medium':
            default:
                move = this.getMediumMove(board, player, emptyCells);
                break;
        }
        
        return move;
    }
    
    // Легкий уровень - случайный ход
    getEasyMove(emptyCells) {
        return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }
    
    // Средний уровень - базовая стратегия
    getMediumMove(board, player, emptyCells) {
        // 1. Проверяем возможность выиграть следующим ходом
        const winningMove = this.findWinningMove(board, player);
        if (winningMove !== -1) return winningMove;
        
        // 2. Блокируем выигрыш соперника
        const opponent = player === 'X' ? 'O' : 'X';
        const blockingMove = this.findWinningMove(board, opponent);
        if (blockingMove !== -1) return blockingMove;
        
        // 3. Занимаем центр, если свободен
        if (board[4] === '') return 4;
        
        // 4. Занимаем углы
        const corners = [0, 2, 6, 8];
        const availableCorners = corners.filter(i => board[i] === '');
        if (availableCorners.length > 0) {
            return availableCorners[Math.floor(Math.random() * availableCorners.length)];
        }
        
        // 5. Случайный ход
        return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }
    
    // Сложный уровень - с обучением
    getHardMove(board, player, emptyCells) {
        // Используем накопленные знания
        const boardKey = this.getBoardKey(board, player);
        
        if (this.winPatterns[boardKey]) {
            // Выбираем ход с наибольшей вероятностью выигрыша
            const moves = this.winPatterns[boardKey];
            const bestMove = Object.keys(moves).reduce((best, cell) => {
                return moves[cell] > moves[best] ? cell : best;
            });
            
            if (emptyCells.includes(parseInt(bestMove))) {
                return parseInt(bestMove);
            }
        }
        
        // Если нет данных, используем средний уровень
        return this.getMediumMove(board, player, emptyCells);
    }
    
    // Найти выигрышный ход
    findWinningMove(board, player) {
        const winningCombinations = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Горизонтали
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Вертикали
            [0, 4, 8], [2, 4, 6] // Диагонали
        ];
        
        for (const combination of winningCombinations) {
            const [a, b, c] = combination;
            const cells = [board[a], board[b], board[c]];
            
            // Если две клетки заняты игроком, а третья пуста
            if (cells.filter(cell => cell === player).length === 2) {
                const emptyIndex = combination[cells.findIndex(cell => cell === '')];
                if (board[emptyIndex] === '') {
                    return emptyIndex;
                }
            }
        }
        
        return -1;
    }
    
    // Получить пустые клетки
    getEmptyCells(board) {
        return board
            .map((cell, index) => cell === '' ? index : -1)
            .filter(index => index !== -1);
    }
    
    // Получить ключ доски для хранения паттернов
    getBoardKey(board, player) {
        return board.join('') + player;
    }
    
    // Обучение на основе сыгранной игры
    learnFromGame(boardHistory, winner) {
        // Сохраняем игру в историю
        this.gameHistory.push({
            boardHistory: [...boardHistory],
            winner: winner,
            timestamp: new Date().toISOString()
        });
        
        // Обновляем паттерны выигрышных ходов
        if (winner === 'O') { // Бот выиграл
            this.updateWinPatterns(boardHistory, true);
        } else if (winner === 'X') { // Бот проиграл
            this.updateWinPatterns(boardHistory, false);
        }
        
        this.saveData();
    }
    
    // Обновление паттернов выигрышных ходов
    updateWinPatterns(boardHistory, won) {
        const updateValue = won ? this.learningRate : -this.learningRate;
        
        boardHistory.forEach((boardState, moveIndex) => {
            if (moveIndex % 2 === 1) { // Ходы бота (нечетные индексы)
                const player = 'O';
                const boardKey = this.getBoardKey(boardState.board, player);
                const move = boardState.move;
                
                if (!this.winPatterns[boardKey]) {
                    this.winPatterns[boardKey] = {};
                }
                
                if (!this.winPatterns[boardKey][move]) {
                    this.winPatterns[boardKey][move] = 0;
                }
                
                this.winPatterns[boardKey][move] += updateValue;
                
                // Нормализуем значения
                const values = Object.values(this.winPatterns[boardKey]);
                const maxValue = Math.max(...values);
                const minValue = Math.min(...values);
                const range = maxValue - minValue;
                
                if (range > 0) {
                    Object.keys(this.winPatterns[boardKey]).forEach(key => {
                        this.winPatterns[boardKey][key] = 
                            (this.winPatterns[boardKey][key] - minValue) / range;
                    });
                }
            }
        });
    }
    
    // Установка сложности
    setDifficulty(level) {
        this.difficulty = level;
    }
    
    // Получить статистику бота
    getStats() {
        const totalGames = this.gameHistory.length;
        const botWins = this.gameHistory.filter(game => game.winner === 'O').length;
        const botLosses = this.gameHistory.filter(game => game.winner === 'X').length;
        const draws = this.gameHistory.filter(game => game.winner === 'draw').length;
        
        return {
            totalGames,
            botWins,
            botLosses,
            draws,
            winRate: totalGames > 0 ? (botWins / totalGames * 100).toFixed(1) : 0,
            patternsLearned: Object.keys(this.winPatterns).length
        };
    }
    
    // Сброс обучения
    resetLearning() {
        this.gameHistory = [];
        this.winPatterns = {};
        this.saveData();
    }
}

// Создаем глобальный экземпляр бота
const gameBot = new TicTacToeBot();

// Функция для использования в игре
function makeBotMove() {
    if (!window.gameState || !window.gameState.gameActive) return;
    
    const move = gameBot.makeMove(window.gameState.board, 'O');
    
    if (move !== -1 && window.gameModule && window.gameModule.makeMove) {
        window.gameModule.makeMove(move);
    }
}

// Сохранение истории игры для обучения
let gameHistory = [];

function saveMoveToHistory(board, move) {
    gameHistory.push({
        board: [...board],
        move: move,
        player: window.gameState.currentPlayer,
        timestamp: Date.now()
    });
}

function saveGameForLearning(winner) {
    if (window.gameState.gameMode === 'bot') {
        gameBot.learnFromGame(gameHistory, winner);
    }
    gameHistory = [];
}

// Инициализация бота
function initBot() {
    // Переопределяем функцию makeMove для сохранения истории
    const originalMakeMove = window.gameModule?.makeMove;
    if (originalMakeMove) {
        window.gameModule.makeMove = function(index) {
            saveMoveToHistory(window.gameState.board, index);
            originalMakeMove(index);
        };
    }
    
    // Переопределяем функцию processGameResult для обучения
    const originalProcessResult = window.gameModule?.processGameResult;
    if (originalProcessResult) {
        window.gameModule.processGameResult = function(gameRecord) {
            if (window.gameState.gameMode === 'bot') {
                saveGameForLearning(gameRecord.winner);
            }
            originalProcessResult(gameRecord);
        };
    }
}

// Экспортируем функции
window.botModule = {
    gameBot,
    makeBotMove,
    initBot,
    getBotStats: () => gameBot.getStats()
};

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initBot, 1000);
});