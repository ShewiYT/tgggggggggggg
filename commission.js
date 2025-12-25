// Система комиссий для бота

const COMMISSION_RATE = 0.05; // 5%
const BOT_FUND_KEY = 'botCommissionFund';
const COMMISSION_HISTORY_KEY = 'commissionHistory';

// Расчёт комиссии бота (5% от двойного размера ставки)
function calculateCommission(stake) {
    const totalWin = stake * 2;
    const commission = totalWin * COMMISSION_RATE;
    const userWinnings = totalWin - commission;
    return [userWinnings, commission];
}

// Проверка условий для взимания комиссии
function shouldApplyCommission(balanceType, result, opponent) {
    return balanceType === 'Реальный' && result === 'Выигрыш' && opponent !== 'Бот';
}

// Обновить фонд комиссий бота
function updateBotCommissionFund(commission, gameRecord) {
    let fund = getBotCommissionFund();
    const history = getCommissionHistory();
    
    // Добавляем комиссию в фонд
    fund.total += commission;
    fund.daily += commission;
    fund.weekly += commission;
    fund.monthly += commission;
    
    // Добавляем запись в историю
    const record = {
        id: Date.now(),
        gameId: gameRecord.id,
        userId: getCurrentUser()?.id,
        username: getCurrentUser()?.username || 'Игрок',
        amount: commission,
        stake: gameRecord.stake,
        timestamp: new Date().toISOString(),
        gameMode: gameRecord.mode
    };
    
    history.push(record);
    
    // Сохраняем обновленные данные
    localStorage.setItem(BOT_FUND_KEY, JSON.stringify(fund));
    localStorage.setItem(COMMISSION_HISTORY_KEY, JSON.stringify(history));
    
    // Обновляем статистику пользователя
    updateUserCommissionStats(commission);
    
    return fund;
}

// Получить текущий фонд комиссий
function getBotCommissionFund() {
    const fund = localStorage.getItem(BOT_FUND_KEY);
    if (fund) {
        return JSON.parse(fund);
    }
    
    // Создаем новый фонд, если его нет
    const newFund = {
        total: 0,
        daily: 0,
        weekly: 0,
        monthly: 0,
        lastReset: new Date().toISOString()
    };
    
    localStorage.setItem(BOT_FUND_KEY, JSON.stringify(newFund));
    return newFund;
}

// Получить историю комиссий
function getCommissionHistory() {
    const history = localStorage.getItem(COMMISSION_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
}

// Получить статистику комиссий
function getCommissionStats() {
    const history = getCommissionHistory();
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const dailyCommissions = history.filter(record => 
        new Date(record.timestamp) > oneDayAgo
    );
    
    const weeklyCommissions = history.filter(record => 
        new Date(record.timestamp) > oneWeekAgo
    );
    
    const monthlyCommissions = history.filter(record => 
        new Date(record.timestamp) > oneMonthAgo
    );
    
    const totalGames = history.length;
    const totalCommission = history.reduce((sum, record) => sum + record.amount, 0);
    
    // Статистика по пользователям
    const userStats = {};
    history.forEach(record => {
        if (!userStats[record.userId]) {
            userStats[record.userId] = {
                username: record.username,
                totalCommission: 0,
                totalGames: 0,
                totalStake: 0
            };
        }
        userStats[record.userId].totalCommission += record.amount;
        userStats[record.userId].totalGames += 1;
        userStats[record.userId].totalStake += record.stake;
    });
    
    // Топ пользователей по комиссии
    const topUsers = Object.values(userStats)
        .sort((a, b) => b.totalCommission - a.totalCommission)
        .slice(0, 10);
    
    return {
        totalCommission,
        totalGames,
        averageCommission: totalGames > 0 ? totalCommission / totalGames : 0,
        dailyTotal: dailyCommissions.reduce((sum, r) => sum + r.amount, 0),
        dailyCount: dailyCommissions.length,
        weeklyTotal: weeklyCommissions.reduce((sum, r) => sum + r.amount, 0),
        weeklyCount: weeklyCommissions.length,
        monthlyTotal: monthlyCommissions.reduce((sum, r) => sum + r.amount, 0),
        monthlyCount: monthlyCommissions.length,
        topUsers,
        history: history.slice(-100) // Последние 100 записей
    };
}

// Обновить статистику комиссий пользователя
function updateUserCommissionStats(commission) {
    const user = getCurrentUser();
    if (!user) return;
    
    user.totalCommissionPaid = (user.totalCommissionPaid || 0) + commission;
    user.commissionHistory = user.commissionHistory || [];
    
    user.commissionHistory.push({
        amount: commission,
        timestamp: new Date().toISOString()
    });
    
    updateUser(user);
}

// Получить динамику комиссий пользователя
function getUserCommissionTrend(userId) {
    const user = getUserById(userId) || getCurrentUser();
    if (!user || !user.commissionHistory) return [];
    
    // Группируем по дням
    const dailyStats = {};
    user.commissionHistory.forEach(record => {
        const date = new Date(record.timestamp).toDateString();
        if (!dailyStats[date]) {
            dailyStats[date] = 0;
        }
        dailyStats[date] += record.amount;
    });
    
    // Преобразуем в массив для графика
    return Object.entries(dailyStats)
        .map(([date, amount]) => ({ date, amount }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));
}

// Сбросить дневную статистику (вызывается раз в день)
function resetDailyStats() {
    const fund = getBotCommissionFund();
    const lastReset = new Date(fund.lastReset);
    const now = new Date();
    
    // Если прошло больше дня
    if (now.getDate() !== lastReset.getDate()) {
        fund.daily = 0;
        
        // Если прошла неделя
        const daysSinceReset = Math.floor((now - lastReset) / (1000 * 60 * 60 * 24));
        if (daysSinceReset >= 7) {
            fund.weekly = 0;
        }
        
        // Если прошел месяц
        if (daysSinceReset >= 30) {
            fund.monthly = 0;
        }
        
        fund.lastReset = now.toISOString();
        localStorage.setItem(BOT_FUND_KEY, JSON.stringify(fund));
    }
}

// Инициализация системы комиссий
function initCommissionSystem() {
    resetDailyStats();
    
    // Запускаем периодический сброс
    setInterval(resetDailyStats, 60 * 60 * 1000); // Каждый час
}

// Экспортируем функции
window.commissionModule = {
    calculateCommission,
    shouldApplyCommission,
    updateBotCommissionFund,
    getBotCommissionFund,
    getCommissionStats,
    getUserCommissionTrend,
    initCommissionSystem
};

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initCommissionSystem, 1000);
});