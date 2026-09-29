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

function updateCartCount() {
  const elements = document.querySelectorAll('[data-cart-count]');
  if (!elements.length) return;
  const count = (typeof getCart === 'function') ? getCart().reduce((sum, item) => sum + item.quantity, 0) : 0;
  elements.forEach(badge => { badge.textContent = count; });
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
  try {
    updateCartCount();
  } catch (e) {}
}

async function loadCurrentUser() {
  try {
    const root = location.pathname.includes('/legal/') ? '../' : '';
    const session = await apiRequest(`${root}backend/api/me.php`);
    try {
      updateAuthNavigation(session.authenticated ? session.user : null);
    } catch (navError) {
      console.warn('No se pudo actualizar el menú de navegación:', navError);
    }
    return session;
  } catch (error) {
    try {
      updateAuthNavigation(null);
    } catch (navError) {}
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
    const btn = loginForm.querySelector('button[type="submit"]');
    const originalText = btn ? btn.textContent : 'Entrar';
    if (btn) { btn.disabled = true; btn.textContent = 'Iniciando sesión…'; }
    try {
      await apiRequest('backend/api/login.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: loginForm.email.value.trim(), password: loginForm.password.value }) });
      setFormMessage(loginForm, 'Sesión iniciada correctamente. Accediendo…', 'success');
      const target = getSafeRedirectUrl();
      window.setTimeout(() => {
        location.assign(target || 'cuenta.html');
      }, 300);
    } catch (error) {
      setFormMessage(loginForm, error.message);
      if (btn) { btn.disabled = false; btn.textContent = originalText; }
    }
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

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function ensureQuickAddModal() {
  if (document.getElementById('quickAddModal')) return;
  const modal = document.createElement('div');
  modal.id = 'quickAddModal';
  modal.className = 'modal fade';
  modal.tabIndex = -1;
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = `
    <div class="modal-dialog modal-dialog-centered" style="max-width: 440px;">
      <div class="modal-content border-0 shadow">
        <div class="modal-header border-bottom-0 pb-0">
          <h5 class="modal-title fw-bold fs-6">Seleccionar Talla y Color</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
        </div>
        <div class="modal-body pt-2" id="quickAddModalBody">
          <div class="text-center py-4 text-secondary">
            <div class="spinner-border spinner-border-sm me-2"></div>Cargando opciones…
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

function openSizeGuideFromQuickAdd() {
  const quickModalEl = document.getElementById('quickAddModal');
  if (quickModalEl) {
    bootstrap.Modal.getInstance(quickModalEl)?.hide();
  }
  ensureSizeGuideModal();
  bootstrap.Modal.getOrCreateInstance(document.getElementById('sizeGuideModal')).show();
}

async function openQuickAddModal(productId) {
  ensureQuickAddModal();
  const modalEl = document.getElementById('quickAddModal');
  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
  const bodyEl = document.getElementById('quickAddModalBody');
  bodyEl.innerHTML = `
    <div class="text-center py-4 text-secondary">
      <div class="spinner-border spinner-border-sm me-2"></div>Cargando producto…
    </div>
  `;
  modal.show();

  try {
    const product = await getProduct(productId);
    if (!product) throw new Error('Producto no encontrado');

    const image = product.images?.[0] || 'assets/images/products-studio.png';
    const sizes = (product.sizes && product.sizes.length) ? product.sizes : ['Única'];
    const colors = (product.colors && product.colors.length) ? product.colors : ['Estándar'];

    let selectedSize = sizes[0];
    let selectedColor = colors[0];
    let selectedQty = 1;

    bodyEl.innerHTML = `
      <div class="d-flex gap-3 mb-3 align-items-center">
        <img src="${image}" alt="${escapeHtml(product.name)}" style="width: 74px; height: 74px; object-fit: cover; border-radius: 6px; background:#f4f4f4;">
        <div>
          <p class="small text-uppercase text-secondary mb-0 fw-semibold">${escapeHtml(product.category)}</p>
          <h6 class="fw-bold mb-1">${escapeHtml(product.name)}</h6>
          <div class="d-flex align-items-center gap-2">
            <strong class="text-primary">${formatPrice(product.price)}</strong>
            ${product.oldPrice ? `<span class="small text-muted text-decoration-line-through">${formatPrice(product.oldPrice)}</span>` : ''}
          </div>
        </div>
      </div>
      <hr class="my-2 text-muted opacity-25">

      ${colors.length > 1 ? `
        <div class="mb-3">
          <label class="form-label small fw-bold text-uppercase text-secondary mb-1">Color: <span class="text-dark fw-bold" id="quickAddSelectedColor">${escapeHtml(selectedColor)}</span></label>
          <div class="d-flex gap-2 flex-wrap" id="quickAddColors">
            ${colors.map((c, i) => `
              <button type="button" class="btn btn-sm btn-outline-dark quick-color-btn ${i === 0 ? 'active' : ''}" data-val="${escapeHtml(c)}">
                <span class="color-dot" style="background:${c === 'Blanco' ? '#f5f5f2' : c === 'Gris' ? '#7d8287' : c === 'Azul' ? '#235ee7' : '#151515'}"></span>${escapeHtml(c)}
              </button>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <div class="mb-3">
        <div class="d-flex justify-content-between align-items-center mb-1">
          <label class="form-label small fw-bold text-uppercase text-secondary mb-0">Talla: <span class="text-dark fw-bold" id="quickAddSelectedSize">${escapeHtml(selectedSize)}</span></label>
          <button type="button" class="btn btn-link btn-sm p-0 text-decoration-none small text-secondary" onclick="openSizeGuideFromQuickAdd()">
            📏 Guía de tallas
          </button>
        </div>
        <div class="d-flex gap-2 flex-wrap" id="quickAddSizes">
          ${sizes.map((s, i) => `
            <button type="button" class="btn btn-sm btn-outline-dark quick-size-btn ${i === 0 ? 'active' : ''}" data-val="${escapeHtml(s)}">
              ${escapeHtml(s)}
            </button>
          `).join('')}
        </div>
      </div>

      <div class="d-flex gap-2 align-items-center mt-4">
        <div class="quantity-control me-2">
          <button type="button" id="quickQtyMinus">−</button>
          <input id="quickQtyInput" value="1" readonly>
          <button type="button" id="quickQtyPlus">+</button>
        </div>
        <button type="button" class="btn btn-primary flex-grow-1 py-2 fw-semibold" id="quickAddSubmit">
          Añadir al carrito
        </button>
      </div>
    `;

    const colorButtons = bodyEl.querySelectorAll('.quick-color-btn');
    colorButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        colorButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedColor = btn.dataset.val;
        const span = bodyEl.querySelector('#quickAddSelectedColor');
        if (span) span.textContent = selectedColor;
      });
    });

    const sizeButtons = bodyEl.querySelectorAll('.quick-size-btn');
    sizeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        sizeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedSize = btn.dataset.val;
        bodyEl.querySelector('#quickAddSelectedSize').textContent = selectedSize;
      });
    });

    const qtyInput = bodyEl.querySelector('#quickQtyInput');
    bodyEl.querySelector('#quickQtyMinus').addEventListener('click', () => {
      selectedQty = Math.max(1, selectedQty - 1);
      qtyInput.value = selectedQty;
    });
    bodyEl.querySelector('#quickQtyPlus').addEventListener('click', () => {
      if (selectedQty < product.stock) {
        selectedQty += 1;
        qtyInput.value = selectedQty;
      } else {
        showToast(`Stock máximo disponible alcanzado (${product.stock} unidades).`);
      }
    });

    bodyEl.querySelector('#quickAddSubmit').addEventListener('click', () => {
      addToCart(product.id, selectedQty, {
        size: selectedSize,
        color: selectedColor !== 'Estándar' ? selectedColor : '',
      });
      modal.hide();
    });

  } catch (err) {
    bodyEl.innerHTML = `<div class="alert alert-danger mb-0">${err.message || 'Error al cargar opciones'}</div>`;
  }
}

function ensureSizeGuideModal() {
  if (document.getElementById('sizeGuideModal')) return;
  const modal = document.createElement('div');
  modal.id = 'sizeGuideModal';
  modal.className = 'modal fade';
  modal.tabIndex = -1;
  modal.setAttribute('aria-labelledby', 'sizeGuideModalLabel');
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = `
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content border-0 shadow">
        <div class="modal-header bg-light">
          <h5 class="modal-title fw-bold fs-6" id="sizeGuideModalLabel">📏 Guía Oficial de Tallas y Medidas</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
        </div>
        <div class="modal-body p-3 p-md-4">
          <ul class="nav nav-pills nav-fill mb-3 gap-2" id="sizeTabs" role="tablist">
            <li class="nav-item" role="presentation">
              <button class="nav-link active fw-bold small" id="socks-tab" data-bs-toggle="pill" data-bs-target="#tab-socks-content" type="button" role="tab">🧦 Calcetines Técnicos</button>
            </li>
            <li class="nav-item" role="presentation">
              <button class="nav-link fw-bold small" id="belts-tab" data-bs-toggle="pill" data-bs-target="#tab-belts-content" type="button" role="tab">🎽 Cinturones y Riñoneras</button>
            </li>
            <li class="nav-item" role="presentation">
              <button class="nav-link fw-bold small" id="measure-tab" data-bs-toggle="pill" data-bs-target="#tab-measure-content" type="button" role="tab">🦶 Cómo medir tu pie</button>
            </li>
          </ul>

          <div class="tab-content pt-2">
            <!-- Calcetines -->
            <div class="tab-pane fade show active" id="tab-socks-content" role="tabpanel">
              <div class="table-responsive">
                <table class="table table-bordered table-hover align-middle text-center small mb-3">
                  <thead class="table-dark">
                    <tr>
                      <th>Talla RUNX</th>
                      <th>Calzado EU</th>
                      <th>UK</th>
                      <th>US (Hombre / Mujer)</th>
                      <th>Longitud del pie</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong class="badge bg-primary fs-6">S</strong></td>
                      <td>35 – 38</td>
                      <td>2.5 – 5.0</td>
                      <td>US 4.5 – 6.5</td>
                      <td>22.0 – 24.0 cm</td>
                    </tr>
                    <tr>
                      <td><strong class="badge bg-primary fs-6">M</strong></td>
                      <td>39 – 42</td>
                      <td>5.5 – 8.0</td>
                      <td>US 7.0 – 9.0</td>
                      <td>24.5 – 27.0 cm</td>
                    </tr>
                    <tr>
                      <td><strong class="badge bg-primary fs-6">L</strong></td>
                      <td>43 – 46</td>
                      <td>8.5 – 11.5</td>
                      <td>US 9.5 – 12.5</td>
                      <td>27.5 – 30.0 cm</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="p-3 bg-light rounded border border-light-subtle small text-secondary">
                <strong class="text-dark d-block mb-1">💡 Consejo técnico runner:</strong>
                Nuestros calcetines cuentan con patronaje anatómico asimétrico (pie izquierdo / derecho) y banda elástica de sujeción en el arco plantar. Si estás en el límite entre dos tallas, elige la menor si buscas mayor ajuste y compresión para ritmos rápidos, o la mayor si prefieres mayor confort en tiradas largas.
              </div>
            </div>

            <!-- Cinturones -->
            <div class="tab-pane fade" id="tab-belts-content" role="tabpanel">
              <div class="table-responsive">
                <table class="table table-bordered table-hover align-middle text-center small mb-3">
                  <thead class="table-dark">
                    <tr>
                      <th>Accesorio</th>
                      <th>Talla</th>
                      <th>Contorno de cintura / cadera</th>
                      <th>Capacidad máxima</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Cinturón running Pace</strong></td>
                      <td><span class="badge bg-dark">Única (Ajustable)</span></td>
                      <td>65 cm – 105 cm</td>
                      <td>Móvil hasta 6.8", 2 geles, llaves, tarjeta</td>
                    </tr>
                    <tr>
                      <td><strong>Riñonera Trail Essential</strong></td>
                      <td><span class="badge bg-dark">Única (Regulable)</span></td>
                      <td>68 cm – 115 cm</td>
                      <td>Soft flask 250ml, cortavientos fino, móvil</td>
                    </tr>
                    <tr>
                      <td><strong>Banda porta-dorsal Race</strong></td>
                      <td><span class="badge bg-dark">Universal elástica</span></td>
                      <td>60 cm – 110 cm</td>
                      <td>Dorsal homologado + 6 geles energéticos</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="p-3 bg-light rounded border border-light-subtle small text-secondary">
                <strong class="text-dark d-block mb-1">💡 Ajuste anti-rebote:</strong>
                Para un rendimiento óptimo sin balanceo al correr, coloca el cinturón sobre la parte superior de las caderas, no en la cintura alta. La banda elástica técnica mantendrá el contenido firme contra el cuerpo sin oprimir la respiración diafragmática.
              </div>
            </div>

            <!-- Cómo medir tu pie -->
            <div class="tab-pane fade" id="tab-measure-content" role="tabpanel">
              <div class="row g-3">
                <div class="col-md-4 text-center p-3 border rounded bg-light">
                  <div class="fs-2 mb-2">📄</div>
                  <h6 class="fw-bold mb-1">1. Apoya el pie</h6>
                  <p class="small text-secondary mb-0">Coloca una hoja de papel en el suelo pegada a la pared. Apoya el talón contra la pared descalzo o con calcetín fino.</p>
                </div>
                <div class="col-md-4 text-center p-3 border rounded bg-light">
                  <div class="fs-2 mb-2">✏️</div>
                  <h6 class="fw-bold mb-1">2. Marca la punta</h6>
                  <p class="small text-secondary mb-0">Traza una marca recta con un lápiz delante del dedo más largo (suele ser el pulgar o el segundo dedo).</p>
                </div>
                <div class="col-md-4 text-center p-3 border rounded bg-light">
                  <div class="fs-2 mb-2">📏</div>
                  <h6 class="fw-bold mb-1">3. Mide en cm</h6>
                  <p class="small text-secondary mb-0">Mide la distancia desde el borde de la hoja hasta la marca. Si tienes dudas, mide ambos pies y quédate con el mayor.</p>
                </div>
              </div>
              <div class="alert alert-info mt-3 py-2 small mb-0">
                <strong>Importante para corredores:</strong> El pie tiende a expandirse y acumular volumen tras varios kilómetros de impacto. Para calcetines de maratón y trail se recomienda medio centímetro de holgura.
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer bg-light py-2">
          <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Entendido</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

function ensureRunnerAdvisorModal() {
  if (document.getElementById('runnerAdvisorModal')) return;
  const modal = document.createElement('div');
  modal.id = 'runnerAdvisorModal';
  modal.className = 'modal fade';
  modal.tabIndex = -1;
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = `
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content border-0 shadow">
        <div class="modal-header bg-dark text-white">
          <div class="d-flex align-items-center gap-2">
            <span class="fs-5">🏃‍♂️</span>
            <h5 class="modal-title fw-bold fs-6">Recomendador Técnico RUNX</h5>
          </div>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Cerrar"></button>
        </div>
        <div class="modal-body p-4" id="runnerAdvisorBody"></div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

function openRunnerAdvisorModal() {
  ensureRunnerAdvisorModal();
  const modalEl = document.getElementById('runnerAdvisorModal');
  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
  modal.show();

  let state = {
    step: 1,
    terrain: null,
    distance: null,
    priority: null,
  };

  const bodyEl = document.getElementById('runnerAdvisorBody');

  function renderStep() {
    if (state.step === 1) {
      bodyEl.innerHTML = `
        <div class="mb-4 text-center">
          <span class="badge bg-primary text-uppercase px-2 py-1 mb-2">Paso 1 de 3</span>
          <h4 class="fw-bold mb-1">¿Por qué terreno corres habitualmente?</h4>
          <p class="text-secondary small mb-0">La superficie determina el tipo de protección, amortiguación y sujeción que necesitas.</p>
        </div>
        <div class="row g-3">
          <div class="col-md-4">
            <button type="button" class="advisor-step-btn" data-advisor-choice="terrain" data-val="asfalto">
              <div class="fs-2 mb-2">🏙️</div>
              <h6 class="fw-bold mb-1">Asfalto y Ciudad</h6>
              <p class="small text-secondary mb-0">Superficies duras con impacto repetitivo. Cero fricción y amortiguación.</p>
            </button>
          </div>
          <div class="col-md-4">
            <button type="button" class="advisor-step-btn" data-advisor-choice="terrain" data-val="trail">
              <div class="fs-2 mb-2">🌲</div>
              <h6 class="fw-bold mb-1">Trail y Montaña</h6>
              <p class="small text-secondary mb-0">Desniveles, piedras y bajadas. Puntera reforzada y máxima durabilidad.</p>
            </button>
          </div>
          <div class="col-md-4">
            <button type="button" class="advisor-step-btn" data-advisor-choice="terrain" data-val="mixto">
              <div class="fs-2 mb-2">🏟️</div>
              <h6 class="fw-bold mb-1">Pista, Cinta o Mixto</h6>
              <p class="small text-secondary mb-0">Sesiones de ritmo, series y versatilidad. Ligereza y transpiración pura.</p>
            </button>
          </div>
        </div>
      `;
    } else if (state.step === 2) {
      bodyEl.innerHTML = `
        <div class="mb-4 text-center">
          <span class="badge bg-primary text-uppercase px-2 py-1 mb-2">Paso 2 de 3</span>
          <h4 class="fw-bold mb-1">¿Cuál es tu distancia habitual o próximo reto?</h4>
          <p class="text-secondary small mb-0">A mayor distancia, mayor es la dilatación del pie y el desgaste muscular.</p>
        </div>
        <div class="row g-3">
          <div class="col-md-4">
            <button type="button" class="advisor-step-btn" data-advisor-choice="distance" data-val="short">
              <div class="fs-2 mb-2">⚡</div>
              <h6 class="fw-bold mb-1">5K a 10K</h6>
              <p class="small text-secondary mb-0">Entrenamientos ágiles y ritmos vivos. Prioridad al contacto directo y ligereza.</p>
            </button>
          </div>
          <div class="col-md-4">
            <button type="button" class="advisor-step-btn" data-advisor-choice="distance" data-val="half">
              <div class="fs-2 mb-2">🎯</div>
              <h6 class="fw-bold mb-1">21K Media Maratón</h6>
              <p class="small text-secondary mb-0">El equilibrio perfecto entre soporte metatarsal, ajuste firme y confort.</p>
            </button>
          </div>
          <div class="col-md-4">
            <button type="button" class="advisor-step-btn" data-advisor-choice="distance" data-val="marathon">
              <div class="fs-2 mb-2">🏔️</div>
              <h6 class="fw-bold mb-1">42K Maratón o Ultras</h6>
              <p class="small text-secondary mb-0">Compresión gradual, resistencia extrema a la fricción y capacidad para geles/móvil.</p>
            </button>
          </div>
        </div>
        <div class="mt-4 text-center">
          <button type="button" class="btn btn-link btn-sm text-secondary" id="advisorPrevBtn">← Volver al paso anterior</button>
        </div>
      `;
    } else if (state.step === 3) {
      bodyEl.innerHTML = `
        <div class="mb-4 text-center">
          <span class="badge bg-primary text-uppercase px-2 py-1 mb-2">Paso 3 de 3</span>
          <h4 class="fw-bold mb-1">¿Cuál es tu necesidad principal o punto débil?</h4>
          <p class="text-secondary small mb-0">Selecciona el factor decisivo para afinar la recomendación.</p>
        </div>
        <div class="row g-3">
          <div class="col-md-6">
            <button type="button" class="advisor-step-btn" data-advisor-choice="priority" data-val="ampollas">
              <div class="d-flex align-items-center gap-3">
                <span class="fs-1">🛡️</span>
                <div>
                  <h6 class="fw-bold mb-1">Prevenir ampollas y rozaduras</h6>
                  <p class="small text-secondary mb-0">Fibras técnicas anti-fricción en talón y puntera sin costuras.</p>
                </div>
              </div>
            </button>
          </div>
          <div class="col-md-6">
            <button type="button" class="advisor-step-btn" data-advisor-choice="priority" data-val="compresion">
              <div class="d-flex align-items-center gap-3">
                <span class="fs-1">🔄</span>
                <div>
                  <h6 class="fw-bold mb-1">Compresión y fatiga muscular</h6>
                  <p class="small text-secondary mb-0">Soporte compresivo en gemelo y fascia para reducir la sobrecarga.</p>
                </div>
              </div>
            </button>
          </div>
          <div class="col-md-6">
            <button type="button" class="advisor-step-btn" data-advisor-choice="priority" data-val="ligereza">
              <div class="d-flex align-items-center gap-3">
                <span class="fs-1">💨</span>
                <div>
                  <h6 class="fw-bold mb-1">Máxima transpiración y ligereza</h6>
                  <p class="small text-secondary mb-0">Tejido microperforado para días calurosos y ritmos de competición.</p>
                </div>
              </div>
            </button>
          </div>
          <div class="col-md-6">
            <button type="button" class="advisor-step-btn" data-advisor-choice="priority" data-val="portar">
              <div class="d-flex align-items-center gap-3">
                <span class="fs-1">📱</span>
                <div>
                  <h6 class="fw-bold mb-1">Llevar móvil, geles y llaves</h6>
                  <p class="small text-secondary mb-0">Accesorios anti-rebote para correr con las manos 100% libres.</p>
                </div>
              </div>
            </button>
          </div>
        </div>
        <div class="mt-4 text-center">
          <button type="button" class="btn btn-link btn-sm text-secondary" id="advisorPrevBtn">← Volver al paso anterior</button>
        </div>
      `;
    } else if (state.step === 4) {
      renderResults();
    }

    bodyEl.querySelectorAll('[data-advisor-choice]').forEach(btn => {
      btn.addEventListener('click', () => {
        const choice = btn.dataset.advisorChoice;
        state[choice] = btn.dataset.val;
        state.step += 1;
        renderStep();
      });
    });

    const prevBtn = bodyEl.querySelector('#advisorPrevBtn');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        state.step -= 1;
        renderStep();
      });
    }
  }

  async function renderResults() {
    bodyEl.innerHTML = `
      <div class="text-center py-5">
        <div class="spinner-border text-primary mb-3" role="status"></div>
        <h5 class="fw-bold">Generando tu configuración técnica recomendada…</h5>
      </div>
    `;

    try {
      const allProductsRes = await requestProducts({ limit: 20 });
      const products = allProductsRes.data || [];

      let recommendedIds = [];
      let profileTitle = '';
      let profileDesc = '';

      if (state.priority === 'ampollas') {
        recommendedIds = [7, 1]; // Antiampollas Flow, Endurance
        profileTitle = 'Perfil: Protección Dérmica y Máximo Confort';
        profileDesc = 'Tu prioridad es mantener el pie seco y libre de fricción. Los modelos seleccionados cuentan con hilado técnico de doble densidad en zona de metatarsos y puntera sin relieve para garantizar cero ampollas incluso superados los 25 km.';
      } else if (state.priority === 'compresion') {
        recommendedIds = [9, 5]; // Compresión Tempo, Recovery Light
        profileTitle = 'Perfil: Rendimiento y Recuperación Muscular';
        profileDesc = 'Para absorber el impacto reiterado y optimizar la oxigenación celular, te recomendamos calcetines de compresión técnica gradual que estabilizan el tendón de Aquiles y minimizan la fatiga de sóleo y gemelo.';
      } else if (state.priority === 'portar') {
        recommendedIds = [2, 4]; // Cinturón Pace, Riñonera Trail Essential
        profileTitle = 'Perfil: Autonomía y Ergonomía en Carrera';
        profileDesc = 'Llevar avituallamiento, móvil y llaves no debe comprometer tu técnica de carrera. Estos accesorios reparten la masa sobre el centro de gravedad pélvico con sujeción elástica anti-balanceo.';
      } else {
        recommendedIds = [3, 5]; // Performance Crew, Recovery Light
        profileTitle = 'Perfil: Velocidad y Ligereza Pura';
        profileDesc = 'Diseñados para corredores que buscan sensación de pie descalzo y máxima evaporación del sudor con malla de ventilación activa en el empeine.';
      }

      if (state.terrain === 'trail' && !recommendedIds.includes(4)) {
        recommendedIds.push(4); // Riñonera Trail Essential
      }

      const matchingProducts = products.filter(p => recommendedIds.includes(p.id));
      if (!matchingProducts.length) {
        matchingProducts.push(...products.slice(0, 2));
      }

      bodyEl.innerHTML = `
        <div class="text-center mb-4">
          <span class="badge bg-success-subtle text-success border border-success-subtle px-3 py-1 fw-bold mb-2">✓ Recomendación Personalizada</span>
          <h4 class="fw-bold mb-1">${profileTitle}</h4>
          <p class="text-secondary small mx-auto" style="max-width: 620px;">${profileDesc}</p>
        </div>

        <div class="row g-3 mb-4">
          ${matchingProducts.map(p => {
            const img = p.images?.[0] || 'assets/images/products-studio.png';
            return `
              <div class="col-md-${matchingProducts.length === 1 ? '12' : '6'}">
                <div class="card h-100 border p-3 shadow-sm rounded-3">
                  <div class="d-flex gap-3 align-items-center mb-3">
                    <img src="${img}" alt="${escapeHtml(p.name)}" style="width: 72px; height: 72px; object-fit: cover; border-radius: 6px; background:#f4f4f4;">
                    <div>
                      <span class="badge bg-light text-dark border small">${escapeHtml(p.category)}</span>
                      <h6 class="fw-bold mb-1 mt-1">${escapeHtml(p.name)}</h6>
                      <strong class="text-primary">${formatPrice(p.price)}</strong>
                    </div>
                  </div>
                  <ul class="small text-secondary ps-3 mb-3">
                    ${(p.features || []).slice(0, 2).map(f => `<li>${escapeHtml(f)}</li>`).join('')}
                  </ul>
                  <div class="d-flex gap-2 mt-auto">
                    <a href="producto.html?id=${p.id}" class="btn btn-outline-dark btn-sm flex-grow-1">Ver producto</a>
                    <button type="button" class="btn btn-dark btn-sm px-3" data-open-quick-add="${p.id}">Añadir</button>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div class="text-center pt-2 border-top">
          <button type="button" class="btn btn-outline-secondary btn-sm" id="advisorRestartBtn">
            🔄 Probar otra combinación
          </button>
        </div>
      `;

      bodyEl.querySelector('#advisorRestartBtn')?.addEventListener('click', () => {
        state = { step: 1, terrain: null, distance: null, priority: null };
        renderStep();
      });

    } catch (err) {
      bodyEl.innerHTML = `<div class="alert alert-danger mb-0">${err.message || 'Error al buscar recomendaciones'}</div>`;
    }
  }

  renderStep();
}

document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('[data-site-header]').forEach(el=>el.innerHTML=headerTemplate());
  document.querySelectorAll('[data-site-footer]').forEach(el=>el.innerHTML=footerTemplate());
  document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());
  try { updateCartCount(); } catch (e) {}
  initForms();
  initMobileNavigation();
  initAuthenticationForms();
  initContactForm();
  ensureLogoutModal();
  ensureQuickAddModal();
  ensureSizeGuideModal();
  loadCurrentUser();
  initAccountPage();

  document.addEventListener('click', event => {
    const quickAddBtn = event.target.closest('[data-open-quick-add]');
    if (quickAddBtn) {
      openQuickAddModal(quickAddBtn.dataset.openQuickAdd);
      return;
    }

    const sizeGuideBtn = event.target.closest('[data-open-size-guide]');
    if (sizeGuideBtn) {
      ensureSizeGuideModal();
      bootstrap.Modal.getOrCreateInstance(document.getElementById('sizeGuideModal')).show();
      return;
    }

    const advisorBtn = event.target.closest('[data-open-advisor]');
    if (advisorBtn) {
      openRunnerAdvisorModal();
      return;
    }

    const card = event.target.closest('.add-card');
    if (card && typeof addToCart === 'function') {
      const size = card.dataset.defaultSize || 'Única';
      const color = card.dataset.defaultColor || '';
      addToCart(card.dataset.id, 1, { size, color });
    }
  });
});
