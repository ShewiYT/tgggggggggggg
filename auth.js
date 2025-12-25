// Система авторизации и управления ролями

const ADMIN_CREDENTIALS = {
    username: 'KovalchukAdmin',
    password: '99Adidas.Shewi12011979'
};

// Проверка авторизации
function checkAuth() {
    return localStorage.getItem('currentUserId') !== null;
}

// Вход в систему
function login(username, password) {
    // Проверка администратора
    if (username === ADMIN_CREDENTIALS.username && 
        password === ADMIN_CREDENTIALS.password) {
        
        const adminUser = {
            id: 0,
            username: ADMIN_CREDENTIALS.username,
            isAdmin: true,
            isPartner: true,
            realBalance: 100000,
            gameBalance: 100000,
            totalWins: 999,
            totalGames: 1000
        };
        
        setCurrentUser(adminUser);
        return adminUser;
    }
    
    // Проверка обычных пользователей
    const user = getUserByCredentials(username, password);
    if (user) {
        setCurrentUser(user);
        return user;
    }
    
    // Создание нового пользователя
    const newUser = createUser(username, password);
    setCurrentUser(newUser);
    return newUser;
}

// Выход из системы
function logout() {
    localStorage.removeItem('currentUserId');
    window.location.href = 'index.html';
}

// Проверка прав администратора
function isAdmin() {
    const user = getCurrentUser();
    return user && user.isAdmin === true;
}

// Проверка прав партнёра
function isPartner() {
    const user = getCurrentUser();
    return user && user.isPartner === true;
}

// Показ/скрытие элементов в зависимости от роли
function updateUIByRole() {
    const user = getCurrentUser();
    
    // Админ-панель
    const adminBtn = document.getElementById('adminBtn');
    if (adminBtn) {
        adminBtn.style.display = user && user.isAdmin ? 'block' : 'none';
    }
    
    // Партнёр-панель
    const partnerBtn = document.getElementById('partnerBtn');
    if (partnerBtn) {
        partnerBtn.style.display = user && user.isPartner ? 'block' : 'none';
    }
}

// Форма входа (если не используется Telegram Web App)
function showLoginModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Вход в систему</h2>
            <div class="form-group">
                <label for="loginUsername">Имя пользователя</label>
                <input type="text" id="loginUsername" placeholder="Введите имя пользователя">
            </div>
            <div class="form-group">
                <label for="loginPassword">Пароль</label>
                <input type="password" id="loginPassword" placeholder="Введите пароль">
            </div>
            <div class="modal-actions">
                <button class="btn-secondary" id="cancelLogin">Отмена</button>
                <button class="btn-primary" id="confirmLogin">Войти</button>
            </div>
            <p style="margin-top: 16px; text-align: center; color: var(--text-secondary);">
                Если вас нет в системе, будет создан новый аккаунт
            </p>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Обработчики событий
    document.getElementById('cancelLogin').addEventListener('click', () => {
        modal.remove();
    });
    
    document.getElementById('confirmLogin').addEventListener('click', () => {
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        
        if (username && password) {
            const user = login(username, password);
            if (user) {
                modal.remove();
                updateUIByRole();
                updateBalanceDisplay();
                showNotification('Вход выполнен успешно!', 'success');
            }
        } else {
            showNotification('Заполните все поля', 'error');
        }
    });
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    // Если используется Telegram Web App, автоматический вход
    if (window.Telegram && Telegram.WebApp) {
        const tgUser = Telegram.WebApp.initDataUnsafe.user;
        if (tgUser) {
            const username = tgUser.username || `user_${tgUser.id}`;
            const password = tgUser.id.toString();
            
            let user = getUserByCredentials(username, password);
            if (!user) {
                user = createUser(username, password);
            }
            
            setCurrentUser(user);
        }
    }
    
    // Обновляем UI по ролям
    updateUIByRole();
});

// Экспортируем функции
window.authModule = {
    checkAuth,
    login,
    logout,
    isAdmin,
    isPartner,
    updateUIByRole
};