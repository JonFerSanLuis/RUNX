function formatPrice(value){return new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(value);}

function headerTemplate(){
  const page=location.pathname.split('/').pop()||'index.html';
  const root=location.pathname.includes('/legal/')?'../':'';
  const active=key=>page===key?'active':'';
  return `<header class="site-header sticky-top"><nav class="navbar navbar-expand-lg"><div class="container"><a class="navbar-brand brand" href="${root}index.html"><span class="brand-mark">B</span>BRAND NAME</a><a href="${root}carrito.html" class="cart-link d-lg-none me-2" aria-label="Ver carrito">Carrito <span class="cart-badge" data-cart-count>0</span></a><button class="navbar-toggler border-0 p-1" type="button" data-bs-toggle="collapse" data-bs-target="#siteNav" aria-controls="siteNav" aria-expanded="false" aria-label="Abrir menú"><span class="navbar-toggler-icon"></span></button><div class="collapse navbar-collapse" id="siteNav"><ul class="navbar-nav mx-auto gap-lg-2"><li class="nav-item"><a class="nav-link ${active('index.html')}" href="${root}index.html">Inicio</a></li><li class="nav-item"><a class="nav-link ${active('tienda.html')||active('producto.html')}" href="${root}tienda.html">Tienda</a></li><li class="nav-item"><a class="nav-link" href="${root}tienda.html?category=Calcetines">Categorías</a></li><li class="nav-item"><a class="nav-link ${active('sobre-nosotros.html')}" href="${root}sobre-nosotros.html">Sobre nosotros</a></li><li class="nav-item"><a class="nav-link ${active('contacto.html')}" href="${root}contacto.html">Contacto</a></li><li class="nav-item d-lg-none"><a class="nav-link ${active('faq.html')}" href="${root}faq.html">FAQ</a></li></ul><div class="d-flex align-items-center gap-3"><a href="${root}login.html" class="small fw-semibold">Mi cuenta</a><a href="${root}carrito.html" class="cart-link d-none d-lg-inline-block" aria-label="Ver carrito">Carrito <span class="cart-badge" data-cart-count>0</span></a></div></div></div></nav></header>`;
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

document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('[data-site-header]').forEach(el=>el.innerHTML=headerTemplate());
  document.querySelectorAll('[data-site-footer]').forEach(el=>el.innerHTML=footerTemplate());
  document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());
  updateCartCount();
  initForms();
  initMobileNavigation();
  document.addEventListener('click',event=>{const card=event.target.closest('.add-card');if(card)addToCart(card.dataset.id);});
});
