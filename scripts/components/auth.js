// scripts/components/auth.js
// Área Restrita — modal de login e gestão de estado de autenticação.
// Quando VITE_SUPABASE_URL está configurado usa Supabase Auth.
// Sem as env vars cai em modo demo: qualquer e-mail + senha "ri@2026".

import { supabase, isSupabaseConfigured } from '../supabase.js';

const STORAGE_KEY = 'ri_auth';
const DEMO_PASSWORD = 'ri@2026';

export function isAuthenticated() {
  return sessionStorage.getItem(STORAGE_KEY) === '1';
}

function setAuth(value) {
  if (value) {
    sessionStorage.setItem(STORAGE_KEY, '1');
  } else {
    sessionStorage.removeItem(STORAGE_KEY);
  }
  document.dispatchEvent(new CustomEvent('ri:auth-change', { detail: { authenticated: value } }));
}

export async function logout() {
  if (isSupabaseConfigured) {
    await supabase.auth.signOut();
  }
  setAuth(false);
}

// Sincroniza sessão Supabase → flag de sessionStorage ao carregar a página
if (isSupabaseConfigured) {
  supabase.auth.getSession().then(({ data: { session } }) => {
    setAuth(!!session);
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    setAuth(!!session);
  });
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function buildModal() {
  const el = document.createElement('div');
  el.className = 'auth-modal';
  el.id = 'auth-modal';
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-label', 'Área Restrita — Login');
  el.setAttribute('aria-hidden', 'true');

  el.innerHTML = `
    <div class="auth-modal__backdrop" data-auth-close></div>
    <div class="auth-modal__card">
      <button class="auth-modal__close" type="button" aria-label="Fechar" data-auth-close>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      <div class="auth-modal__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
          stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </div>

      <h2 class="auth-modal__title">Área Restrita</h2>
      <p class="auth-modal__subtitle">Acesso exclusivo para investidores cadastrados.</p>

      <form class="auth-modal__form" data-auth-form novalidate>
        <div class="field">
          <label class="field__label" for="auth-email">E-mail</label>
          <input class="field__input" type="email" id="auth-email"
            name="email" placeholder="seu@email.com" autocomplete="email" required />
        </div>
        <div class="field">
          <label class="field__label" for="auth-password">Senha</label>
          <div class="auth-modal__pass-wrap">
            <input class="field__input" type="password" id="auth-password"
              name="password" placeholder="••••••••" autocomplete="current-password" required />
            <button class="auth-modal__pass-toggle" type="button" aria-label="Mostrar senha" data-pass-toggle tabindex="-1">
              <svg class="auth-modal__eye auth-modal__eye--show" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              <svg class="auth-modal__eye auth-modal__eye--hide" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="display:none"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            </button>
          </div>
        </div>

        <p class="auth-modal__error" data-auth-error aria-live="polite" role="alert"></p>

        <button class="btn btn--primary btn--lg auth-modal__submit" type="submit">
          Entrar
        </button>

        ${!isSupabaseConfigured ? `
        <p class="auth-modal__hint">
          <strong>Demo:</strong> qualquer e-mail + senha <code>ri@2026</code>
        </p>` : ''}
      </form>
    </div>`;

  document.body.appendChild(el);

  // Close handlers
  el.querySelectorAll('[data-auth-close]').forEach(btn =>
    btn.addEventListener('click', closeModal)
  );

  // Password toggle
  const passInput = el.querySelector('#auth-password');
  const passToggle = el.querySelector('[data-pass-toggle]');
  const eyeShow = el.querySelector('.auth-modal__eye--show');
  const eyeHide = el.querySelector('.auth-modal__eye--hide');
  passToggle.addEventListener('click', () => {
    const isText = passInput.type === 'text';
    passInput.type = isText ? 'password' : 'text';
    eyeShow.style.display = isText ? '' : 'none';
    eyeHide.style.display = isText ? 'none' : '';
    passToggle.setAttribute('aria-label', isText ? 'Mostrar senha' : 'Ocultar senha');
  });

  // Form submit
  el.querySelector('[data-auth-form]').addEventListener('submit', e => {
    e.preventDefault();
    handleLogin(el);
  });

  // ESC to close
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && el.getAttribute('aria-hidden') === 'false') closeModal();
  });

  return el;
}

function getModal() {
  return document.getElementById('auth-modal') || buildModal();
}

export function openModal() {
  const modal = getModal();
  modal.setAttribute('aria-hidden', 'false');
  modal.classList.add('is-open');
  document.body.style.overflow = 'hidden';

  const errorEl = modal.querySelector('[data-auth-error]');
  if (errorEl) errorEl.textContent = '';
  const form = modal.querySelector('[data-auth-form]');
  if (form) form.reset();

  setTimeout(() => {
    const first = modal.querySelector('input');
    if (first) first.focus();
  }, 100);
}

function closeModal() {
  const modal = document.getElementById('auth-modal');
  if (!modal) return;
  modal.setAttribute('aria-hidden', 'true');
  modal.classList.remove('is-open');
  document.body.style.overflow = '';
}

async function handleLogin(modal) {
  const email = modal.querySelector('#auth-email').value.trim();
  const password = modal.querySelector('#auth-password').value;
  const errorEl = modal.querySelector('[data-auth-error]');
  const submitBtn = modal.querySelector('.auth-modal__submit');

  errorEl.textContent = '';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errorEl.textContent = 'Informe um e-mail válido.';
    modal.querySelector('#auth-email').focus();
    return;
  }

  if (!password) {
    errorEl.textContent = 'Informe a senha.';
    modal.querySelector('#auth-password').focus();
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Entrando…';

  if (isSupabaseConfigured) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      errorEl.textContent = 'E-mail ou senha incorretos. Tente novamente.';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Entrar';
      modal.querySelector('#auth-password').focus();
    } else {
      closeModal();
    }
  } else {
    // Modo demo
    setTimeout(() => {
      if (password === DEMO_PASSWORD) {
        setAuth(true);
        closeModal();
      } else {
        errorEl.textContent = 'E-mail ou senha incorretos. Tente novamente.';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Entrar';
        modal.querySelector('#auth-password').focus();
      }
    }, 600);
  }
}
