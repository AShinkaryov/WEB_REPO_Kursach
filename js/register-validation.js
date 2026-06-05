/**
 * AMI Register Validation — Полная валидация регистрации по Приложению В
 */

const RegisterValidation = (() => {
  // Состояние
  const state = {
    passwordMode: 'manual', // 'manual' или 'auto'
    nicknameAttempts: 0,
    maxNicknameAttempts: 5,
    autoPassword: '',
    validationState: {
      fullname: false,
      email: false,
      phone: false,
      birthdate: false,
      nickname: false,
      password: false,
      confirm: false,
      agreement: false
    }
  };

  // Инициализация
  function init() {
    console.log('🔐 Register validation initialized');
    
    setupPasswordModeSelector();
    setupFieldListeners();
    setupNicknameGenerator();
    setupAgreementCheckbox();
    setupFormSubmit();
    setMaxBirthdate();
    
    // Первоначальная проверка
    checkFormValidity();
  }

  // ═══════════════════════════════════════════════════════════
  // ВЫБОР СПОСОБА ПАРОЛЯ
  // ═══════════════════════════════════════════════════════════
  function setupPasswordModeSelector() {
    document.querySelectorAll('.password-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.password-mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        state.passwordMode = btn.dataset.mode;
        
        if (state.passwordMode === 'manual') {
          document.getElementById('manual-password-section').style.display = 'block';
          document.getElementById('auto-password-section').style.display = 'none';
          state.validationState.password = false;
          state.validationState.confirm = false;
        } else {
          document.getElementById('manual-password-section').style.display = 'none';
          document.getElementById('auto-password-section').style.display = 'block';
          generateAutoPassword();
        }
        
        checkFormValidity();
      });
    });
  }

  // ═══════════════════════════════════════════════════════════
  // АВТОГЕНЕРАЦИЯ ПАРОЛЯ
  // ═══════════════════════════════════════════════════════════
  function generateAutoPassword() {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const digits = '0123456789';
    const special = '!@#$%^&*';
    const all = upper + lower + digits + special;
    
    let password = '';
    
    // Гарантируем наличие всех типов символов
    password += upper[Math.floor(Math.random() * upper.length)];
    password += lower[Math.floor(Math.random() * lower.length)];
    password += digits[Math.floor(Math.random() * digits.length)];
    password += special[Math.floor(Math.random() * special.length)];
    
    // Добавляем случайные символы до длины 12
    for (let i = 4; i < 12; i++) {
      password += all[Math.floor(Math.random() * all.length)];
    }
    
    // Перемешиваем
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    
    state.autoPassword = password;
    document.getElementById('auto-password-display').textContent = password;
    document.getElementById('auto-password-value').value = password;
    
    state.validationState.password = true;
    state.validationState.confirm = true;
    checkFormValidity();
  }

  // ═══════════════════════════════════════════════════════════
  // ОБРАБОТЧИКИ ПОЛЕЙ
  // ═══════════════════════════════════════════════════════════
  function setupFieldListeners() {
    // ФИО
    const fullname = document.getElementById('register-fullname');
    if (fullname) {
      fullname.addEventListener('input', () => {
        validateFullname();
        clearError('fullname');
        checkFormValidity();
      });
      fullname.addEventListener('blur', validateFullname);
    }
    
    // Email
    const email = document.getElementById('register-email');
    if (email) {
      email.addEventListener('input', () => {
        validateEmail();
        clearError('email');
        checkFormValidity();
      });
      email.addEventListener('blur', validateEmail);
    }
    
    // Телефон
    const phone = document.getElementById('register-phone');
    if (phone) {
      phone.addEventListener('input', (e) => {
        // Форматирование +375 (XX) XXX-XX-XX
        formatPhone(e.target);
        validatePhone();
        clearError('phone');
        checkFormValidity();
      });
      phone.addEventListener('blur', validatePhone);
    }
    
    // Дата рождения
    const birthdate = document.getElementById('register-birthdate');
    if (birthdate) {
      birthdate.addEventListener('change', () => {
        validateBirthdate();
        clearError('birthdate');
        checkFormValidity();
      });
    }
    
    // Никнейм
    const nickname = document.getElementById('register-nickname');
    if (nickname) {
      nickname.addEventListener('input', () => {
        validateNickname();
        clearError('nickname');
        checkFormValidity();
      });
      nickname.addEventListener('blur', validateNickname);
    }
    
    // Пароль
    const password = document.getElementById('register-password');
    if (password) {
      password.addEventListener('input', () => {
        validatePassword();
        clearError('password');
        if (document.getElementById('register-confirm').value) {
          validateConfirm();
        }
        checkFormValidity();
      });
      password.addEventListener('blur', validatePassword);
    }
    
    // Подтверждение пароля
    const confirm = document.getElementById('register-confirm');
    if (confirm) {
      confirm.addEventListener('input', () => {
        validateConfirm();
        clearError('confirm');
        checkFormValidity();
      });
      confirm.addEventListener('blur', validateConfirm);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // ВАЛИДАЦИЯ ПОЛЕЙ
  // ═══════════════════════════════════════════════════════════
  
  // ФИО
  function validateFullname() {
    const input = document.getElementById('register-fullname');
    const value = input.value.trim();
    
    if (!value) {
      state.validationState.fullname = false;
      return false;
    }
    
    // Минимум 2 слова (имя и фамилия), отчество опционально
    const parts = value.split(/\s+/);
    if (parts.length < 2) {
      showError('fullname', 'Введите имя и фамилию');
      input.classList.add('invalid');
      input.classList.remove('valid');
      state.validationState.fullname = false;
      return false;
    }
    
    // Проверка что все части — буквы
    const cyrillicRegex = /^[А-Яа-яЁёA-Za-z-]+$/;
    for (const part of parts) {
      if (!cyrillicRegex.test(part)) {
        showError('fullname', 'ФИО должно содержать только буквы');
        input.classList.add('invalid');
        input.classList.remove('valid');
        state.validationState.fullname = false;
        return false;
      }
    }
    
    clearError('fullname');
    input.classList.remove('invalid');
    input.classList.add('valid');
    state.validationState.fullname = true;
    return true;
  }

  // Email
  function validateEmail() {
    const input = document.getElementById('register-email');
    const value = input.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!value) {
      state.validationState.email = false;
      return false;
    }
    
    if (!emailRegex.test(value)) {
      showError('email', 'Некорректный email');
      input.classList.add('invalid');
      input.classList.remove('valid');
      state.validationState.email = false;
      return false;
    }
    
    clearError('email');
    input.classList.remove('invalid');
    input.classList.add('valid');
    state.validationState.email = true;
    return true;
  }

  // Телефон
  function validatePhone() {
    const input = document.getElementById('register-phone');
    const value = input.value.replace(/\D/g, '');
    
    if (!value) {
      state.validationState.phone = false;
      return false;
    }
    
    // Должен начинаться с 375 и содержать 12 цифр
    if (!value.startsWith('375') || value.length !== 12) {
      showError('phone', 'Телефон должен быть в формате +375 (XX) XXX-XX-XX');
      input.classList.add('invalid');
      input.classList.remove('valid');
      state.validationState.phone = false;
      return false;
    }
    
    clearError('phone');
    input.classList.remove('invalid');
    input.classList.add('valid');
    state.validationState.phone = true;
    return true;
  }

  // Форматирование телефона
  function formatPhone(input) {
    let value = input.value.replace(/\D/g, '');
    
    // Если не начинается с 375, добавляем
    if (value.length > 0 && !value.startsWith('375')) {
      if (value.startsWith('80')) {
        value = '375' + value.substring(2);
      } else if (value.startsWith('8')) {
        value = '375' + value.substring(1);
      }
    }
    
    // Форматируем: +375 (XX) XXX-XX-XX
    let formatted = '';
    if (value.length > 0) formatted = '+' + value.substring(0, 3);
    if (value.length > 3) formatted += ' (' + value.substring(3, 5);
    if (value.length > 5) formatted += ') ' + value.substring(5, 8);
    if (value.length > 8) formatted += '-' + value.substring(8, 10);
    if (value.length > 10) formatted += '-' + value.substring(10, 12);
    
    input.value = formatted;
  }

  // Дата рождения (16+)
  function validateBirthdate() {
    const input = document.getElementById('register-birthdate');
    const value = input.value;
    
    if (!value) {
      state.validationState.birthdate = false;
      return false;
    }
    
    const birthdate = new Date(value);
    const today = new Date();
    let age = today.getFullYear() - birthdate.getFullYear();
    const monthDiff = today.getMonth() - birthdate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthdate.getDate())) {
      age--;
    }
    
    if (age < 16) {
      showError('birthdate', `Вам должно быть не менее 16 лет (сейчас: ${age})`);
      input.classList.add('invalid');
      input.classList.remove('valid');
      state.validationState.birthdate = false;
      return false;
    }
    
    if (age > 120) {
      showError('birthdate', 'Некорректная дата рождения');
      input.classList.add('invalid');
      input.classList.remove('valid');
      state.validationState.birthdate = false;
      return false;
    }
    
    clearError('birthdate');
    input.classList.remove('invalid');
    input.classList.add('valid');
    state.validationState.birthdate = true;
    return true;
  }

  // Максимальная дата (16 лет назад)
  function setMaxBirthdate() {
    const input = document.getElementById('register-birthdate');
    if (input) {
      const today = new Date();
      const maxDate = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());
      input.max = maxDate.toISOString().split('T')[0];
    }
  }

  // Никнейм
  function validateNickname() {
    const input = document.getElementById('register-nickname');
    const value = input.value.trim();
    
    if (!value) {
      state.validationState.nickname = false;
      return false;
    }
    
    if (value.length < 3 || value.length > 20) {
      showError('nickname', 'Никнейм должен быть от 3 до 20 символов');
      input.classList.add('invalid');
      input.classList.remove('valid');
      state.validationState.nickname = false;
      return false;
    }
    
    // Только латиница, цифры, _ и -
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
      showError('nickname', 'Только латинские буквы, цифры, _ и -');
      input.classList.add('invalid');
      input.classList.remove('valid');
      state.validationState.nickname = false;
      return false;
    }
    
    clearError('nickname');
    input.classList.remove('invalid');
    input.classList.add('valid');
    state.validationState.nickname = true;
    return true;
  }

  // Пароль
  function validatePassword() {
    const input = document.getElementById('register-password');
    const value = input.value;
    
    const hasLength = value.length >= 8 && value.length <= 20;
    const hasUpper = /[A-ZА-Я]/.test(value);
    const hasLower = /[a-zа-я]/.test(value);
    const hasDigit = /\d/.test(value);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);
    
    // Обновляем индикаторы требований
    updateRequirement('req-length', hasLength);
    updateRequirement('req-upper', hasUpper);
    updateRequirement('req-lower', hasLower);
    updateRequirement('req-digit', hasDigit);
    updateRequirement('req-special', hasSpecial);
    
    // Индикатор силы пароля
    const strengthBar = document.getElementById('password-strength-bar');
    const strengthCount = [hasLength, hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean).length;
    
    strengthBar.className = 'password-strength-bar';
    if (value.length === 0) {
      strengthBar.className = 'password-strength-bar';
    } else if (strengthCount <= 2) {
      strengthBar.classList.add('weak');
    } else if (strengthCount <= 3) {
      strengthBar.classList.add('medium');
    } else if (strengthCount <= 4) {
      strengthBar.classList.add('good');
    } else {
      strengthBar.classList.add('strong');
    }
    
    if (!value) {
      state.validationState.password = false;
      input.classList.remove('invalid', 'valid');
      return false;
    }
    
    if (!hasLength) {
      showError('password', 'Пароль должен быть от 8 до 20 символов');
      input.classList.add('invalid');
      input.classList.remove('valid');
      state.validationState.password = false;
      return false;
    }
    
    if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
      showError('password', 'Пароль должен содержать заглавную, строчную, цифру и спецсимвол');
      input.classList.add('invalid');
      input.classList.remove('valid');
      state.validationState.password = false;
      return false;
    }
    
    // Проверка TOP-100
    if (typeof TOP_100_PASSWORDS !== 'undefined' && TOP_100_PASSWORDS.includes(value)) {
      showError('password', 'Этот пароль входит в TOP-100 самых популярных. Выберите другой');
      input.classList.add('invalid');
      input.classList.remove('valid');
      state.validationState.password = false;
      return false;
    }
    
    clearError('password');
    input.classList.remove('invalid');
    input.classList.add('valid');
    state.validationState.password = true;
    return true;
  }

  function updateRequirement(id, met) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.toggle('met', met);
      el.classList.toggle('unmet', !met);
    }
  }

  // Подтверждение пароля
  function validateConfirm() {
    const password = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-confirm');
    const value = confirm.value;
    
    if (!value) {
      state.validationState.confirm = false;
      return false;
    }
    
    if (value !== password) {
      showError('confirm', 'Пароли не совпадают');
      confirm.classList.add('invalid');
      confirm.classList.remove('valid');
      state.validationState.confirm = false;
      return false;
    }
    
    clearError('confirm');
    confirm.classList.remove('invalid');
    confirm.classList.add('valid');
    state.validationState.confirm = true;
    return true;
  }

  // ═══════════════════════════════════════════════════════════
  // ГЕНЕРАТОР НИКНЕЙМА
  // ═══════════════════════════════════════════════════════════
  function setupNicknameGenerator() {
    const btn = document.getElementById('generate-nickname-btn');
    if (btn) {
      btn.addEventListener('click', generateNickname);
    }
  }

  function generateNickname() {
    if (state.nicknameAttempts >= state.maxNicknameAttempts) {
      // После 5 попыток — ручной ввод
      const input = document.getElementById('register-nickname');
      input.focus();
      input.placeholder = 'Введите никнейм вручную';
      document.getElementById('nickname-attempts').textContent = 'Введите никнейм вручную';
      return;
    }
    
    state.nicknameAttempts++;
    
    const adjectives = ['Sweet', 'Happy', 'Cool', 'Fast', 'Smart', 'Lucky', 'Brave', 'Calm'];
    const nouns = ['Cookie', 'Candy', 'Honey', 'Sugar', 'Berry', 'Muffin', 'Cake', 'Pie'];
    const numbers = Math.floor(Math.random() * 1000);
    
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const nickname = `${adj}${noun}${numbers}`;
    
    const input = document.getElementById('register-nickname');
    input.value = nickname;
    
    document.getElementById('nickname-attempts').textContent = 
      `Попыток генерации: ${state.nicknameAttempts} из ${state.maxNicknameAttempts}`;
    
    validateNickname();
    checkFormValidity();
  }

  // ═══════════════════════════════════════════════════════════
  // СОГЛАШЕНИЕ
  // ═══════════════════════════════════════════════════════════
  function setupAgreementCheckbox() {
    const checkbox = document.getElementById('register-agreement');
    if (checkbox) {
      checkbox.addEventListener('change', () => {
        state.validationState.agreement = checkbox.checked;
        if (!checkbox.checked) {
          showError('agreement', 'Необходимо принять соглашение');
        } else {
          clearError('agreement');
        }
        checkFormValidity();
      });
    }
  }

  // ═══════════════════════════════════════════════════════════
  // ПРОВЕРКА ВАЛИДНОСТИ ФОРМЫ
  // ═══════════════════════════════════════════════════════════
  function checkFormValidity() {
    const allValid = Object.values(state.validationState).every(v => v === true);
    const submitBtn = document.getElementById('register-submit-btn');
    
    if (submitBtn) {
      submitBtn.disabled = !allValid;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // ОТПРАВКА ФОРМЫ
  // ═══════════════════════════════════════════════════════════
  function setupFormSubmit() {
    const form = document.getElementById('register-form');
    if (form) {
      // Удаляем старый обработчик из auth.js
      form.removeEventListener('submit', handleRegister);
      
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Финальная валидация
        const fullnameValid = validateFullname();
        const emailValid = validateEmail();
        const phoneValid = validatePhone();
        const birthdateValid = validateBirthdate();
        const nicknameValid = validateNickname();
        
        let passwordValid = false;
        let password = '';
        
        if (state.passwordMode === 'manual') {
          passwordValid = validatePassword() && validateConfirm();
          password = document.getElementById('register-password').value;
        } else {
          passwordValid = true;
          password = state.autoPassword;
        }
        
        const agreementValid = document.getElementById('register-agreement').checked;
        
        if (!fullnameValid || !emailValid || !phoneValid || 
            !birthdateValid || !nicknameValid || !passwordValid || !agreementValid) {
          return;
        }
        
        // Собираем данные
        const fullname = document.getElementById('register-fullname').value.trim();
        const nameParts = fullname.split(/\s+/);
        const name = nameParts[0];
        const surname = nameParts.slice(1).join(' ');
        
        const userData = {
          id: Date.now().toString(),
          name: fullname,
          firstName: name,
          lastName: surname,
          email: document.getElementById('register-email').value.trim(),
          phone: document.getElementById('register-phone').value,
          birthdate: document.getElementById('register-birthdate').value,
          nickname: document.getElementById('register-nickname').value.trim(),
          password: password,
          role: document.getElementById('register-role').value,
          createdAt: new Date().toISOString()
        };
        
        try {
          // Проверяем существование
          const usersRes = await fetch('http://localhost:3001/users');
          const users = await usersRes.json();
          
          if (users.find(u => u.email === userData.email)) {
            showError('email', 'Пользователь с таким email уже существует');
            return;
          }
          
          if (users.find(u => u.nickname === userData.nickname)) {
            showError('nickname', 'Этот никнейм уже занят');
            return;
          }
          
          // Регистрируем
          const res = await fetch('http://localhost:3001/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
          });
          
          if (!res.ok) throw new Error('Ошибка регистрации');
          
          const savedUser = await res.json();
          console.log('✅ Пользователь зарегистрирован:', savedUser);
          
          // Автоматический вход
          const session = {
            id: savedUser.id,
            name: savedUser.name,
            email: savedUser.email,
            role: savedUser.role,
            phone: savedUser.phone,
            nickname: savedUser.nickname,
            loginTime: new Date().toISOString()
          };
          
          localStorage.setItem('ami-session', JSON.stringify(session));
          
          if (state.passwordMode === 'auto') {
            alert(`✅ Регистрация успешна!\n\nВаш автоматически сгенерированный пароль:\n${password}\n\nСохраните его в надёжном месте!`);
          } else {
            alert('✅ Регистрация успешна! Выполняется вход...');
          }
          
          setTimeout(() => {
            window.location.href = 'catalog.html';
          }, 1500);
          
        } catch (error) {
          console.error('❌ Ошибка:', error);
          alert('Ошибка при регистрации: ' + error.message);
        }
      });
    }
  }

  // ═══════════════════════════════════════════════════════════
  // УТИЛИТЫ
  // ═══════════════════════════════════════════════════════════
  function showError(fieldName, message) {
    const errorEl = document.getElementById(`error-${fieldName}`);
    if (errorEl) {
      errorEl.textContent = message;
    }
  }

  function clearError(fieldName) {
    const errorEl = document.getElementById(`error-${fieldName}`);
    if (errorEl) {
      errorEl.textContent = '';
    }
  }

  // Экспорт
  return {
    init,
    generateAutoPassword
  };
})();

// Глобальные функции
function copyAutoPassword() {
  const password = document.getElementById('auto-password-value').value;
  navigator.clipboard.writeText(password).then(() => {
    alert('✅ Пароль скопирован в буфер обмена!');
  }).catch(() => {
    // Fallback
    const textarea = document.createElement('textarea');
    textarea.value = password;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    alert('✅ Пароль скопирован!');
  });
}

function showAgreement() {
  alert(
    '📜 СОГЛАШЕНИЕ ПОЛЬЗОВАТЕЛЯ\n\n' +
    '1. Пользователь обязуется предоставлять достоверные данные.\n' +
    '2. Администрация не несёт ответственности за действия пользователей.\n' +
    '3. Пользователь соглашается на обработку персональных данных.\n' +
    '4. Администрация вправе блокировать аккаунты нарушителей.\n' +
    '5. Все споры решаются путём переговоров.\n\n' +
    '© AMI Confectionery 2026'
  );
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
  RegisterValidation.init();
});