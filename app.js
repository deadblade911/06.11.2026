// Логика страницы: вкладки, маска телефона, проверка полей и отправка форм на сервер

const API_URL = '/api';

const resultBox = document.getElementById('result');
const registerTab = document.getElementById('tab-register');
const loginTab = document.getElementById('tab-login');
const registerForm = document.getElementById('register-form');
const loginForm = document.getElementById('login-form');
const phoneInput = document.getElementById('reg-phone');

// --- Вкладки ---
function switchTab(selectedTab) {
  const isRegisterSelected = selectedTab === registerTab;

  registerTab.classList.toggle('active', isRegisterSelected);
  loginTab.classList.toggle('active', !isRegisterSelected);
  registerForm.hidden = !isRegisterSelected;
  loginForm.hidden = isRegisterSelected;
}

// --- Телефон ---
function onlyDigits(text) {
  return text.replace(/\D/g, '');
}

// Приводит ввод к виду +7 (XXX) XXX-XX-XX
// Ограничение: номер из 10 цифр без кода страны, начинающийся с 7 или 8,
// теряет первую цифру, и поле показывает ошибку
function maskPhone(rawValue) {
  // Регулярка отрезает код страны в начале строки: +7, 7 или 8
  const withoutCountryCode = rawValue.trim().replace(/^\+?[78]?/, '');
  const digits = onlyDigits(withoutCountryCode).slice(0, 10);
  // Введён только код страны: показываем начало маски, чтобы следующая цифра не считалась кодом
  if (!digits) return /^\+?[78]$/.test(rawValue) ? '+7 (' : '';

  let masked = '+7 (' + digits.slice(0, 3);
  if (digits.length > 3) masked += ') ' + digits.slice(3, 6);
  if (digits.length > 6) masked += '-' + digits.slice(6, 8);
  if (digits.length > 8) masked += '-' + digits.slice(8);
  return masked;
}

// Значение поля всегда в маске, поэтому достаточно '+' и цифр
function normalizePhone(maskedPhone) {
  return '+' + onlyDigits(maskedPhone);
}

function validatePhone(phone) {
  if (!phone) return 'Введите телефон';
  // 11 цифр: код страны 7 и 10 цифр номера
  if (onlyDigits(phone).length !== 11) return 'Введите номер полностью';
  return '';
}

// Присваивание input.value переносит каретку в конец, поэтому при правке в середине номера
// возвращаем её к той же цифре: считаем цифры слева от каретки и находим это место в маске
function restoreCaret(rawValue, maskedValue, caretPosition) {
  if (caretPosition === rawValue.length) return;

  let digitsLeft = onlyDigits(rawValue.slice(0, caretPosition)).length;
  let position = 0;
  while (digitsLeft > 0 && position < maskedValue.length) {
    if (/\d/.test(maskedValue[position])) digitsLeft--;
    position++;
  }
  phoneInput.setSelectionRange(position, position);
}

function handlePhoneInput() {
  const rawValue = phoneInput.value;
  const caretPosition = phoneInput.selectionStart;
  const maskedValue = maskPhone(rawValue);

  phoneInput.value = maskedValue;
  restoreCaret(rawValue, maskedValue, caretPosition);
  setFieldError('reg-phone', validatePhone(maskedValue));
}

// --- Проверка полей ---
function validateEmail(email) {
  if (!email) return 'Введите email';
  // Формат имя@домен.зона. Строку без @ браузер не отправит сам из-за type="email",
  // а вариант без точки, например a@b, пропустит, и его отсекает эта проверка
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Некорректный email';
  return '';
}

function validatePassword(password) {
  if (password.length < 6) return 'Пароль минимум 6 символов';
  return '';
}

// Пустое сообщение убирает ошибку с поля
function setFieldError(fieldId, message) {
  document.getElementById(fieldId + '-err').textContent = message;
  document.getElementById(fieldId).classList.toggle('invalid', Boolean(message));
}

// --- Отправка форм ---
function showResult(text, isOk) {
  resultBox.textContent = text;
  resultBox.className = isOk ? 'result ok' : 'result error';
}

// Отправляет POST с JSON. Если сервер ответил ошибкой, бросает исключение с её текстом
async function postJson(path, body) {
  const response = await fetch(API_URL + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    // В ответе не JSON: data остаётся null
  }

  if (!response.ok) {
    throw new Error((data && data.message) || 'Ошибка ' + response.status);
  }
  return data;
}

// Общая отправка для обеих форм: кнопка заблокирована на время запроса,
// при успехе сохраняем токен и очищаем форму
async function sendForm(form, path, body, successText) {
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  try {
    const data = await postJson(path, body);
    // Токен для защищённых запросов (GET /api/me); сама страница таких запросов не делает
    localStorage.setItem('token', data.token);
    showResult(successText, true);
    form.reset();
  } catch (err) {
    showResult('Ошибка: ' + err.message, false);
  } finally {
    submitButton.disabled = false;
  }
}

async function handleRegisterSubmit(event) {
  event.preventDefault();

  const email = document.getElementById('reg-email').value.trim();
  const phone = phoneInput.value;
  const password = document.getElementById('reg-password').value;

  const emailError = validateEmail(email);
  const phoneError = validatePhone(phone);
  const passwordError = validatePassword(password);

  setFieldError('reg-email', emailError);
  setFieldError('reg-phone', phoneError);
  setFieldError('reg-password', passwordError);
  if (emailError || phoneError || passwordError) return;

  const body = { email, phone: normalizePhone(phone), password };
  await sendForm(registerForm, '/auth/register', body, 'вы успешно зарегистрированы');
}

async function handleLoginSubmit(event) {
  event.preventDefault();

  const email = document.getElementById('log-email').value.trim();
  const password = document.getElementById('log-password').value;

  // Здесь проверяем только заполненность: формат email проверяет браузер (type="email"),
  // а верность данных проверяет сервер
  const emailError = email ? '' : 'Введите email';
  const passwordError = password ? '' : 'Введите пароль';

  setFieldError('log-email', emailError);
  setFieldError('log-password', passwordError);
  if (emailError || passwordError) return;

  await sendForm(loginForm, '/auth/login', { email, password }, 'вы успешно авторизованы');
}

// --- Подключение обработчиков ---
registerTab.addEventListener('click', () => switchTab(registerTab));
loginTab.addEventListener('click', () => switchTab(loginTab));
phoneInput.addEventListener('input', handlePhoneInput);
registerForm.addEventListener('submit', handleRegisterSubmit);
loginForm.addEventListener('submit', handleLoginSubmit);
// form.reset() очищает поля, но не сообщение об ошибке под телефоном
registerForm.addEventListener('reset', () => setFieldError('reg-phone', ''));
