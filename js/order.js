function orderDate(value) {
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value.replace(' ', 'T')));
}

function orderItemsPayload() {
  return getCart().map(item => ({
    product_id: item.productId,
    quantity: item.quantity,
    size: item.size || null,
    color: item.color || null,
  }));
}

async function initCheckoutPage() {
  const checkout = document.querySelector('[data-checkout-page]');
  if (!checkout) return;

  const session = await loadCurrentUser();
  if (!session.authenticated) {
    location.replace('login.html?redirect=checkout.html');
    return;
  }

  const cart = getCart();
  if (!cart.length) {
    location.replace('carrito.html');
    return;
  }

  checkout.querySelector('[data-checkout-name]').textContent = session.user.name;
  checkout.querySelector('[data-checkout-email]').textContent = session.user.email;

  const user = session.user || {};
  const setIfEmpty = (id, val) => {
    const input = checkout.querySelector(id);
    if (input && !input.value && val) input.value = val;
  };

  setIfEmpty('#shippingName', user.name);
  setIfEmpty('#shippingPhone', user.phone);
  setIfEmpty('#shippingAddress', user.address);
  setIfEmpty('#shippingPostalCode', user.postal_code);
  setIfEmpty('#shippingCity', user.city);
  setIfEmpty('#shippingProvince', user.province);

  const items = await cartDetails();
  if (!items.length) {
    location.replace('carrito.html');
    return;
  }

  const subtotal = cartSubtotal(items);
  const shipping = subtotal >= 50 ? 0 : 4.95;
  const total = subtotal + shipping;

  checkout.querySelector('[data-order-summary]').innerHTML = `
    <div class="summary-card">
      <h2 class="h5 mb-3">Resumen del pedido</h2>
      <div class="small mb-3">
        ${items.map(item => {
          const variantText = [item.color, item.size].filter(Boolean).join(' · ');
          return `
            <div class="d-flex justify-content-between gap-2 mb-2 pb-2 border-bottom">
              <div>
                <div class="fw-semibold">${item.product.name} × ${item.quantity}</div>
                ${variantText ? `<div class="text-secondary small">${variantText}</div>` : ''}
              </div>
              <strong>${formatPrice(item.product.price * item.quantity)}</strong>
            </div>
          `;
        }).join('')}
      </div>
      <div class="d-flex justify-content-between my-2">
        <span>Subtotal</span>
        <strong>${formatPrice(subtotal)}</strong>
      </div>
      <div class="d-flex justify-content-between my-2">
        <span>Envío</span>
        <strong>${shipping ? formatPrice(shipping) : 'Gratis'}</strong>
      </div>
      <hr>
      <div class="d-flex justify-content-between h5 mb-2">
        <span>Total</span>
        <strong>${formatPrice(total)}</strong>
      </div>
      <p class="small text-secondary mb-0">
        ${shipping === 0 ? 'Envío estándar gratuito incluido.' : 'Envío estándar: 4,95 € (gratis a partir de 50 €).'}
      </p>
    </div>
  `;
  checkout.hidden = false;
  setupCheckoutPayment();
}

let stripeInstance = null;
let stripeElements = null;
let stripePaymentConfig = null;
let stripeIntentData = null;

async function setupCheckoutPayment() {
  const loadingEl = document.getElementById('payment-loading');
  const paymentEl = document.getElementById('payment-element');
  const mockEl = document.getElementById('mock-payment-element');
  const errorEl = document.getElementById('payment-error');

  if (!loadingEl) return;

  try {
    // 1. Obtener configuración pública de Stripe
    stripePaymentConfig = await apiRequest('backend/api/stripe-config.php');

    // 2. Obtener PaymentIntent o Intent simulado desde el backend
    const intentRes = await apiRequest('backend/api/stripe-create-intent.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: orderItemsPayload() }),
    });

    stripeIntentData = intentRes;

    // 3. Comprobar si se puede inicializar Stripe Elements real
    if (stripePaymentConfig.ready && typeof Stripe !== 'undefined' && stripePaymentConfig.public_key && !intentRes.mock) {
      stripeInstance = Stripe(stripePaymentConfig.public_key);
      stripeElements = stripeInstance.elements({
        clientSecret: intentRes.client_secret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#235ee7',
            colorBackground: '#ffffff',
            colorText: '#111315',
            colorDanger: '#dc3545',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            borderRadius: '4px',
          },
        },
      });

      const paymentElement = stripeElements.create('payment', {
        layout: 'tabs',
      });

      paymentElement.mount('#payment-element');
      loadingEl.classList.add('d-none');
      paymentEl.classList.remove('d-none');
    } else {
      // Modo de simulación local
      loadingEl.classList.add('d-none');
      if (mockEl) mockEl.classList.remove('d-none');
    }
  } catch (err) {
    if (loadingEl) loadingEl.classList.add('d-none');
    if (mockEl) mockEl.classList.remove('d-none');
    if (errorEl) {
      errorEl.textContent = 'Nota: Pasarela activa en modo local de pruebas (' + (err.message || 'Sin conexión externa') + ').';
      errorEl.classList.remove('d-none');
    }
  }
}

