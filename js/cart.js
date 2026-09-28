const CART_KEY = 'brand-name-cart';

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
}

async function addToCart(productId, quantity = 1, variant = {}) {
  const cart = getCart();
  const size = variant.size || '';
  const color = variant.color || '';
  const key = `${productId}-${size}-${color}`;
  const found = cart.find(item => item.key === key);
  const currentQty = found ? found.quantity : 0;
  let addQty = Math.max(1, Number(quantity) || 1);

  try {
    const product = await getProduct(productId);
    if (product) {
      if (product.stock <= 0) {
        showToast('Este producto se encuentra agotado.');
        return;
      }
      if (currentQty + addQty > product.stock) {
        const remaining = product.stock - currentQty;
        if (remaining <= 0) {
          showToast(`Ya tienes el máximo disponible en tu carrito (${product.stock} unidades).`);
          return;
        }
        addQty = remaining;
        showToast(`Se han añadido ${addQty} unidades (stock máximo: ${product.stock}).`);
      } else {
        showToast('Producto añadido al carrito');
      }
    } else {
      showToast('Producto añadido al carrito');
    }
  } catch (e) {
    showToast('Producto añadido al carrito');
  }

  if (found) {
    found.quantity += addQty;
  } else {
    cart.push({
      key,
      productId: Number(productId),
      quantity: addQty,
      size,
      color,
    });
  }

  saveCart(cart);
}

function removeFromCart(key) {
  saveCart(getCart().filter(item => item.key !== key));
  renderCart();
}

async function updateQuantity(key, quantity) {
  const cart = getCart();
  const item = cart.find(item => item.key === key);
  if (item) {
    let targetQty = Math.max(1, Number(quantity) || 1);
    try {
      const product = await getProduct(item.productId);
      if (product && targetQty > product.stock) {
        showToast(`Stock máximo alcanzado (${product.stock} disponibles).`);
        targetQty = product.stock;
      }
    } catch (e) {
      // Ignorar si no se puede comprobar en este instante
    }
    item.quantity = targetQty;
    saveCart(cart);
  }
  renderCart();
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateCartCount();
  renderCart();
}

async function cartDetails() {
  const items = await Promise.all(
    getCart().map(async item => {
      try {
        const product = await getProduct(item.productId);
        return { ...item, product };
      } catch (error) {
        return null;
      }
    })
  );
  return items.filter(Boolean);
}

function cartSubtotal(items) {
  return items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
}

function updateCartCount() {
  const count = getCart().reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll('[data-cart-count]').forEach(el => (el.textContent = count));
}

function cartItemsMarkup(items) {
  return items
    .map(({ key, product, quantity, size, color }) => {
      const variantText = [color, size].filter(Boolean).join(' · ') || 'Variante estándar';
      const image = product.images?.[0] || 'assets/images/products-studio.png';

      return `
        <div class="cart-row d-flex gap-3">
          <img class="cart-thumb" src="${image}" alt="${product.name}">
          <div class="flex-grow-1">
            <a class="fw-bold" href="producto.html?id=${product.id}">${product.name}</a>
            <p class="small text-secondary mb-2">${variantText}</p>
            <span class="price">${formatPrice(product.price)}</span>
            <div class="mt-2">
              <div class="quantity-control">
                <button aria-label="Reducir cantidad" data-change-qty="${key}" data-delta="-1">−</button>
                <input aria-label="Cantidad" value="${quantity}" readonly>
                <button aria-label="Aumentar cantidad" data-change-qty="${key}" data-delta="1">+</button>
              </div>
            </div>
          </div>
          <div class="cart-row-total text-end">
            <strong>${formatPrice(product.price * quantity)}</strong>
            <button class="btn btn-link text-danger d-block small p-0 mt-3 ms-auto" data-remove-cart="${key}">Eliminar</button>
          </div>
        </div>
      `;
    })
    .join('');
}

function summaryMarkup(subtotal, checkout = false) {
  const shipping = subtotal >= 50 ? 0 : 4.95;
  const total = subtotal + shipping;
  const remaining = Math.max(0, 50 - subtotal);
  const shippingNote = subtotal >= 50
    ? '¡Genial! Tu pedido cuenta con envío gratuito.'
    : `Añade ${formatPrice(remaining)} más para conseguir envío gratuito (gratis a partir de 50 €).`;

  return `
    <div class="summary-card">
      <h2 class="h5 mb-3">Resumen del pedido</h2>
      <div class="d-flex justify-content-between my-2">
        <span>Subtotal</span>
        <strong>${formatPrice(subtotal)}</strong>
      </div>
      <div class="d-flex justify-content-between my-2">
        <span>Envío</span>
        <strong>${shipping === 0 ? 'Gratis' : formatPrice(shipping)}</strong>
      </div>
      <hr>
      <div class="d-flex justify-content-between h5 mb-2">
        <span>Total</span>
        <strong>${formatPrice(total)}</strong>
      </div>
      <p class="small text-secondary mb-3">${shippingNote}</p>
      ${checkout ? '' : '<a href="checkout.html" class="btn btn-primary w-100 py-2">Finalizar compra</a>'}
    </div>
  `;
}

async function renderCart() {
  const target = document.querySelector('[data-cart-content]');
  if (!target) return;

  const items = await cartDetails();
  if (!items.length) {
    target.innerHTML = getCart().length
      ? `<div class="empty-state">
          <h2>No hemos podido cargar tu carrito.</h2>
          <p class="text-secondary">Inténtalo de nuevo cuando el catálogo esté disponible.</p>
          <a href="carrito.html" class="btn btn-primary">Reintentar</a>
        </div>`
      : `<div class="empty-state">
          <h2>Tu carrito está vacío</h2>
          <p class="text-secondary">Añade productos de la colección para verlos aquí.</p>
          <a href="tienda.html" class="btn btn-primary">Ir a la tienda</a>
        </div>`;
    return;
  }

  const subtotal = cartSubtotal(items);
  target.innerHTML = `
    <div class="row g-4 g-lg-5">
      <div class="col-lg-8">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h2 class="h4 mb-0">Productos (${items.reduce((sum, item) => sum + item.quantity, 0)})</h2>
          <button class="btn btn-link text-danger p-0" data-clear-cart>Vaciar carrito</button>
        </div>
        ${cartItemsMarkup(items)}
      </div>
      <aside class="col-lg-4">
        ${summaryMarkup(subtotal)}
      </aside>
    </div>
  `;
}

async function renderCheckoutSummary() {
  const target = document.querySelector('[data-checkout-summary]');
  if (!target) return;

  const items = await cartDetails();
  const products = items.length
    ? `<div class="small mb-3">
        ${items
          .map(
            item => `
          <div class="d-flex justify-content-between gap-2 mb-2">
            <span>${item.product.name} × ${item.quantity}</span>
            <strong>${formatPrice(item.product.price * item.quantity)}</strong>
          </div>
        `
          )
          .join('')}
      </div>`
    : '<p class="small text-secondary">Tu carrito está vacío.</p>';

  const subtotal = cartSubtotal(items);
  target.innerHTML = `
    <div class="checkout-summary d-lg-none">
      <details>
        <summary>Ver resumen del pedido (${items.reduce((sum, item) => sum + item.quantity, 0)})</summary>
        <div>${products}${summaryMarkup(subtotal, true)}</div>
      </details>
    </div>
    <div class="d-none d-lg-block">${products}${summaryMarkup(subtotal, true)}</div>
  `;
}
