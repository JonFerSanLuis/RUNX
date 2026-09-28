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
    location.replace('login.html');
    return;
  }

  const cart = getCart();
  if (!cart.length) {
    location.replace('carrito.html');
    return;
  }

  checkout.querySelector('[data-checkout-name]').textContent = session.user.name;
  checkout.querySelector('[data-checkout-email]').textContent = session.user.email;

  const shippingNameInput = checkout.querySelector('#shippingName');
  if (shippingNameInput && !shippingNameInput.value) {
    shippingNameInput.value = session.user.name;
  }

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
    button.disabled = true;
    button.textContent = 'Confirmando pedido…';

    const shipping = {
      name: form.shipping_name.value.trim(),
      phone: form.shipping_phone.value.trim(),
      address: form.shipping_address.value.trim(),
      postal_code: form.shipping_postal_code.value.trim(),
      city: form.shipping_city.value.trim(),
      province: form.shipping_province.value.trim(),
      notes: form.shipping_notes ? form.shipping_notes.value.trim() : '',
    };

    try {
      const result = await apiRequest('backend/api/create-order.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: orderItemsPayload(),
          shipping: shipping,
        }),
      });

      localStorage.removeItem(CART_KEY);
      updateCartCount();
      location.assign(`pedido.html?id=${result.order_id}`);
    } catch (error) {
      setFormMessage(form, error.message);
      button.disabled = false;
      button.textContent = 'Confirmar pedido';
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

    detail.querySelector('[data-order-detail]').innerHTML = `
      <section class="page-hero">
        <div class="container">
          <p class="eyebrow">Detalle del pedido</p>
          <h1 class="display-4">Pedido #${order.id}</h1>
          <p class="text-secondary mb-0">${orderDate(order.created_at)} · <span class="badge bg-dark">${order.status_label}</span></p>
        </div>
      </section>
      <section class="container section-pad">
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
              <div class="d-flex justify-content-between h5">
                <span>Total</span>
                <strong>${formatPrice(order.total)}</strong>
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
