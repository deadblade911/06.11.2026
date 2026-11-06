const API_URL = '/api';

const resultBox = document.getElementById('result');
const registerTab = document.getElementById('tab-register');
const loginTab = document.getElementById('tab-login');
const registerForm = document.getElementById('register-form');
const loginForm = document.getElementById('login-form');
const phoneInput = document.getElementById('reg-phone');

function switchTab(selectedTab) {
  const isRegisterSelected = selectedTab === registerTab;

  registerTab.classList.toggle('active', isRegisterSelected);
  loginTab.classList.toggle('active', !isRegisterSelected);
  registerForm.hidden = !isRegisterSelected;
  loginForm.hidden = isRegisterSelected;
}

function onlyDigits(text) {
  return text.replace(/\D/g, '');
}

function maskPhone(rawValue) {
  const withoutCountryCode = rawValue.trim().replace(/^\+?[78]?/, '');
  const digits = onlyDigits(withoutCountryCode).slice(0, 10);
  if (!digits) return /^\+?[78]$/.test(rawValue) ? '+7 (' : '';

  let masked = '+7 (' + digits.slice(0, 3);
  if (digits.length > 3) masked += ') ' + digits.slice(3, 6);
  if (digits.length > 6) masked += '-' + digits.slice(6, 8);
  if (digits.length > 8) masked += '-' + digits.slice(8);
  return masked;
}

function normalizePhone(maskedPhone) {
  return '+' + onlyDigits(maskedPhone);
}

function validatePhone(phone) {
  if (!phone) return 'Введите телефон';
  if (onlyDigits(phone).length !== 11) return 'Введите номер полностью';
  return '';
}

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

function validateEmail(email) {
  if (!email) return 'Введите email';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Некорректный email';
  return '';
}

function validatePassword(password) {
  if (password.length < 6) return 'Пароль минимум 6 символов';
  return '';
}

function setFieldError(fieldId, message) {
  document.getElementById(fieldId + '-err').textContent = message;
  document.getElementById(fieldId).classList.toggle('invalid', Boolean(message));
}

function showResult(text, isOk) {
  resultBox.textContent = text;
  resultBox.className = isOk ? 'result ok' : 'result error';
}

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
  }

  if (!response.ok) {
    throw new Error((data && data.message) || 'Ошибка ' + response.status);
  }
  return data;
}

async function sendForm(form, path, body, successText) {
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  try {
    const data = await postJson(path, body);
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

  const emailError = email ? '' : 'Введите email';
  const passwordError = password ? '' : 'Введите пароль';

  setFieldError('log-email', emailError);
  setFieldError('log-password', passwordError);
  if (emailError || passwordError) return;

  await sendForm(loginForm, '/auth/login', { email, password }, 'вы успешно авторизованы');
}

registerTab.addEventListener('click', () => switchTab(registerTab));
loginTab.addEventListener('click', () => switchTab(loginTab));
phoneInput.addEventListener('input', handlePhoneInput);
registerForm.addEventListener('submit', handleRegisterSubmit);
loginForm.addEventListener('submit', handleLoginSubmit);
registerForm.addEventListener('reset', () => setFieldError('reg-phone', ''));
