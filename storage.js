// Система хранения данных в LocalStorage

const USERS_KEY = 'ticTacToeUsers';
const GAMES_KEY = 'ticTacToeGames';
const TRANSACTIONS_KEY = 'ticTacToeTransactions';
const BOT_FUND_KEY = 'botCommissionFund';
const COMMISSION_HISTORY_KEY = 'commissionHistory';

// Инициализация хранилища
function initStorage() {
    // Проверяем существование данных
    if (!localStorage.getItem(USERS_KEY)) {
        const defaultUsers = [
            {
                id: 1,
                username: 'KovalchukAdmin',
                password: '99Adidas.Shewi12011979',
                isAdmin: true,
                isPartner: false,
                realBalance: 10000,
                gameBalance: 5000,
                totalWins: 0,
                totalGames: 0,
                totalCommissionPaid: 0,
                commissionHistory: []
            }
        ];
        localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
    }
    
    if (!localStorage.getItem(GAMES_KEY)) {
        localStorage.setItem(GAMES_KEY, JSON.stringify([]));
    }
    
    if (!localStorage.getItem(TRANSACTIONS_KEY)) {
        localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify([]));
    }
}

// Работа с пользователями
function getUsers() {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
}

function getUserById(id) {
    const users = getUsers();
    return users.find(user => user.id === id);
}

function getUserByCredentials(username, password) {
    const users = getUsers();
    return users.find(user => 
        user.username === username && user.password === password
    );
}

function getCurrentUser() {
    const userId = localStorage.getItem('currentUserId');
    if (userId) {
        return getUserById(parseInt(userId));
    }
    return null;
}

function setCurrentUser(user) {
    if (user && user.id) {
        localStorage.setItem('currentUserId', user.id.toString());
    }
}

function updateUser(updatedUser) {
    const users = getUsers();
    const index = users.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
        users[index] = updatedUser;
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
}

function createUser(username, password) {
    const users = getUsers();
    const newUser = {
        id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
        username,
        password,
        isAdmin: false,
        isPartner: false,
        realBalance: 0,
        gameBalance: 1000, // Стартовый бонус
        totalWins: 0,
        totalGames: 0,
        totalCommissionPaid: 0,
        commissionHistory: [],
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return newUser;
}

// Работа с играми
function saveGame(gameData) {
    const games = getGames();
    games.push(gameData);
    localStorage.setItem(GAMES_KEY, JSON.stringify(games));
    return gameData;
}

function getGames() {
    return JSON.parse(localStorage.getItem(GAMES_KEY)) || [];
}

function getUserGames(userId) {
    const games = getGames();
    return games.filter(game => 
        game.playerXId === userId || game.playerOId === userId
    );
}

// Работа с транзакциями
function saveTransaction(transaction) {
    const transactions = getTransactions();
    transactions.push({
        id: transactions.length + 1,
        ...transaction,
        timestamp: new Date().toISOString()
    });
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
    return transaction;
}

function getTransactions() {
    return JSON.parse(localStorage.getItem(TRANSACTIONS_KEY)) || [];
}

function getUserTransactions(userId) {
    const transactions = getTransactions();
    return transactions.filter(t => t.userId === userId);
}

// Работа с балансами
function getRealBalance() {
    const user = getCurrentUser();
    return user ? user.realBalance : 0;
}

function updateRealBalance(amount) {
    const user = getCurrentUser();
    if (user) {
        user.realBalance += amount;
        updateUser(user);
        return user.realBalance;
    }
    return 0;
}

function getGameBalance() {
    const user = getCurrentUser();
    return user ? user.gameBalance : 0;
}

function updateGameBalance(amount) {
    const user = getCurrentUser();
    if (user) {
        user.gameBalance += amount;
        updateUser(user);
        return user.gameBalance;
    }
    return 0;
}

// Обновление статистики пользователя
function updateUserStats(gameRecord) {
    const user = getCurrentUser();
    if (!user) return;
    
    user.totalGames = (user.totalGames || 0) + 1;
    
    if (gameRecord.result === 'win') {
        user.totalWins = (user.totalWins || 0) + 1;
    }
    
    updateUser(user);
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', initStorage);