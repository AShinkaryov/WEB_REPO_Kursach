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
/* ── Update UI Based on Auth ─────────────────────────────── */
function updateUserInterface() {
  console.log('🔄 updateUserInterface вызвана');
  
  const session = JSON.parse(localStorage.getItem('ami-session') || 'null');
  console.log('📋 Session:', session);
  
  if (!session) {
    console.log('⚠️ Нет сессии, пропускаем');
    return;
  }
  
  // Ждем загрузки DOM
  setTimeout(() => {
    console.log('🔍 Ищу sidebar...');
    let authDiv = document.querySelector('.sidebar__auth');
    const sidebar = document.querySelector('.sidebar');
    
    console.log('Sidebar найден:', !!sidebar);
    console.log('Auth div существует:', !!authDiv);
    
    if (sidebar && !authDiv) {
      console.log('➕ Создаю sidebar__auth');
      authDiv = document.createElement('div');
      authDiv.className = 'sidebar__auth';
      authDiv.style.cssText = 'margin-top: 20px; padding: 0 20px;';
      
      const langs = sidebar.querySelector('.sidebar__langs');
      if (langs) {
        console.log('📍 Вставляю после языков');
        langs.after(authDiv);
      } else {
        console.log('📍 Вставляю в конец sidebar');
        const social = sidebar.querySelector('.sidebar__social');
        if (social) {
          social.before(authDiv);
        } else {
          sidebar.appendChild(authDiv);
        }
      }
    }
    
    if (authDiv) {
      console.log('✅ authDiv готов, заполняю...');
      console.log('Роль пользователя:', session.role);
      
      if (session.role === 'admin') {
        console.log('👤 Показываю АДМИН интерфейс');
        authDiv.innerHTML = `
          <div style="background: #A7BB61; padding: 12px; border-radius: 8px; margin-bottom: 12px;">
            <a href="admin.html" style="display: block; text-align: center; color: #fff; text-decoration: none; font-weight: 700; font-size: 14px; margin-bottom: 8px;">
              ⚙️ АДМИН ПАНЕЛЬ
            </a>
          </div>
          <div style="background: #f8f8f8; padding: 12px; border-radius: 8px;">
            <div style="font-size: 13px; color: #423F3E; margin-bottom: 4px; font-weight: 600;">${session.name}</div>
            <div style="font-size: 11px; color: #E8593A; margin-bottom: 10px;">⚙️ Администратор</div>
            <button onclick="auth.logout()" style="width: 100%; padding: 8px; background: #E8593A; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; transition: opacity 0.2s;">
              Выйти
            </button>
          </div>
        `;
      } else if (session.role === 'user') {
        console.log('👤 Показываю ПОЛЬЗОВАТЕЛЬ интерфейс');
        authDiv.innerHTML = `
          <div style="background: #f8f8f8; padding: 12px; border-radius: 8px;">
            <div style="font-size: 13px; color: #423F3E; margin-bottom: 4px; font-weight: 600;">👤 ${session.name}</div>
            <div style="font-size: 11px; color: #7B7B7B; margin-bottom: 10px;">Покупатель</div>
            <button onclick="auth.logout()" style="width: 100%; padding: 8px; background: #E8593A; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; transition: opacity 0.2s;">
              Выйти
            </button>
          </div>
        `;
      }
      
      console.log('✅ UI обновлен!');
    } else {
      console.error('❌ Не удалось создать authDiv');
    }
  }, 500);
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