function initCheckoutForm() {
  const form = document.querySelector('[data-order-form]');
  if (!form) return;

  form.addEventListener('submit', async event => {
    event.preventDefault();
    form.classList.add('was-validated');

    if (!form.checkValidity()) {
      return;
    }

    const button = form.querySelector('button[type="submit"]');
    const originalButtonHtml = button.innerHTML;
    button.disabled = true;
    button.innerHTML = `
      <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
      <span>Procesando pago seguro…</span>
    `;

    const paymentErrorEl = document.getElementById('payment-error');
    if (paymentErrorEl) paymentErrorEl.classList.add('d-none');

    const shipping = {
      name: form.shipping_name.value.trim(),
      phone: form.shipping_phone.value.trim(),
      address: form.shipping_address.value.trim(),
      postal_code: form.shipping_postal_code.value.trim(),
      city: form.shipping_city.value.trim(),
      province: form.shipping_province.value.trim(),
      notes: form.shipping_notes ? form.shipping_notes.value.trim() : '',
    };

    let paymentIntentId = null;

    try {
      if (stripeInstance && stripeElements && stripeIntentData && !stripeIntentData.mock) {
        // Confirmar pago directamente con Stripe Elements
        const { error, paymentIntent } = await stripeInstance.confirmPayment({
          elements: stripeElements,
          redirect: 'if_required',
          confirmParams: {
            return_url: window.location.origin + window.location.pathname.replace('checkout.html', 'pedido.html'),
            payment_method_data: {
              billing_details: {
                name: shipping.name,
                phone: shipping.phone,
                address: {
                  line1: shipping.address,
                  city: shipping.city,
                  postal_code: shipping.postal_code,
                  state: shipping.province,
                  country: 'ES',
                },
              },
            },
          },
        });

        if (error) {
          throw new Error(error.message || 'El pago no ha podido completarse.');
        }

        if (paymentIntent && (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing')) {
          paymentIntentId = paymentIntent.id;
        } else {
          throw new Error('El estado del pago es ' + (paymentIntent ? paymentIntent.status : 'desconocido') + '.');
        }
      } else {
        // Simulación: retardo de 600ms para feedback visual realista
        await new Promise(resolve => setTimeout(resolve, 600));
        paymentIntentId = (stripeIntentData && stripeIntentData.id) ? stripeIntentData.id : ('mock_pi_' + Date.now());
      }

      // Crear y asentar el pedido en la base de datos
      const result = await apiRequest('backend/api/create-order.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: orderItemsPayload(),
          shipping: shipping,
          payment_intent_id: paymentIntentId,
          payment_method: (stripeInstance && stripeElements && !stripeIntentData.mock) ? 'card' : 'card_mock',
        }),
      });

      localStorage.removeItem(CART_KEY);
      updateCartCount();
      location.assign(`pedido.html?id=${result.order_id}&paid=1`);
    } catch (error) {
      if (paymentErrorEl) {
        paymentErrorEl.textContent = error.message;
        paymentErrorEl.classList.remove('d-none');
        paymentErrorEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        setFormMessage(form, error.message);
      }
      button.disabled = false;
      button.innerHTML = originalButtonHtml;
    }
  });
}

async function renderAccountOrders() {
  const target = document.querySelector('[data-orders-list]');
  if (!target) return;

  try {
    const result = await apiRequest('backend/api/orders.php');
    target.innerHTML = result.data.length
      ? `<div class="vstack gap-3">
          ${result.data.map(order => `
            <article class="border p-3 d-sm-flex justify-content-between align-items-center gap-3">
              <div>
                <h3 class="h6 mb-1">Pedido #${order.id}</h3>
                <p class="small text-secondary mb-0">${orderDate(order.created_at)} · ${order.status_label}</p>
              </div>
              <div class="d-flex align-items-center gap-3 mt-3 mt-sm-0">
                <strong>${formatPrice(order.total)}</strong>
                <a class="btn btn-outline-dark btn-sm" href="pedido.html?id=${order.id}">Ver pedido</a>
              </div>
            </article>
          `).join('')}
        </div>`
      : '<p class="text-secondary mb-0">Todavía no tienes pedidos.</p>';
  } catch (error) {
    target.innerHTML = '<p class="text-secondary mb-0">No hemos podido cargar tus pedidos.</p>';
  }
}

