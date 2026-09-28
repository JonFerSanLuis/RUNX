function formatPrice(value){return new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(value);}

function orderDate(value) {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(String(value).replace(' ', 'T')));
  } catch (e) {
    return String(value);
  }
}

function headerTemplate(){
  const page=location.pathname.split('/').pop()||'index.html';
  const root=location.pathname.includes('/legal/')?'../':'';
  const active=key=>page===key?'active':'';
  const currentQ = new URLSearchParams(location.search).get('q') || '';
  const searchVal = currentQ.replace(/"/g, '&quot;');
  return `<header class="site-header sticky-top">
    <nav class="navbar navbar-expand-lg">
      <div class="container">
        <a class="navbar-brand brand" href="${root}index.html"><span class="brand-mark">B</span>BRAND NAME</a>
        <a href="${root}carrito.html" class="cart-link d-lg-none me-2" aria-label="Ver carrito">Carrito <span class="cart-badge" data-cart-count>0</span></a>
        <button class="navbar-toggler border-0 p-1" type="button" data-bs-toggle="collapse" data-bs-target="#siteNav" aria-controls="siteNav" aria-expanded="false" aria-label="Abrir menú">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="siteNav">
          <ul class="navbar-nav mx-auto gap-lg-2">
            <li class="nav-item"><a class="nav-link ${active('index.html')}" href="${root}index.html">Inicio</a></li>
            <li class="nav-item"><a class="nav-link ${active('tienda.html')||active('producto.html')}" href="${root}tienda.html">Tienda</a></li>
            <li class="nav-item"><a class="nav-link" href="${root}tienda.html?category=Calcetines">Categorías</a></li>
            <li class="nav-item"><a class="nav-link ${active('sobre-nosotros.html')}" href="${root}sobre-nosotros.html">Sobre nosotros</a></li>
            <li class="nav-item"><a class="nav-link ${active('contacto.html')}" href="${root}contacto.html">Contacto</a></li>
            <li class="nav-item d-lg-none"><a class="nav-link ${active('faq.html')}" href="${root}faq.html">FAQ</a></li>
          </ul>
          <div class="d-flex flex-column flex-lg-row align-items-lg-center gap-2 gap-lg-3">
            <form class="site-search-form d-flex my-2 my-lg-0" action="${root}tienda.html" method="GET" role="search">
              <div class="input-group input-group-sm">
                <input class="form-control" type="search" name="q" value="${searchVal}" placeholder="Buscar productos…" aria-label="Buscar productos">
                <button class="btn btn-outline-dark" type="submit" aria-label="Buscar">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor" viewBox="0 0 16 16"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/></svg>
                </button>
              </div>
            </form>
            <div class="d-flex align-items-center gap-3" data-auth-nav>
              <a href="${root}login.html" class="small fw-semibold">Iniciar sesión</a>
              <a href="${root}registro.html" class="small fw-semibold">Crear cuenta</a>
              <a href="${root}carrito.html" class="cart-link d-none d-lg-inline-block" aria-label="Ver carrito">Carrito <span class="cart-badge" data-cart-count>0</span></a>
            </div>
          </div>
        </div>
      </div>
    </nav>
  </header>`;
}

function footerTemplate(){
  const root=location.pathname.includes('/legal/')?'../':'';
  return `<footer class="footer"><div class="container"><div class="row g-4"><div class="col-lg-4"><a class="brand" href="${root}index.html"><span class="brand-mark">B</span>BRAND NAME</a><p class="mt-3 small">Equipamiento técnico de running. Identidad y contenidos comerciales pendientes de definición.</p></div><div class="col-6 col-lg-2"><h2>Navegación</h2><ul class="list-unstyled"><li><a href="${root}index.html">Inicio</a></li><li><a href="${root}tienda.html">Tienda</a></li><li><a href="${root}sobre-nosotros.html">Sobre nosotros</a></li><li><a href="${root}contacto.html">Contacto</a></li></ul></div><div class="col-6 col-lg-2"><h2>Ayuda</h2><ul class="list-unstyled"><li><a href="${root}faq.html">Preguntas frecuentes</a></li><li><a href="${root}carrito.html">Carrito</a></li><li><a href="${root}cuenta.html">Mi cuenta</a></li><li><a href="${root}contacto.html">Contacto</a></li></ul></div><div class="col-6 col-lg-2"><h2>Legal</h2><ul class="list-unstyled"><li><a href="${root}legal/aviso-legal.html">Aviso legal</a></li><li><a href="${root}legal/privacidad.html">Privacidad</a></li><li><a href="${root}legal/cookies.html">Cookies</a></li><li><a href="${root}legal/condiciones-compra.html">Compra</a></li><li><a href="${root}legal/devoluciones.html">Devoluciones</a></li></ul></div><div class="col-6 col-lg-2"><h2>Social</h2><ul class="list-unstyled"><li><a href="#" aria-label="Instagram placeholder">Instagram</a></li><li><a href="#" aria-label="Strava placeholder">Strava</a></li><li><a href="#" aria-label="Facebook placeholder">Facebook</a></li></ul></div></div><div class="footer-bottom d-flex flex-wrap justify-content-between gap-2 mt-5 pt-3"><span>© <span data-year></span> BRAND NAME. Todos los derechos reservados.</span><span>Contenido e información provisional.</span></div></div></footer>`;
}

function showToast(message){
  let host=document.querySelector('.toast-container');
  if(!host){host=document.createElement('div');host.className='toast-container position-fixed bottom-0 end-0 p-3';document.body.append(host);}
  const toast=document.createElement('div');
  toast.className='toast align-items-center text-bg-dark border-0';
  toast.setAttribute('role','status');
  toast.innerHTML=`<div class="d-flex"><div class="toast-body">${message}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Cerrar"></button></div>`;
  host.append(toast);
  const instance=new bootstrap.Toast(toast,{delay:2400});
  toast.addEventListener('hidden.bs.toast',()=>toast.remove());
  instance.show();
}

function initForms(){document.querySelectorAll('[data-demo-form]').forEach(form=>form.addEventListener('submit',event=>{event.preventDefault();if(form.checkValidity()){form.classList.add('was-validated');showToast(form.dataset.message||'Formulario validado. Esta acción es una simulación.');form.reset();form.classList.remove('was-validated');}else{event.stopPropagation();form.classList.add('was-validated');}}));}

function initMobileNavigation(){
  const nav=document.querySelector('#siteNav');
  if(!nav)return;
  nav.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{
    if(window.innerWidth<992&&nav.classList.contains('show'))bootstrap.Collapse.getOrCreateInstance(nav).hide();
  }));
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, { credentials: 'same-origin', ...options, headers: { Accept: 'application/json', ...(options.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || body.message || 'No hemos podido completar la acción.');
  return body;
}

function getSafeRedirectUrl() {
  const params = new URLSearchParams(location.search);
  const redirect = params.get('redirect');
  if (!redirect) return null;
  const trimmed = redirect.trim();
  if (!trimmed) return null;
  // Disallow absolute protocols or scheme-relative paths (open redirect prevention)
  if (/^(?:[a-zA-Z][a-zA-Z0-9+.-]*:|\/\/)/.test(trimmed)) {
    return null;
  }
  // Disallow backslashes
  if (trimmed.includes('\\')) {
    return null;
  }
  return trimmed;
}

function updateAuthNavigation(user) {
  const root = location.pathname.includes('/legal/') ? '../' : '';
  const safeRedirect = getSafeRedirectUrl();
  const redirectParam = safeRedirect ? `?redirect=${encodeURIComponent(safeRedirect)}` : '';
  document.querySelectorAll('[data-auth-nav]').forEach(container => {
    const cart = `<a href="${root}carrito.html" class="cart-link d-none d-lg-inline-block" aria-label="Ver carrito">Carrito <span class="cart-badge" data-cart-count>0</span></a>`;
    const adminLink = (user && user.is_admin)
      ? `<a href="${root}admin.html" class="badge bg-dark text-white text-decoration-none px-2 py-1 small d-inline-flex align-items-center gap-1">⚙️ Admin</a>`
      : '';
    container.innerHTML = user
      ? `${adminLink}<a href="${root}cuenta.html" class="small fw-semibold">Mi cuenta</a><button type="button" class="btn btn-link btn-sm p-0 text-decoration-none" data-request-logout>Cerrar sesión</button>${cart}`
      : `<a href="${root}login.html${redirectParam}" class="small fw-semibold">Iniciar sesión</a><a href="${root}registro.html${redirectParam}" class="small fw-semibold">Crear cuenta</a>${cart}`;
  });
  updateCartCount();
}

async function loadCurrentUser() {
  try {
    const root = location.pathname.includes('/legal/') ? '../' : '';
    const session = await apiRequest(`${root}backend/api/me.php`);
    updateAuthNavigation(session.authenticated ? session.user : null);
    return session;
  } catch (error) {
    updateAuthNavigation(null);
    return { authenticated: false };
  }
}

function setFormMessage(form, message, type = 'danger') {
  let target = form.querySelector('[data-form-message]');
  if (!target) { target = document.createElement('div'); target.dataset.formMessage = ''; form.prepend(target); }
  target.className = `alert alert-${type} py-2`; target.textContent = message;
}

function ensureLogoutModal() {
  if (document.querySelector('#logoutModal')) return;
  document.body.insertAdjacentHTML('beforeend', `<div class="modal fade" id="logoutModal" tabindex="-1" aria-labelledby="logoutModalTitle" aria-hidden="true"><div class="modal-dialog modal-dialog-centered"><div class="modal-content"><div class="modal-header"><h2 class="modal-title h5" id="logoutModalTitle">¿Quieres cerrar sesión?</h2><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button></div><div class="modal-body text-secondary">Tendrás que volver a iniciar sesión para acceder a tu cuenta.</div><div class="modal-footer"><button type="button" class="btn btn-outline-dark" data-bs-dismiss="modal">Cancelar</button><button type="button" class="btn btn-primary" data-logout>Cerrar sesión</button></div></div></div></div>`);
}

function validatePasswordConfirmation(form) {
  const password = form.querySelector('[name="password"], [name="new_password"]');
  const confirmation = form.querySelector('[name="password_confirmation"]');
  if (confirmation && password) confirmation.setCustomValidity(confirmation.value && confirmation.value !== password.value ? 'Las contraseñas no coinciden.' : '');
}

function refreshFieldValidity(form) {
  form.querySelectorAll('input').forEach(input => input.addEventListener('input', () => validatePasswordConfirmation(form)));
}

function initAuthenticationForms() {
  const safeRedirect = getSafeRedirectUrl();
  if (safeRedirect) {
    document.querySelectorAll('[data-auth-switch]').forEach(link => {
      const baseHref = link.getAttribute('href').split('?')[0];
      link.setAttribute('href', `${baseHref}?redirect=${encodeURIComponent(safeRedirect)}`);
    });
  }

  const loginForm = document.querySelector('[data-login-form]');
  loginForm && refreshFieldValidity(loginForm);
  loginForm?.addEventListener('submit', async event => {
    event.preventDefault(); loginForm.classList.add('was-validated'); if (!loginForm.checkValidity()) return;
    try {
      await apiRequest('backend/api/login.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: loginForm.email.value, password: loginForm.password.value }) });
      const target = getSafeRedirectUrl();
      location.assign(target || 'cuenta.html');
    } catch (error) { setFormMessage(loginForm, error.message); }
  });

  const registerForm = document.querySelector('[data-register-form]');
  registerForm && refreshFieldValidity(registerForm);
  registerForm?.addEventListener('submit', async event => {
    event.preventDefault(); validatePasswordConfirmation(registerForm); registerForm.classList.add('was-validated'); if (!registerForm.checkValidity()) return;
    try {
      await apiRequest('backend/api/register.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: registerForm.name.value, email: registerForm.email.value, password: registerForm.password.value, password_confirmation: registerForm.password_confirmation.value }) });
      setFormMessage(registerForm, 'Cuenta creada correctamente. Redirigiendo al inicio de sesión…', 'success');
      registerForm.querySelectorAll('input').forEach(input => input.classList.remove('is-valid', 'is-invalid'));
      registerForm.classList.remove('was-validated');
      const target = safeRedirect ? `login.html?redirect=${encodeURIComponent(safeRedirect)}` : 'login.html';
      window.setTimeout(() => location.assign(target), 1400);
    } catch (error) { setFormMessage(registerForm, error.message); }
  });

  const profileForm = document.querySelector('[data-profile-form]');
  profileForm && refreshFieldValidity(profileForm);
  profileForm?.addEventListener('submit', async event => {
    event.preventDefault(); profileForm.classList.add('was-validated'); if (!profileForm.checkValidity()) return;
    try {
      const payload = {
        name: profileForm.name.value.trim(),
        phone: profileForm.phone ? profileForm.phone.value.trim() : '',
        address: profileForm.address ? profileForm.address.value.trim() : '',
        postal_code: profileForm.postal_code ? profileForm.postal_code.value.trim() : '',
        city: profileForm.city ? profileForm.city.value.trim() : '',
        province: profileForm.province ? profileForm.province.value.trim() : '',
      };
      const result = await apiRequest('backend/api/update-profile.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      setFormMessage(profileForm, result.message, 'success');
      await loadCurrentUser();
      initAccountPage();
    } catch (error) { setFormMessage(profileForm, error.message); }
  });

  const passwordForm = document.querySelector('[data-password-form]');
  passwordForm && refreshFieldValidity(passwordForm);
  passwordForm?.addEventListener('submit', async event => {
    event.preventDefault(); validatePasswordConfirmation(passwordForm); passwordForm.classList.add('was-validated'); if (!passwordForm.checkValidity()) return;
    try {
      const result = await apiRequest('backend/api/change-password.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ current_password: passwordForm.current_password.value, new_password: passwordForm.new_password.value, password_confirmation: passwordForm.password_confirmation.value }) });
      setFormMessage(passwordForm, result.message, 'success'); passwordForm.reset(); passwordForm.classList.remove('was-validated');
    } catch (error) { setFormMessage(passwordForm, error.message); }
  });

  const forgotForm = document.querySelector('[data-forgot-password-form]');
  forgotForm?.addEventListener('submit', async event => {
    event.preventDefault();
    forgotForm.classList.add('was-validated');
    if (!forgotForm.checkValidity()) return;
    const btn = forgotForm.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Enviando enlace…';
    try {
      const result = await apiRequest('backend/api/forgot-password.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotForm.email.value.trim() }),
      });
      setFormMessage(forgotForm, result.message, 'success');
      forgotForm.reset();
      forgotForm.classList.remove('was-validated');
    } catch (error) {
      setFormMessage(forgotForm, error.message);
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });

  const resetForm = document.querySelector('[data-reset-password-form]');
  if (resetForm) {
    refreshFieldValidity(resetForm);
    const params = new URLSearchParams(location.search);
    const token = params.get('token') || '';
    const email = params.get('email') || '';

    if (!token || !email) {
      setFormMessage(resetForm, 'El enlace de recuperación no es válido o está incompleto.');
      resetForm.querySelector('button[type="submit"]')?.setAttribute('disabled', 'true');
    } else {
      resetForm.token.value = token;
      resetForm.email.value = email;
    }

    resetForm.addEventListener('submit', async event => {
      event.preventDefault();
      validatePasswordConfirmation(resetForm);
      resetForm.classList.add('was-validated');
      if (!resetForm.checkValidity()) return;

      const btn = resetForm.querySelector('button[type="submit"]');
      const originalText = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Actualizando contraseña…';

      try {
        const payload = {
          token: resetForm.token.value.trim(),
          email: resetForm.email.value.trim(),
          password: resetForm.password.value,
          password_confirmation: resetForm.password_confirmation.value,
        };
        const result = await apiRequest('backend/api/reset-password.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        setFormMessage(resetForm, result.message + ' Redirigiendo al inicio de sesión…', 'success');
        resetForm.reset();
        resetForm.classList.remove('was-validated');
        window.setTimeout(() => location.assign('login.html'), 1800);
      } catch (error) {
        setFormMessage(resetForm, error.message);
        btn.disabled = false;
        btn.textContent = originalText;
      }
    });
  }

  document.addEventListener('click', async event => {
    if (event.target.closest('[data-request-logout]')) {
      ensureLogoutModal();
      bootstrap.Modal.getOrCreateInstance('#logoutModal').show();
      return;
    }
    if (!event.target.closest('[data-logout]')) return;
    try {
      const root = location.pathname.includes('/legal/') ? '../' : '';
      await apiRequest(`${root}backend/api/logout.php`, { method: 'POST' });
      updateAuthNavigation(null);
      bootstrap.Modal.getInstance('#logoutModal')?.hide();
      location.assign(`${root}login.html`);
    }
    catch (error) { showToast(error.message); }
  });
}

async function initAccountPage() {
  const account = document.querySelector('[data-account-page]');
  if (!account) return;
  const session = await loadCurrentUser();
  if (!session.authenticated) { location.replace('login.html'); return; }
  const u = session.user || {};
  account.querySelector('[data-user-name]').textContent = u.name || '';
  account.querySelector('[data-user-email]').textContent = u.email || '';
  const phoneDisplay = account.querySelector('[data-user-phone]');
  if (phoneDisplay) phoneDisplay.textContent = u.phone || 'No indicado';

  const addressSummary = account.querySelector('[data-user-address-summary]');
  if (addressSummary) {
    const parts = [u.address, [u.postal_code, u.city].filter(Boolean).join(' '), u.province].filter(Boolean);
    addressSummary.textContent = parts.length ? parts.join(', ') : 'No hay dirección guardada.';
    addressSummary.className = parts.length ? '' : 'text-secondary';
  }

  const setInputValue = (sel, val) => {
    const input = account.querySelector(sel);
    if (input) input.value = val || '';
  };
  setInputValue('[data-profile-name]', u.name);
  setInputValue('[data-profile-phone]', u.phone);
  setInputValue('[data-profile-address]', u.address);
  setInputValue('[data-profile-postal-code]', u.postal_code);
  setInputValue('[data-profile-city]', u.city);
  setInputValue('[data-profile-province]', u.province);

  account.hidden = false;
  if (typeof renderAccountOrders === 'function') renderAccountOrders();
}

function initContactForm() {
  const form = document.querySelector('[data-contact-form]');
  if (!form) return;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    form.classList.add('was-validated');
    if (!form.checkValidity()) return;

    const btn = form.querySelector('[data-contact-submit]') || form.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Enviando mensaje…';

    try {
      const payload = {
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        subject: form.subject.value.trim(),
        message: form.message.value.trim(),
      };
      const result = await apiRequest('backend/api/contact.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setFormMessage(form, result.message, 'success');
      form.reset();
      form.classList.remove('was-validated');
    } catch (error) {
      setFormMessage(form, error.message, 'danger');
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });
}

document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('[data-site-header]').forEach(el=>el.innerHTML=headerTemplate());
  document.querySelectorAll('[data-site-footer]').forEach(el=>el.innerHTML=footerTemplate());
  document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());
  updateCartCount();
  initForms();
  initMobileNavigation();
  initAuthenticationForms();
  initContactForm();
  ensureLogoutModal();
  loadCurrentUser();
  initAccountPage();
  document.addEventListener('click',event=>{const card=event.target.closest('.add-card');if(card)addToCart(card.dataset.id);});
});
