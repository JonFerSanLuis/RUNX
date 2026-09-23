function formatPrice(value){return new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(value);}

function headerTemplate(){
  const page=location.pathname.split('/').pop()||'index.html';
  const root=location.pathname.includes('/legal/')?'../':'';
  const active=key=>page===key?'active':'';
  return `<header class="site-header sticky-top"><nav class="navbar navbar-expand-lg"><div class="container"><a class="navbar-brand brand" href="${root}index.html"><span class="brand-mark">B</span>BRAND NAME</a><a href="${root}carrito.html" class="cart-link d-lg-none me-2" aria-label="Ver carrito">Carrito <span class="cart-badge" data-cart-count>0</span></a><button class="navbar-toggler border-0 p-1" type="button" data-bs-toggle="collapse" data-bs-target="#siteNav" aria-controls="siteNav" aria-expanded="false" aria-label="Abrir menú"><span class="navbar-toggler-icon"></span></button><div class="collapse navbar-collapse" id="siteNav"><ul class="navbar-nav mx-auto gap-lg-2"><li class="nav-item"><a class="nav-link ${active('index.html')}" href="${root}index.html">Inicio</a></li><li class="nav-item"><a class="nav-link ${active('tienda.html')||active('producto.html')}" href="${root}tienda.html">Tienda</a></li><li class="nav-item"><a class="nav-link" href="${root}tienda.html?category=Calcetines">Categorías</a></li><li class="nav-item"><a class="nav-link ${active('sobre-nosotros.html')}" href="${root}sobre-nosotros.html">Sobre nosotros</a></li><li class="nav-item"><a class="nav-link ${active('contacto.html')}" href="${root}contacto.html">Contacto</a></li><li class="nav-item d-lg-none"><a class="nav-link ${active('faq.html')}" href="${root}faq.html">FAQ</a></li></ul><div class="d-flex align-items-center gap-3" data-auth-nav><a href="${root}login.html" class="small fw-semibold">Iniciar sesión</a><a href="${root}carrito.html" class="cart-link d-none d-lg-inline-block" aria-label="Ver carrito">Carrito <span class="cart-badge" data-cart-count>0</span></a></div></div></div></nav></header>`;
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

function updateAuthNavigation(user) {
  const root = location.pathname.includes('/legal/') ? '../' : '';
  document.querySelectorAll('[data-auth-nav]').forEach(container => {
    const cart = `<a href="${root}carrito.html" class="cart-link d-none d-lg-inline-block" aria-label="Ver carrito">Carrito <span class="cart-badge" data-cart-count>0</span></a>`;
    container.innerHTML = user
      ? `<a href="${root}cuenta.html" class="small fw-semibold">Mi cuenta</a><button type="button" class="btn btn-link btn-sm p-0 text-decoration-none" data-request-logout>Cerrar sesión</button>${cart}`
      : `<a href="${root}login.html" class="small fw-semibold">Iniciar sesión</a><a href="${root}registro.html" class="small fw-semibold">Crear cuenta</a>${cart}`;
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
  const loginForm = document.querySelector('[data-login-form]');
  loginForm && refreshFieldValidity(loginForm);
  loginForm?.addEventListener('submit', async event => {
    event.preventDefault(); loginForm.classList.add('was-validated'); if (!loginForm.checkValidity()) return;
    try {
      await apiRequest('backend/api/login.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: loginForm.email.value, password: loginForm.password.value }) });
      location.assign('cuenta.html');
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
      window.setTimeout(() => location.assign('login.html'), 1400);
    } catch (error) { setFormMessage(registerForm, error.message); }
  });

  const profileForm = document.querySelector('[data-profile-form]');
  profileForm && refreshFieldValidity(profileForm);
  profileForm?.addEventListener('submit', async event => {
    event.preventDefault(); profileForm.classList.add('was-validated'); if (!profileForm.checkValidity()) return;
    try {
      const result = await apiRequest('backend/api/update-profile.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: profileForm.name.value }) });
      document.querySelector('[data-user-name]').textContent = result.user.name;
      setFormMessage(profileForm, result.message, 'success');
      loadCurrentUser();
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
  account.querySelector('[data-user-name]').textContent = session.user.name;
  account.querySelector('[data-user-email]').textContent = session.user.email;
  account.querySelector('[data-profile-name]').value = session.user.name;
  account.hidden = false;
}

document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('[data-site-header]').forEach(el=>el.innerHTML=headerTemplate());
  document.querySelectorAll('[data-site-footer]').forEach(el=>el.innerHTML=footerTemplate());
  document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());
  updateCartCount();
  initForms();
  initMobileNavigation();
  initAuthenticationForms();
  ensureLogoutModal();
  loadCurrentUser();
  initAccountPage();
  document.addEventListener('click',event=>{const card=event.target.closest('.add-card');if(card)addToCart(card.dataset.id);});
});
