/**
 * AMI Authentication System
 */

// User roles
const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  GUEST: 'guest'
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('🔐 Auth module loaded');
  console.log('Current session:', localStorage.getItem('ami-session'));
  
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
  }

  checkAuth();
});

/* ── Login Handler ───────────────────────────────────────── */
function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const role = document.getElementById('login-role').value;

  const users = JSON.parse(localStorage.getItem('ami-users') || '[]');
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    showError('Неверный email или пароль');
    return;
  }

  if (user.role !== role) {
    showError('Неверная роль пользователя');
    return;
  }

  const session = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    loginTime: new Date().toISOString()
  };

  localStorage.setItem('ami-session', JSON.stringify(session));
  showSuccess('Вход выполнен успешно!');
  
  setTimeout(() => {
    if (role === ROLES.ADMIN) {
      window.location.href = 'admin.html';
    } else {
      window.location.href = 'catalog.html';
    }
  }, 1000);
}

/* ── Register Handler ────────────────────────────────────── */
function handleRegister(e) {
  e.preventDefault();
  
  const name = document.getElementById('register-name').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const phone = document.getElementById('register-phone').value.trim();
  const password = document.getElementById('register-password').value;
  const confirm = document.getElementById('register-confirm').value;
  const role = document.getElementById('register-role').value;

  if (password !== confirm) {
    showError('Пароли не совпадают');
    return;
  }

  if (password.length < 6) {
    showError('Пароль должен быть не менее 6 символов');
    return;
  }

  const users = JSON.parse(localStorage.getItem('ami-users') || '[]');
  
  if (users.find(u => u.email === email)) {
    showError('Пользователь с таким email уже существует');
    return;
  }

  const newUser = {
    id: Date.now().toString(),
    name,
    email,
    phone,
    password,
    role,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  localStorage.setItem('ami-users', JSON.stringify(users));

  showSuccess('Регистрация успешна! Выполняется вход...');
  
  setTimeout(() => {
    const session = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      phone: newUser.phone,
      loginTime: new Date().toISOString()
    };
    
    localStorage.setItem('ami-session', JSON.stringify(session));
    window.location.href = 'catalog.html';
  }, 1500);
}

/* ── Helper Functions ────────────────────────────────────── */
function showError(message) {
  const form = document.querySelector('.auth-form');
  let errorEl = form?.querySelector('.form-error');
  
  if (!errorEl) {
    errorEl = document.createElement('div');
    errorEl.className = 'form-error';
    form?.insertBefore(errorEl, form.firstChild);
  }
  
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.add('show');
    setTimeout(() => errorEl.classList.remove('show'), 5000);
  }
}

function showSuccess(message) {
  const form = document.querySelector('.auth-form');
  let successEl = form?.querySelector('.form-success');
  
  if (!successEl) {
    successEl = document.createElement('div');
    successEl.className = 'form-success';
    form?.insertBefore(successEl, form.firstChild);
  }
  
  if (successEl) {
    successEl.textContent = message;
    successEl.classList.add('show');
  }
}

/* ── Check Auth Status ───────────────────────────────────── */
function checkAuth() {
  const session = JSON.parse(localStorage.getItem('ami-session') || 'null');
  if (session) {
    updateUserInterface();
  }
}

/* ── Update UI Based on Auth ─────────────────────────────── */
/* ── Update UI Based on Auth ─────────────────────────────── */
function updateUserInterface() {
  console.log('🔄 updateUserInterface вызвана');
  
  const session = JSON.parse(localStorage.getItem('ami-session') || 'null');
  if (!session) return;
  
  console.log('📋 Session:', session);
  
  // 🔥 ДОБАВЛЯЕМ КЛАСС НА BODY ДЛЯ АДМИНА
  if (session.role === 'admin') {
    document.body.classList.add('admin-mode');
    console.log('✅ Добавлен класс admin-mode на body');
  } else {
    document.body.classList.remove('admin-mode');
  }
  
  setTimeout(() => {
    let authDiv = document.querySelector('.sidebar__auth');
    const sidebar = document.querySelector('.sidebar');
    
    if (authDiv) authDiv.remove();
    
    if (!sidebar) return;
    
    authDiv = document.createElement('div');
    authDiv.className = 'sidebar__auth';
    
    const nav = sidebar.querySelector('.sidebar__nav');
    if (nav) {
      nav.after(authDiv);
    } else {
      const icons = sidebar.querySelector('.sidebar__icons');
      if (icons) icons.before(authDiv);
      else sidebar.appendChild(authDiv);
    }
    
    // Управление видимостью иконок корзины/избранного
    const iconsContainer = sidebar.querySelector('.sidebar__icons');
    if (iconsContainer) {
      if (session.role === 'admin') {
        iconsContainer.style.display = 'none';
      } else {
        iconsContainer.style.display = 'flex';
      }
    }
    
    if (session.role === 'admin') {
      authDiv.innerHTML = `
        <div class="admin-panel-card">
          <a href="admin.html" class="admin-panel-btn">
            <span class="admin-panel-btn__icon">⚙️</span>
            <span>АДМИН ПАНЕЛЬ</span>
          </a>
        </div>
        <div class="user-info-card">
          <div class="user-info__avatar">👑</div>
          <div class="user-info__body">
            <div class="user-info__name">${session.name}</div>
            <div class="user-info__role">Администратор</div>
            <div class="user-info__email">${session.email}</div>
          </div>
        </div>
        <button class="logout-btn" id="logout-btn">
          <span>🚪</span>
          <span>Выйти</span>
        </button>
      `;
    } else if (session.role === 'user') {
      authDiv.innerHTML = `
        <div class="user-info-card">
          <div class="user-info__avatar"></div>
          <div class="user-info__body">
            <div class="user-info__name">${session.name}</div>
            <div class="user-info__role">Покупатель</div>
            <div class="user-info__email">${session.email}</div>
          </div>
        </div>
        <button class="logout-btn" id="logout-btn">
          <span>🚪</span>
          <span>Выйти</span>
        </button>
      `;
    }
    
    const logoutBtn = authDiv.querySelector('#logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log(' Выход из системы');
        localStorage.removeItem('ami-session');
        document.body.classList.remove('admin-mode');
        window.location.href = 'login.html';
      });
    }
    
    console.log('✅ UI обновлен!');
  }, 300);
}

/* ── Logout ──────────────────────────────────────────────── */
function logout() {
  localStorage.removeItem('ami-session');
  window.location.href = 'login.html';
}

/* ── Get Current User ────────────────────────────────────── */
function getCurrentUser() {
  return JSON.parse(localStorage.getItem('ami-session') || 'null');
}

/* ── Check Role ──────────────────────────────────────────── */
function hasRole(role) {
  const user = getCurrentUser();
  return user && user.role === role;
}

/* ── Protect Page ────────────────────────────────────────── */
function requireAuth(requiredRole = null) {
  const user = getCurrentUser();
  
  if (!user) {
    window.location.href = 'login.html';
    return false;
  }
  
  if (requiredRole && user.role !== requiredRole) {
    window.location.href = 'catalog.html';
    return false;
  }
  
  return true;
}

// Export functions
// Export functions
window.auth = {
  getCurrentUser,
  hasRole,
  requireAuth,
  logout,
  updateUserInterface  // 🔥 ДОБАВИЛ ЭТУ СТРОКУ
};


/* ── Login as Guest ──────────────────────────────────────── */
function loginAsGuest() {
  console.log('👤 Вход как ГОСТЬ');
  localStorage.removeItem('ami-session');
  window.location.href = 'catalog.html';
}