async function initOrderDetailPage() {
  const detail = document.querySelector('[data-order-detail-page]');
  if (!detail) return;

  const session = await loadCurrentUser();
  if (!session.authenticated) {
    location.replace('login.html');
    return;
  }

  const id = new URLSearchParams(location.search).get('id');
  if (!/^\d+$/.test(id || '')) {
    location.replace('cuenta.html');
    return;
  }

  try {
    const result = await apiRequest(`backend/api/order.php?id=${encodeURIComponent(id)}`);
    const order = result.data;

    const shippingInfo = order.shipping_details ? `
      <div class="border p-4 mt-4">
        <h3 class="h6 text-uppercase fw-bold text-secondary mb-3">Dirección de entrega</h3>
        <p class="mb-1"><span class="fw-semibold">Destinatario:</span> ${order.shipping_details.name}</p>
        <p class="mb-1"><span class="fw-semibold">Teléfono:</span> ${order.shipping_details.phone}</p>
        <p class="mb-1"><span class="fw-semibold">Dirección:</span> ${order.shipping_details.address}</p>
        <p class="mb-1"><span class="fw-semibold">Localidad:</span> ${order.shipping_details.postal_code} ${order.shipping_details.city} (${order.shipping_details.province})</p>
        ${order.shipping_details.notes ? `<p class="mb-0 mt-2 small text-secondary"><span class="fw-semibold">Notas:</span> ${order.shipping_details.notes}</p>` : ''}
      </div>
    ` : '';

    const isJustPaid = new URLSearchParams(location.search).get('paid') === '1';
    const paidAlert = isJustPaid ? `
      <div class="alert alert-success d-flex align-items-center gap-3 mb-4 shadow-sm" role="alert">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="text-success flex-shrink-0" viewBox="0 0 16 16">
          <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
        </svg>
        <div>
          <h4 class="h6 mb-1 fw-bold">¡Pago confirmado con éxito!</h4>
          <p class="small mb-0 text-secondary">Hemos registrado tu compra y te hemos enviado el comprobante oficial a tu correo electrónico.</p>
        </div>
      </div>
    ` : '';

    detail.querySelector('[data-order-detail]').innerHTML = `
      <section class="page-hero">
        <div class="container">
          <p class="eyebrow">Detalle del pedido</p>
          <h1 class="display-4">Pedido #${order.id}</h1>
          <p class="text-secondary mb-0">
            ${orderDate(order.created_at)} · 
            <span class="badge bg-dark">${order.status_label}</span> · 
            <span class="badge bg-success-subtle text-success border border-success-subtle">✓ ${order.payment_status_label || 'Pagado'}</span>
          </p>
        </div>
      </section>
      <section class="container section-pad">
        ${paidAlert}
        <div class="row g-4 g-lg-5">
          <div class="col-lg-8">
            <h2 class="h4 mb-3">Productos</h2>
            <div class="vstack gap-2">
              ${order.items.map(item => {
                const variantText = [item.color, item.size].filter(Boolean).join(' · ');
                return `
                  <div class="cart-row d-flex justify-content-between align-items-center gap-3">
                    <div>
                      <h3 class="h6 mb-1">${item.product_name}</h3>
                      ${variantText ? `<p class="small text-secondary mb-1">${variantText}</p>` : ''}
                      <p class="small text-secondary mb-0">${item.quantity} × ${formatPrice(item.unit_price)}</p>
                    </div>
                    <strong>${formatPrice(item.subtotal)}</strong>
                  </div>
                `;
              }).join('')}
            </div>
            ${shippingInfo}
          </div>
          <aside class="col-lg-4">
            <div class="summary-card">
              <h2 class="h5 mb-3">Resumen económico</h2>
              <div class="d-flex justify-content-between my-2">
                <span>Subtotal</span>
                <strong>${formatPrice(order.subtotal)}</strong>
              </div>
              <div class="d-flex justify-content-between my-2">
                <span>Envío</span>
                <strong>${Number(order.shipping) ? formatPrice(order.shipping) : 'Gratis'}</strong>
              </div>
              <hr>
              <div class="d-flex justify-content-between h5 mb-3">
                <span>Total</span>
                <strong>${formatPrice(order.total)}</strong>
              </div>
              <div class="border-top pt-3 small text-secondary">
                <div class="d-flex justify-content-between mb-1">
                  <span>Método de pago:</span>
                  <span class="text-dark fw-semibold">${order.payment_method_label || 'Tarjeta'}</span>
                </div>
                <div class="d-flex justify-content-between">
                  <span>Estado:</span>
                  <span class="text-success fw-bold">${order.payment_status_label || 'Pagado'}</span>
                </div>
              </div>
            </div>
            <a class="btn btn-outline-dark w-100 mt-4" href="cuenta.html#orders">Volver a mis pedidos</a>
          </aside>
        </div>
      </section>
    `;
    detail.hidden = false;
  } catch (error) {
    detail.querySelector('[data-order-detail]').innerHTML = `
      <section class="container section-pad">
        <div class="empty-state">
          <h1 class="h3">No hemos podido mostrar este pedido</h1>
          <p class="text-secondary">${error.message}</p>
          <a class="btn btn-primary" href="cuenta.html#orders">Volver a mi cuenta</a>
        </div>
      </section>
    `;
    detail.hidden = false;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initCheckoutPage();
  initCheckoutForm();
  initOrderDetailPage();
});
