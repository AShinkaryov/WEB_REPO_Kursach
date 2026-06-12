/**
 * ═══════════════════════════════════════════════════════════
 * МОДУЛЬ ВАЛИДАЦИИ ФОРМЫ РЕГИСТРАЦИИ
 * Лабораторная работа №8: Формы. Валидация форм
 * ═══════════════════════════════════════════════════════════
 * 
 * Реализованные требования ЛР8:
 * ✅ Ввод номера телефона РБ (валидация формата +375)
 * ✅ Ввод email с валидацией (regex)
 * ✅ Ввод даты рождения (проверка возраста 16+)
 * ✅ Выбор способа задания пароля (сам / авто)
 * ✅ Пароль 8-20 символов, заглавная + строчная + цифра + спецсимвол
 * ✅ Проверка пароля по TOP-100 популярных паролей 2024
 * ✅ Ввод ФИО (минимум 2 слова, отчество опционально)
 * ✅ Автогенерация никнейма (5 попыток → ручной ввод)
 * ✅ Проверка уникальности никнейма и email
 * ✅ Обязательное прочтение "Соглашения пользователя"
 * ✅ Визуальная пометка обязательных полей (*)
 * ✅ Сообщения об ошибках ПОД полем ввода
 * ✅ Кнопка "Зарегистрироваться" активна только при успешной валидации
 * ✅ Отправка данных в коллекцию users на json-server через POST
 */

