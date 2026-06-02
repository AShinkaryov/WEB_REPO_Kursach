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
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
  }

  // Check if already logged in
  checkAuth();
});

/* ── Login Handler ───────────────────────────────────────── */
function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const role = document.getElementById('login-role').value;

  // Get users from localStorage
  const users = JSON.parse(localStorage.getItem('ami-users') || '[]');
  
  // Find user
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    showError('Неверный email или пароль');
    return;
  }

  // Check role match
  if (user.role !== role) {
    showError('Неверная роль пользователя');
    return;
  }

  // Save session
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
  
  // Redirect based on role
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

  // Validation
  if (password !== confirm) {
    showError('Пароли не совпадают');
    return;
  }

  if (password.length < 6) {
    showError('Пароль должен быть не менее 6 символов');
    return;
  }

  // Get existing users
  const users = JSON.parse(localStorage.getItem('ami-users') || '[]');
  
  // Check if email exists
  if (users.find(u => u.email === email)) {
    showError('Пользователь с таким email уже существует');
    return;
  }

  // Create new user
  const newUser = {
    id: Date.now().toString(),
    name,
    email,
    phone,
    password, // In production, hash this!
    role,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  localStorage.setItem('ami-users', JSON.stringify(users));

  showSuccess('Регистрация успешна! Выполняется вход...');
  
  // Auto login
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
  let errorEl = form.querySelector('.form-error');
  
  if (!errorEl) {
    errorEl = document.createElement('div');
    errorEl.className = 'form-error';
    form.insertBefore(errorEl, form.firstChild);
  }
  
  errorEl.textContent = message;
  errorEl.classList.add('show');
  
  setTimeout(() => errorEl.classList.remove('show'), 5000);
}

function showSuccess(message) {
  const form = document.querySelector('.auth-form');
  let successEl = form.querySelector('.form-success');
  
  if (!successEl) {
    successEl = document.createElement('div');
    successEl.className = 'form-success';
    form.insertBefore(successEl, form.firstChild);
  }
  
  successEl.textContent = message;
  successEl.classList.add('show');
}

/* ── Check Auth Status ───────────────────────────────────── */
function checkAuth() {
  const session = JSON.parse(localStorage.getItem('ami-session') || 'null');
  
  if (session) {
    // User is logged in
    updateUserInterface(session);
  }
}

/* ── Update UI Based on Auth ─────────────────────────────── */
function updateUserInterface(session) {
  if (!session) return;
  
  // Ищем или создаем контейнер для авторизации
  let authDiv = document.querySelector('.sidebar__auth');
  
  if (!authDiv) {
    // Создаем, если не существует
    authDiv = document.createElement('div');
    authDiv.className = 'sidebar__auth';
    
    // Вставляем после языков или перед соцсетями
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      const langs = sidebar.querySelector('.sidebar__langs');
      if (langs) {
        langs.after(authDiv);
      } else {
        sidebar.appendChild(authDiv);
      }
    }
  }

  // Проверяем роль и показываем соответствующий интерфейс
  if (session.role === ROLES.ADMIN) {
    authDiv.innerHTML = `
      <a href="admin.html" class="sidebar__nav-item sidebar__nav-item--admin" style="background: #A7BB61; color: #fff; margin-bottom: 10px;">
        ⚙️ АДМИН ПАНЕЛЬ
      </a>
      <div class="sidebar__user-info" style="padding: 10px; background: #f8f8f8; border-radius: 6px; margin-top: 10px;">
        <div style="font-size: 13px; color: #7B7B7B; margin-bottom: 4px;">${session.name}</div>
        <div style="font-size: 11px; color: #E8593A; font-weight: 600;">Администратор</div>
        <button class="sidebar__logout" onclick="auth.logout()" style="margin-top: 8px; padding: 6px 12px; background: #E8593A; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; width: 100%;">Выйти</button>
      </div>
    `;
  } else if (session.role === ROLES.USER) {
    authDiv.innerHTML = `
      <div class="sidebar__user-info" style="padding: 10px; background: #f8f8f8; border-radius: 6px;">
        <div style="font-size: 13px; color: #423F3E; margin-bottom: 4px;">👤 ${session.name}</div>
        <button class="sidebar__logout" onclick="auth.logout()" style="margin-top: 8px; padding: 6px 12px; background: #E8593A; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; width: 100%;">Выйти</button>
      </div>
    `;
  }
  
  console.log('✅ UI обновлен для пользователя:', session);
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
window.auth = {
  getCurrentUser,
  hasRole,
  requireAuth,
  logout
};