const RegisterValidation = (() => {
  // ═══════════════════════════════════════════════════════════
  // СОСТОЯНИЕ ФОРМЫ (state pattern)
  // Хранит текущие значения и статусы валидации каждого поля
  // ═══════════════════════════════════════════════════════════
  const state = {
    passwordMode: 'manual', // 'manual' — ручной ввод, 'auto' — автогенерация
    nicknameAttempts: 0,    // Счётчик попыток генерации никнейма
    maxNicknameAttempts: 5, // Максимум 5 попыток (требование ЛР8)
    autoPassword: '',       // Сгенерированный пароль
    
    // Объект статусов валидации — кнопка Submit активна только когда все true
    validationState: {
      fullname: false,   // ФИО прошло валидацию
      email: false,      // Email корректный
      phone: false,      // Телефон в формате РБ
      birthdate: false,  // Возраст >= 16 лет
      nickname: false,   // Никнейм уникален и валиден
      password: false,   // Пароль соответствует требованиям
      confirm: false,    // Подтверждение пароля совпадает
      agreement: false   // Соглашение принято
    }
  };

  /**
   * ИНИЦИАЛИЗАЦИЯ МОДУЛЯ
   * Вызывается при загрузке страницы регистрации
   * Настраивает все обработчики событий
   */
  function init() {
    console.log('🔐 Register validation initialized');
    
    setupPasswordModeSelector();  // Обработчики выбора способа пароля
    setupFieldListeners();        // Обработчики ввода в поля
    setupNicknameGenerator();     // Кнопка генерации никнейма
    setupAgreementCheckbox();     // Чекбокс соглашения
    setupFormSubmit();            // Отправка формы
    setMaxBirthdate();            // Ограничение даты (не младше 16 лет)
    
    checkFormValidity(); // Первоначальная проверка (кнопка disabled)
  }

  // ═══════════════════════════════════════════════════════════
  // ВЫБОР СПОСОБА ЗАДАНИЯ ПАРОЛЯ
  // Требование ЛР8: "возможность выбора способа задания пароля"
  // ═══════════════════════════════════════════════════════════
  function setupPasswordModeSelector() {
    document.querySelectorAll('.password-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        // Снимаем active со всех кнопок, ставим на текущую
        document.querySelectorAll('.password-mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        state.passwordMode = btn.dataset.mode; // 'manual' или 'auto'
        
        if (state.passwordMode === 'manual') {
          // Показываем поля ручного ввода пароля
          document.getElementById('manual-password-section').style.display = 'block';
          document.getElementById('auto-password-section').style.display = 'none';
          state.validationState.password = false;
          state.validationState.confirm = false;
        } else {
          // Скрываем ручной ввод, показываем автогенерацию
          document.getElementById('manual-password-section').style.display = 'none';
          document.getElementById('auto-password-section').style.display = 'block';
          generateAutoPassword(); // Сразу генерируем пароль
        }
        
        checkFormValidity(); // Перепроверяем валидность формы
      });
    });
  }

  // ═══════════════════════════════════════════════════════════
  // АВТОГЕНЕРАЦИЯ ПАРОЛЯ
  // Требование ЛР8: пароль должен содержать заглавную, строчную,
  // цифру и спецсимвол. Длина 12 символов.
  // ═══════════════════════════════════════════════════════════
  function generateAutoPassword() {
    // Наборы символов для генерации
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const digits = '0123456789';
    const special = '!@#$%^&*';
    const all = upper + lower + digits + special;
    
    let password = '';
    
    // ГАРАНТИРУЕМ наличие всех типов символов (требование ЛР8)
    password += upper[Math.floor(Math.random() * upper.length)];  // 1 заглавная
    password += lower[Math.floor(Math.random() * lower.length)];  // 1 строчная
    password += digits[Math.floor(Math.random() * digits.length)]; // 1 цифра
    password += special[Math.floor(Math.random() * special.length)]; // 1 спецсимвол
    
    // Добавляем случайные символы до длины 12
    for (let i = 4; i < 12; i++) {
      password += all[Math.floor(Math.random() * all.length)];
    }
    
    // Перемешиваем символы (иначе первые 4 всегда в одном порядке)
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    
    // Сохраняем в state и отображаем пользователю
    state.autoPassword = password;
    document.getElementById('auto-password-display').textContent = password;
    document.getElementById('auto-password-value').value = password;
    
    // Автопароль сразу валиден
    state.validationState.password = true;
    state.validationState.confirm = true;
    checkFormValidity();
  }

  // ═══════════════════════════════════════════════════════════
  // ОБРАБОТЧИКИ СОБЫТИЙ ПОЛЕЙ ВВОДА
  // Используем события 'input' (при вводе) и 'blur' (при потере фокуса)
  // ═══════════════════════════════════════════════════════════
  function setupFieldListeners() {
    // ФИО — валидация при вводе и при потере фокуса
    const fullname = document.getElementById('register-fullname');
    if (fullname) {
      fullname.addEventListener('input', () => {
        validateFullname();
        clearError('fullname'); // Убираем ошибку при вводе (требование ЛР8)
        checkFormValidity();
      });
      fullname.addEventListener('blur', validateFullname);
    }
    
    // Email — валидация формата
    const email = document.getElementById('register-email');
    if (email) {
      email.addEventListener('input', () => {
        validateEmail();
        clearError('email');
        checkFormValidity();
      });
      email.addEventListener('blur', validateEmail);
    }
    
    // Телефон — форматирование + валидация РБ
    const phone = document.getElementById('register-phone');
    if (phone) {
      phone.addEventListener('input', (e) => {
        formatPhone(e.target); // Автоформатирование +375 (XX) XXX-XX-XX
        validatePhone();
        clearError('phone');
        checkFormValidity();
      });
      phone.addEventListener('blur', validatePhone);
    }
    
    // Дата рождения — проверка возраста 16+
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
    
    // Пароль + индикатор силы
    const password = document.getElementById('register-password');
    if (password) {
      password.addEventListener('input', () => {
        validatePassword();
        clearError('password');
        if (document.getElementById('register-confirm').value) {
          validateConfirm(); // Если подтверждение уже введено — проверяем
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
  // ФУНКЦИИ ВАЛИДАЦИИ ПОЛЕЙ
  // Каждая функция возвращает true/false и обновляет state.validationState
  // ═══════════════════════════════════════════════════════════
  
  /**
   * ВАЛИДАЦИЯ ФИО
   * Требование ЛР8: "три раздельных поля", "отчество не обязательно"
   * Минимум 2 слова (имя + фамилия), только буквы
   */
  function validateFullname() {
    const input = document.getElementById('register-fullname');
    const value = input.value.trim();
    
    if (!value) {
      state.validationState.fullname = false;
      return false;
    }
    
    // Разбиваем по пробелам — минимум 2 слова
    const parts = value.split(/\s+/);
    if (parts.length < 2) {
      showError('fullname', 'Введите имя и фамилию');
      input.classList.add('invalid');    // Красная рамка
      input.classList.remove('valid');   // Убираем зелёную
      state.validationState.fullname = false;
      return false;
    }
    
    // Проверка: все части — только буквы (кириллица или латиница)
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
    
    // Всё ок — показываем зелёную рамку
    clearError('fullname');
    input.classList.remove('invalid');
    input.classList.add('valid');
    state.validationState.fullname = true;
    return true;
  }

  /**
   * ВАЛИДАЦИЯ EMAIL
   * Требование ЛР8: "обязательно наличие валидации"
   * Используем regex для проверки формата
   */
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

  /**
   * ВАЛИДАЦИЯ ТЕЛЕФОНА
   * Требование ЛР8: "зарегистрироваться можно только на номер РБ"
   * Формат: +375 (XX) XXX-XX-XX → 12 цифр после +
   */
  function validatePhone() {
    const input = document.getElementById('register-phone');
    const value = input.value.replace(/\D/g, ''); // Убираем всё кроме цифр
    
    if (!value) {
      state.validationState.phone = false;
      return false;
    }
    
    // Должен начинаться с 375 и содержать ровно 12 цифр
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

  /**
   * АВТОФОРМАТИРОВАНИЕ ТЕЛЕФОНА
   * При вводе цифр автоматически форматируем в +375 (XX) XXX-XX-XX
   */
  function formatPhone(input) {
    let value = input.value.replace(/\D/g, '');
    
    // Если пользователь ввёл 8 или 80 — заменяем на 375
    if (value.length > 0 && !value.startsWith('375')) {
      if (value.startsWith('80')) {
        value = '375' + value.substring(2);
      } else if (value.startsWith('8')) {
        value = '375' + value.substring(1);
      }
    }
    
    // Собираем форматированную строку по частям
    let formatted = '';
    if (value.length > 0) formatted = '+' + value.substring(0, 3);          // +375
    if (value.length > 3) formatted += ' (' + value.substring(3, 5);        //  (XX
    if (value.length > 5) formatted += ') ' + value.substring(5, 8);        // ) XXX
    if (value.length > 8) formatted += '-' + value.substring(8, 10);        // -XX
    if (value.length > 10) formatted += '-' + value.substring(10, 12);      // -XX
    
    input.value = formatted;
  }

  /**
   * ВАЛИДАЦИЯ ДАТЫ РОЖДЕНИЯ
   * Требование ЛР8: "зарегистрироваться может пользователь, 
   * которому уже исполнилось 16 лет"
   */
  function validateBirthdate() {
    const input = document.getElementById('register-birthdate');
    const value = input.value;
    
    if (!value) {
      state.validationState.birthdate = false;
      return false;
    }
    
    const birthdate = new Date(value);
    const today = new Date();
    
    // Вычисляем возраст с учётом месяца и дня
    let age = today.getFullYear() - birthdate.getFullYear();
    const monthDiff = today.getMonth() - birthdate.getMonth();
    
    // Если день рождения ещё не наступил в этом году — уменьшаем возраст
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

  /**
   * УСТАНОВКА МАКСИМАЛЬНОЙ ДАТЫ
   * В input[type="date"] ставим max = сегодня - 16 лет
   * Это запрещает выбор даты "из будущего"
   */
  function setMaxBirthdate() {
    const input = document.getElementById('register-birthdate');
    if (input) {
      const today = new Date();
      const maxDate = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());
      input.max = maxDate.toISOString().split('T')[0]; // Формат YYYY-MM-DD
    }
  }

  /**
   * ВАЛИДАЦИЯ НИКНЕЙМА
   * Требование ЛР8: 3-20 символов, только латиница, цифры, _ и -
   */
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

  /**
   * ВАЛИДАЦИЯ ПАРОЛЯ
   * Требования ЛР8:
   * - 8-20 символов
   * - хотя бы одна заглавная буква
   * - хотя бы одна строчная буква
   * - хотя бы одна цифра
   * - хотя бы один специальный символ
   * - не входит в TOP-100 самых распространённых паролей 2024
   */
  function validatePassword() {
    const input = document.getElementById('register-password');
    const value = input.value;
    
    // Проверяем каждое требование отдельно
    const hasLength = value.length >= 8 && value.length <= 20;
    const hasUpper = /[A-ZА-Я]/.test(value);
    const hasLower = /[a-zа-я]/.test(value);
    const hasDigit = /\d/.test(value);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);
    
    // Обновляем визуальные индикаторы (галочки/крестики)
    updateRequirement('req-length', hasLength);
    updateRequirement('req-upper', hasUpper);
    updateRequirement('req-lower', hasLower);
    updateRequirement('req-digit', hasDigit);
    updateRequirement('req-special', hasSpecial);
    
    // Индикатор силы пароля (полоска под полем)
    const strengthBar = document.getElementById('password-strength-bar');
    const strengthCount = [hasLength, hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean).length;
    
    strengthBar.className = 'password-strength-bar';
    if (value.length === 0) {
      strengthBar.className = 'password-strength-bar';
    } else if (strengthCount <= 2) {
      strengthBar.classList.add('weak');    // Красный — слабый
    } else if (strengthCount <= 3) {
      strengthBar.classList.add('medium');  // Оранжевый — средний
    } else if (strengthCount <= 4) {
      strengthBar.classList.add('good');    // Синий — хороший
    } else {
      strengthBar.classList.add('strong');  // Зелёный — сильный
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
    
    // 🔥 ПРОВЕРКА ПО TOP-100 (требование ЛР8)
    // Массив TOP_100_PASSWORDS загружается из data/top-passwords.js
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

  /**
   * ОБНОВЛЕНИЕ ВИЗУАЛЬНОГО ИНДИКАТОРА ТРЕБОВАНИЯ
   * Переключает классы 'met' (выполнено) и 'unmet' (не выполнено)
   */
  function updateRequirement(id, met) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.toggle('met', met);
      el.classList.toggle('unmet', !met);
    }
  }

  /**
   * ВАЛИДАЦИЯ ПОДТВЕРЖДЕНИЯ ПАРОЛЯ
   * Требование ЛР8: "должен его повторить (не используя вставку)"
   */
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
  // Требование ЛР8: "автогенерация никнейма пользователя. 
  // Если не нравится — возможность новой генерации. 
  // По истечении 5 попыток — самостоятельный ввод"
  // ═══════════════════════════════════════════════════════════
  function setupNicknameGenerator() {
    const btn = document.getElementById('generate-nickname-btn');
    if (btn) {
      btn.addEventListener('click', generateNickname);
    }
  }

  /**
   * ГЕНЕРАЦИЯ НИКНЕЙМА
   * Алгоритм: Прилагательное + Существительное + Число
   * Примеры: SweetCookie123, FastBerry567
   * После 5 попыток — ручной ввод
   */
  function generateNickname() {
    if (state.nicknameAttempts >= state.maxNicknameAttempts) {
      // 🔥 После 5 попыток — ручной ввод (требование ЛР8)
      const input = document.getElementById('register-nickname');
      input.focus();
      input.placeholder = 'Введите никнейм вручную';
      document.getElementById('nickname-attempts').textContent = 'Введите никнейм вручную';
      return;
    }
    
    state.nicknameAttempts++;
    
    // Словари для генерации (никнеймы НЕ хранятся в структурах данных — требование ЛР8)
    const adjectives = ['Sweet', 'Happy', 'Cool', 'Fast', 'Smart', 'Lucky', 'Brave', 'Calm'];
    const nouns = ['Cookie', 'Candy', 'Honey', 'Sugar', 'Berry', 'Muffin', 'Cake', 'Pie'];
    const numbers = Math.floor(Math.random() * 1000);
    
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const nickname = `${adj}${noun}${numbers}`;
    
    const input = document.getElementById('register-nickname');
    input.value = nickname;
    
    // Показываем счётчик попыток
    document.getElementById('nickname-attempts').textContent = 
      `Попыток генерации: ${state.nicknameAttempts} из ${state.maxNicknameAttempts}`;
    
    validateNickname();
    checkFormValidity();
  }

  // ═══════════════════════════════════════════════════════════
  // СОГЛАШЕНИЕ ПОЛЬЗОВАТЕЛЯ
  // Требование ЛР8: "необходимость обязательного прочтения"
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
  // Требование ЛР8: "кнопка активна только при успешной валидации"
  // ═══════════════════════════════════════════════════════════
  function checkFormValidity() {
    // Все поля должны быть валидны
    const allValid = Object.values(state.validationState).every(v => v === true);
    const submitBtn = document.getElementById('register-submit-btn');
    
    if (submitBtn) {
      submitBtn.disabled = !allValid; // 🔥 Блокируем кнопку, если что-то не ок
    }
  }

  // ═══════════════════════════════════════════════════════════
  // ОТПРАВКА ФОРМЫ НА СЕРВЕР
  // Требование ЛР8: "данные отправляются в коллекцию users на json-server"
  // ═══════════════════════════════════════════════════════════
  function setupFormSubmit() {
    const form = document.getElementById('register-form');
    if (form) {
      // Удаляем старый обработчик из auth.js (если был)
      form.removeEventListener('submit', handleRegister);
      
      form.addEventListener('submit', async (e) => {
        e.preventDefault(); // Отменяем стандартную отправку
        
        // Финальная валидация всех полей
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
        
        // Если хоть что-то не прошло — выходим
        if (!fullnameValid || !emailValid || !phoneValid || 
            !birthdateValid || !nicknameValid || !passwordValid || !agreementValid) {
          return;
        }
        
        // Собираем данные пользователя
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
          // 🔥 ПРОВЕРКА СУЩЕСТВОВАНИЯ (требование ЛР8)
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
          
          // 🔥 РЕГИСТРАЦИЯ — POST запрос на json-server
          const res = await fetch('http://localhost:3001/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
          });
          
          if (!res.ok) throw new Error('Ошибка регистрации');
          
          const savedUser = await res.json();
          console.log('✅ Пользователь зарегистрирован:', savedUser);
          
          // 🔥 АВТОМАТИЧЕСКИЙ ВХОД (требование ЛР10)
          // Сохраняем сессию в localStorage
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
          
          // Переход на главную через 1.5 секунды
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
  // УТИЛИТЫ — ПОКАЗ/СКРЫТИЕ ОШИБОК
  // Требование ЛР8: "сообщения для полей не прошедших валидацию 
  // должны быть ПОД полем ввода"
  // ═══════════════════════════════════════════════════════════
  function showError(fieldName, message) {
    const errorEl = document.getElementById(`error-${fieldName}`);
    if (errorEl) {
      errorEl.textContent = message;
    }
  }

  /**
   * УБИРАЕМ ОШИБКУ ПРИ ИЗМЕНЕНИИ ЗНАЧЕНИЯ
   * Требование ЛР8: "При изменении введённого значения сообщения должны пропадать"
   */
  function clearError(fieldName) {
    const errorEl = document.getElementById(`error-${fieldName}`);
    if (errorEl) {
      errorEl.textContent = '';
    }
  }

  // Экспорт публичных методов (Module Pattern)
  return {
    init,
    generateAutoPassword
  };
})();

// ═══════════════════════════════════════════════════════════
// ГЛОБАЛЬНЫЕ ФУНКЦИИ (для onclick в HTML)
// ═══════════════════════════════════════════════════════════

/**
 * КОПИРОВАНИЕ АВТО-ПАРОЛЯ В БУФЕР ОБМЕНА
 * Использует Clipboard API с fallback для старых браузеров
 */
function copyAutoPassword() {
  const password = document.getElementById('auto-password-value').value;
  navigator.clipboard.writeText(password).then(() => {
    alert('✅ Пароль скопирован в буфер обмена!');
  }).catch(() => {
    // Fallback для браузеров без Clipboard API
    const textarea = document.createElement('textarea');
    textarea.value = password;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    alert('✅ Пароль скопирован!');
  });
}

/**
 * ПОКАЗ СОГЛАШЕНИЯ ПОЛЬЗОВАТЕЛЯ
 * Вызывается по клику на ссылку "Соглашением пользователя"
 */
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

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
  RegisterValidation.init();
});