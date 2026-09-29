let allOrdersData = [];
let allProductsData = [];
let allCategoriesData = [];
let activeOrderModal = null;
let activeProductModal = null;
let currentSelectedOrderId = null;

if (typeof orderDate !== 'function') {
  window.orderDate = function(value) {
    if (!value) return '';
    try {
      return new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(String(value).replace(' ', 'T')));
    } catch (e) {
      return String(value);
    }
  };
}

async function checkAdminAuth() {
  const deniedEl = document.getElementById('admin-access-denied');
  const contentEl = document.getElementById('admin-main-content');
  const userEl = document.querySelector('[data-admin-user]');
  const deniedMsg = document.getElementById('admin-denied-message');
  const loginRedirectBtn = document.getElementById('btn-admin-login-redirect');
  const logoutBtn = document.getElementById('btn-admin-logout');

  let session;
  try {
    session = await loadCurrentUser();
  } catch (err) {
    console.error('Error comprobando sesión de administrador:', err);
    session = { authenticated: false };
  }

  // 1. Si no hay sesión iniciada
  if (!session || !session.authenticated || !session.user) {
    if (userEl) userEl.textContent = 'No identificado';
    if (logoutBtn) logoutBtn.classList.add('d-none');
    if (deniedMsg) {
      deniedMsg.innerHTML = 'Para acceder al Panel de Administración debes iniciar sesión con una cuenta de administrador.';
    }
    if (loginRedirectBtn) {
      loginRedirectBtn.textContent = 'Iniciar sesión como administrador';
      loginRedirectBtn.href = 'login.html?redirect=admin.html';
    }
    if (deniedEl) deniedEl.classList.remove('d-none');
    if (contentEl) contentEl.classList.add('d-none');
    return false;
  }

  // 2. Si hay sesión iniciada pero no es administrador
  if (!session.user.is_admin) {
    if (userEl) {
      userEl.innerHTML = `<span class="badge bg-warning text-dark me-1">Usuario estándar</span> ${session.user.email}`;
    }
    if (deniedMsg) {
      deniedMsg.innerHTML = `Has iniciado sesión como <strong>${session.user.email}</strong>, pero esta cuenta no dispone de permisos de administrador.<br><span class="small text-muted mt-2 d-inline-block">Inicia sesión con una cuenta autorizada para acceder al panel.</span>`;
    }
    if (loginRedirectBtn) {
      loginRedirectBtn.textContent = 'Cambiar a cuenta de administrador';
      loginRedirectBtn.href = 'login.html?redirect=admin.html';
    }
    if (logoutBtn) logoutBtn.classList.remove('d-none');
    if (deniedEl) deniedEl.classList.remove('d-none');
    if (contentEl) contentEl.classList.add('d-none');
    return false;
  }

  // 3. Sesión activa con rol de administrador
  if (deniedEl) deniedEl.classList.add('d-none');
  if (contentEl) contentEl.classList.remove('d-none');
  if (logoutBtn) logoutBtn.classList.remove('d-none');
  if (userEl) {
    userEl.innerHTML = `<span class="badge bg-success me-1">Admin</span> ${session.user.name} <span class="text-white-50">(${session.user.email})</span>`;
  }
  return true;
}

// ----------------------------------------------------
// PESTAÑA 1: DASHBOARD
// ----------------------------------------------------
async function loadAdminStats() {
  try {
    const res = await apiRequest('backend/api/admin/stats.php');
    const m = res.metrics;

    document.getElementById('stat-revenue').textContent = m.revenue_total_label;
    document.getElementById('stat-total-orders').textContent = m.orders_total;
    document.getElementById('stat-pending-orders').textContent = m.orders_pending;
    document.getElementById('stat-customers').textContent = m.customers_total;
    document.getElementById('badge-pending-orders').textContent = m.orders_pending;
    document.getElementById('badge-total-products').textContent = m.products_total;

    // Alertas de stock bajo
    const lowStockContainer = document.getElementById('dashboard-low-stock-list');
    if (res.low_stock_products.length === 0) {
      lowStockContainer.innerHTML = '<p class="text-success small mb-0">✓ Todo el inventario tiene niveles óptimos de stock.</p>';
    } else {
      lowStockContainer.innerHTML = `
        <div class="list-group list-group-flush">
          ${res.low_stock_products.map(p => `
            <div class="list-group-item px-0 d-flex justify-content-between align-items-center">
              <div>
                <span class="fw-semibold text-dark">${p.name}</span>
                <div class="small text-secondary">${p.category_name || ''} · ${formatPrice(p.price)}</div>
              </div>
              <div class="text-end">
                <span class="badge ${Number(p.stock) === 0 ? 'bg-danger' : 'bg-warning text-dark'} mb-1">
                  ${Number(p.stock) === 0 ? 'Agotado (0)' : p.stock + ' ud.'}
                </span>
                <div>
                  <button class="btn btn-outline-dark btn-sm py-0 px-2 small" onclick="openEditProductModalById(${p.id})">Editar</button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    // Últimos pedidos en dashboard
    const recentOrdersContainer = document.getElementById('dashboard-recent-orders-list');
    if (res.recent_orders.length === 0) {
      recentOrdersContainer.innerHTML = '<tr><td colspan="5" class="text-center text-secondary py-3">Todavía no hay pedidos registrados.</td></tr>';
    } else {
      recentOrdersContainer.innerHTML = res.recent_orders.map(o => `
        <tr>
          <td><strong class="text-dark">#${o.id}</strong></td>
          <td>
            <div class="fw-semibold">${o.shipping_name || 'Cliente'}</div>
            <div class="small text-secondary">${o.shipping_city || ''}</div>
          </td>
          <td><strong>${formatPrice(o.total)}</strong></td>
          <td><span class="badge ${getStatusBadgeClass(o.status)}">${o.status_label}</span></td>
          <td class="text-end">
            <button class="btn btn-outline-dark btn-sm" onclick="openOrderModalById(${o.id})">Gestionar</button>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error('Error cargando stats:', err);
  }
}

// ----------------------------------------------------
// PESTAÑA 2: GESTIÓN DE PEDIDOS
// ----------------------------------------------------
async function loadAdminOrders(statusFilter = 'all', searchQuery = '') {
  const tbody = document.getElementById('orders-table-body');
  tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4 text-secondary"><div class="spinner-border spinner-border-sm me-2"></div>Cargando pedidos…</td></tr>';

  try {
    let url = 'backend/api/admin/orders.php';
    const params = new URLSearchParams();
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if ([...params.entries()].length) url += '?' + params.toString();

    const res = await apiRequest(url);
    allOrdersData = res.data;

    if (!allOrdersData.length) {
      tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4 text-secondary">No se han encontrado pedidos con los filtros seleccionados.</td></tr>';
      return;
    }

    tbody.innerHTML = allOrdersData.map(o => {
      const itemsSummary = o.items.map(i => `${i.quantity}x ${i.product_name}`).join(', ');
      const paymentBadge = o.payment_status === 'paid'
        ? '<span class="badge bg-success-subtle text-success border border-success-subtle">✓ Pagado</span>'
        : '<span class="badge bg-secondary">Pendiente</span>';

      return `
        <tr>
          <td><strong class="text-dark">#${o.id}</strong></td>
          <td class="small text-secondary">${orderDate(o.created_at)}</td>
          <td>
            <div class="fw-semibold text-dark">${o.shipping_details.name}</div>
            <div class="small text-secondary">${o.user_email || o.shipping_details.phone}</div>
          </td>
          <td class="small">
            <div>${o.shipping_details.city} (${o.shipping_details.province})</div>
          </td>
          <td class="small text-truncate" style="max-width: 220px;" title="${itemsSummary}">
            <span class="badge bg-light text-dark border me-1">${o.items_count} ud.</span>
            ${itemsSummary}
          </td>
          <td><strong>${formatPrice(o.total)}</strong></td>
          <td>${paymentBadge}</td>
          <td>
            <span class="badge ${getStatusBadgeClass(o.status)}">${o.status_label}</span>
            ${o.tracking.number ? `<div class="small text-muted mt-1 font-monospace">${o.tracking.number}</div>` : ''}
          </td>
          <td class="text-end">
            <div class="btn-group btn-group-sm">
              <button class="btn btn-outline-dark" onclick="openOrderModalById(${o.id})">
                Gestionar
              </button>
              <a href="backend/api/invoice.php?order_id=${o.id}&type=invoice" target="_blank" class="btn btn-outline-secondary" title="Factura Oficial PDF">
                📄
              </a>
              <a href="backend/api/invoice.php?order_id=${o.id}&type=packing_slip" target="_blank" class="btn btn-outline-secondary" title="Albarán de Envío / Picking">
                📦
              </a>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-danger">${err.message || 'Error cargando pedidos'}</td></tr>`;
  }
}

function getStatusBadgeClass(status) {
  switch (status) {
    case 'confirmed': return 'bg-primary';
    case 'shipped': return 'bg-info text-dark';
    case 'delivered': return 'bg-success';
    case 'cancelled': return 'bg-danger';
    case 'pending':
    default: return 'bg-warning text-dark';
  }
}

function openOrderModalById(orderId) {
  const order = allOrdersData.find(o => o.id === orderId);
  if (!order) return;

  currentSelectedOrderId = orderId;
  const modalEl = document.getElementById('orderModal');
  const titleEl = document.getElementById('orderModalTitle');
  const bodyEl = document.getElementById('orderModalBody');

  bodyEl.innerHTML = `
    <!-- Barra de documentos imprimibles -->
    <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 p-2 px-3 bg-light border rounded mb-2">
      <span class="small fw-bold text-secondary text-uppercase">Documentos PDF del pedido:</span>
      <div class="d-flex gap-2">
        <a href="backend/api/invoice.php?order_id=${order.id}&type=invoice" target="_blank" class="btn btn-outline-primary btn-sm">
          📄 Factura Oficial (PDF)
        </a>
        <a href="backend/api/invoice.php?order_id=${order.id}&type=packing_slip" target="_blank" class="btn btn-outline-dark btn-sm">
          📦 Albarán de Entrega (Picking)
        </a>
      </div>
    </div>

    <div class="row g-3">
      <!-- Datos del cliente y envío -->
      <div class="col-md-6">
        <div class="p-3 border rounded bg-light h-100">
          <h6 class="fw-bold mb-2 text-uppercase text-secondary small">Datos de Entrega</h6>
          <div><strong>Destinatario:</strong> ${order.shipping_details.name}</div>
          <div><strong>Teléfono:</strong> ${order.shipping_details.phone}</div>
          <div><strong>Dirección:</strong> ${order.shipping_details.address}</div>
          <div><strong>Localidad:</strong> ${order.shipping_details.postal_code} ${order.shipping_details.city} (${order.shipping_details.province})</div>
          ${order.shipping_details.notes ? `<div class="mt-2 small text-secondary"><strong>Notas:</strong> ${order.shipping_details.notes}</div>` : ''}
        </div>
      </div>

      <!-- Resumen económico y pago -->
      <div class="col-md-6">
        <div class="p-3 border rounded bg-light h-100">
          <h6 class="fw-bold mb-2 text-uppercase text-secondary small">Estado del Pago</h6>
          <div class="mb-1"><strong>Método:</strong> ${order.payment_method_label}</div>
          <div class="mb-1"><strong>Estado:</strong> <span class="badge ${order.payment_status === 'paid' ? 'bg-success' : 'bg-warning text-dark'}">${order.payment_status_label}</span></div>
          <div class="mb-1"><strong>Subtotal:</strong> ${formatPrice(Number(order.total) - Number(order.shipping_cost))}</div>
          <div class="mb-1"><strong>Envío:</strong> ${Number(order.shipping_cost) > 0 ? formatPrice(order.shipping_cost) : 'Gratis'}</div>
          <div class="h5 fw-bold mt-2">Total: ${formatPrice(order.total)}</div>
        </div>
      </div>

      <!-- Artículos del pedido -->
      <div class="col-12">
        <h6 class="fw-bold mb-2 text-uppercase text-secondary small">Productos del Pedido</h6>
        <div class="table-responsive border rounded">
          <table class="table table-sm align-middle mb-0">
            <thead class="table-light small">
              <tr>
                <th>Producto</th>
                <th>Variante</th>
                <th class="text-center">Cantidad</th>
                <th class="text-end">Precio unitario</th>
                <th class="text-end">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(i => `
                <tr>
                  <td><strong>${i.product_name}</strong></td>
                  <td class="small text-secondary">${[i.color, i.size].filter(Boolean).join(' · ') || 'Estándar'}</td>
                  <td class="text-center">${i.quantity}</td>
                  <td class="text-end">${formatPrice(i.unit_price)}</td>
                  <td class="text-end fw-bold">${formatPrice(i.subtotal)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Formulario de cambio de estado y tracking -->
      <div class="col-12">
        <div class="p-3 border rounded border-primary bg-primary-subtle mt-2">
          <h6 class="fw-bold mb-3 text-dark">📦 Actualizar Estado y Envío</h6>
          <div class="row g-2">
            <div class="col-md-4">
              <label class="form-label small fw-semibold">Estado del Pedido *</label>
              <select class="form-select form-select-sm" id="modal-order-status">
                <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pendiente</option>
                <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmado</option>
                <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Enviado</option>
                <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Entregado</option>
                <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelado</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label small fw-semibold">Empresa de Mensajería</label>
              <input type="text" class="form-control form-control-sm" id="modal-order-carrier" value="${order.tracking.carrier || 'Correos Express'}" placeholder="Correos, GLS, SEUR...">
            </div>
            <div class="col-md-4">
              <label class="form-label small fw-semibold">Nº de Seguimiento (Tracking)</label>
              <input type="text" class="form-control form-control-sm font-monospace" id="modal-order-tracking" value="${order.tracking.number || ''}" placeholder="Ej: CX123456789ES">
            </div>
            <div class="col-12 mt-2">
              <div class="form-check">
                <input class="form-check-input" type="checkbox" id="modal-order-notify" checked>
                <label class="form-check-label small" for="modal-order-notify">
                  Enviar email automático al cliente si se marca como <strong>Enviado</strong> (con número de seguimiento).
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  if (!activeOrderModal) {
    activeOrderModal = new bootstrap.Modal(modalEl);
  }
  activeOrderModal.show();
}

async function saveOrderStatusChanges() {
  if (!currentSelectedOrderId) return;

  const btn = document.getElementById('btn-save-order-status');
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Guardando…';

  const status = document.getElementById('modal-order-status').value;
  const carrier = document.getElementById('modal-order-carrier').value.trim();
  const tracking = document.getElementById('modal-order-tracking').value.trim();
  const notify = document.getElementById('modal-order-notify').checked;

  try {
    const res = await apiRequest('backend/api/admin/order-status.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: currentSelectedOrderId,
        status: status,
        tracking_carrier: carrier,
        tracking_number: tracking,
        notify_customer: notify,
      }),
    });

    if (typeof showToast === 'function') {
      showToast(res.message);
    } else {
      alert(res.message);
    }

    if (activeOrderModal) {
      activeOrderModal.hide();
    }

    // Refrescar órdenes y estadísticas
    loadAdminOrders();
    loadAdminStats();
  } catch (err) {
    alert(err.message || 'Error guardando estado');
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

// ----------------------------------------------------
// PESTAÑA 3: GESTIÓN DE PRODUCTOS
// ----------------------------------------------------
async function loadAdminProducts() {
  const tbody = document.getElementById('products-table-body');
  tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-secondary"><div class="spinner-border spinner-border-sm me-2"></div>Cargando catálogo…</td></tr>';

  try {
    const res = await apiRequest('backend/api/admin/products.php');
    allProductsData = res.products;
    allCategoriesData = res.categories;

    // Llenar selector de categorías del filtro y del modal
    const filterSelect = document.getElementById('products-category-filter');
    filterSelect.innerHTML = '<option value="all">Todas las categorías</option>' +
      allCategoriesData.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

    const modalCategorySelect = document.getElementById('prodCategory');
    modalCategorySelect.innerHTML = allCategoriesData.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

    renderProductsTable(allProductsData);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-danger">${err.message || 'Error cargando productos'}</td></tr>`;
  }
}

function renderProductsTable(products) {
  const tbody = document.getElementById('products-table-body');
  if (!products.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-secondary">No se han encontrado productos.</td></tr>';
    return;
  }

  tbody.innerHTML = products.map(p => {
    const stockBadge = Number(p.stock) === 0
      ? '<span class="badge bg-danger">Agotado (0)</span>'
      : (Number(p.stock) <= 5
        ? `<span class="badge bg-warning text-dark">${p.stock} ud. (Bajo)</span>`
        : `<span class="badge bg-success-subtle text-success border">${p.stock} ud.</span>`);

    const waitingAlertsBadge = Number(p.waiting_alerts_count || 0) > 0
      ? `<div class="mt-1"><span class="badge bg-warning-subtle text-dark border border-warning" title="${p.waiting_alerts_count} cliente(s) esperando reposición de stock">🔔 ${p.waiting_alerts_count} en espera</span></div>`
      : '';

    return `
      <tr class="${p.active ? '' : 'table-light text-muted'}">
        <td>
          <img src="${p.image_url}" alt="${p.name}" class="rounded" style="width: 48px; height: 48px; object-fit: cover;">
        </td>
        <td>
          <div class="fw-bold text-dark">${p.name}</div>
          <div class="small text-secondary font-monospace">${p.slug}</div>
        </td>
        <td><span class="badge bg-light text-dark border">${p.category_name}</span></td>
        <td>
          <strong>${formatPrice(p.price)}</strong>
          ${p.old_price ? `<div class="small text-secondary text-decoration-line-through">${formatPrice(p.old_price)}</div>` : ''}
        </td>
        <td>${stockBadge}${waitingAlertsBadge}</td>
        <td class="small">
          <span style="color:#dca616;">★</span> ${Number(p.rating).toFixed(1)} (${p.reviews_count})
        </td>
        <td>
          <button class="btn btn-sm ${p.active ? 'btn-outline-success' : 'btn-outline-secondary'}" onclick="toggleProductActive(${p.id})">
            ${p.active ? '✓ Activo' : 'Oculto'}
          </button>
        </td>
        <td class="text-end">
          <button class="btn btn-outline-dark btn-sm me-1" onclick="openEditProductModalById(${p.id})">
            Editar
          </button>
          <a class="btn btn-link btn-sm text-secondary" href="producto.html?id=${p.id}" target="_blank" title="Ver en tienda">
            ↗
          </a>
        </td>
      </tr>
    `;
  }).join('');
}

function openCreateProductModal() {
  const form = document.getElementById('product-form');
  form.reset();
  form.classList.remove('was-validated');
  document.getElementById('prodId').value = '';
  document.getElementById('productModalTitle').textContent = 'Añadir Nuevo Producto';

  const alertNotice = document.getElementById('prodStockAlertNotice');
  if (alertNotice) {
    alertNotice.classList.add('d-none');
    alertNotice.textContent = '';
  }

  const modalEl = document.getElementById('productModal');
  if (!activeProductModal) {
    activeProductModal = new bootstrap.Modal(modalEl);
  }
  activeProductModal.show();
}

function openEditProductModalById(productId) {
  const p = allProductsData.find(item => item.id === productId);
  if (!p) return;

  const form = document.getElementById('product-form');
  form.reset();
  form.classList.remove('was-validated');

  document.getElementById('prodId').value = p.id;
  document.getElementById('prodName').value = p.name;
  document.getElementById('prodCategory').value = p.category_id;
  document.getElementById('prodPrice').value = p.price;
  document.getElementById('prodOldPrice').value = p.old_price || '';
  document.getElementById('prodStock').value = p.stock;
  document.getElementById('prodImageUrl').value = p.image_url !== 'assets/images/products-studio.png' ? p.image_url : '';
  document.getElementById('prodDescription').value = p.description || '';
  document.getElementById('prodActive').checked = p.active;
  document.getElementById('prodFeatured').checked = p.featured;
  document.getElementById('prodBestseller').checked = p.bestseller;
  document.getElementById('prodIsNew').checked = p.is_new;

  const alertNotice = document.getElementById('prodStockAlertNotice');
  if (alertNotice) {
    const waiting = Number(p.waiting_alerts_count || 0);
    if (waiting > 0) {
      alertNotice.innerHTML = `🔔 <strong>${waiting} cliente(s) en lista de espera:</strong> Si aumentas el stock por encima de 0 y guardas los cambios, el sistema les enviará automáticamente un email de notificación para que puedan comprarlo.`;
      alertNotice.classList.remove('d-none');
    } else {
      alertNotice.classList.add('d-none');
      alertNotice.textContent = '';
    }
  }

  document.getElementById('productModalTitle').innerHTML = `Editar Producto <span class="text-primary">#${p.id}</span>`;

  const modalEl = document.getElementById('productModal');
  if (!activeProductModal) {
    activeProductModal = new bootstrap.Modal(modalEl);
  }
  activeProductModal.show();
}

async function handleSaveProduct(e) {
  e.preventDefault();
  const form = document.getElementById('product-form');
  form.classList.add('was-validated');
  if (!form.checkValidity()) return;

  const btn = document.getElementById('btn-save-product');
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Guardando…';

  const idVal = document.getElementById('prodId').value;
  const payload = {
    id: idVal ? Number(idVal) : null,
    name: document.getElementById('prodName').value.trim(),
    category_id: Number(document.getElementById('prodCategory').value),
    price: Number(document.getElementById('prodPrice').value),
    old_price: document.getElementById('prodOldPrice').value ? Number(document.getElementById('prodOldPrice').value) : null,
    stock: Number(document.getElementById('prodStock').value),
    image_url: document.getElementById('prodImageUrl').value.trim(),
    description: document.getElementById('prodDescription').value.trim(),
    active: document.getElementById('prodActive').checked,
    featured: document.getElementById('prodFeatured').checked,
    bestseller: document.getElementById('prodBestseller').checked,
    is_new: document.getElementById('prodIsNew').checked,
  };

  try {
    const res = await apiRequest('backend/api/admin/products.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (typeof showToast === 'function') {
      showToast(res.message);
    } else {
      alert(res.message);
    }

    if (activeProductModal) {
      activeProductModal.hide();
    }

    loadAdminProducts();
    loadAdminStats();
  } catch (err) {
    alert(err.message || 'Error guardando producto');
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

async function toggleProductActive(productId) {
  try {
    await apiRequest('backend/api/admin/products.php', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: productId }),
    });

    loadAdminProducts();
    loadAdminStats();
  } catch (err) {
    alert(err.message || 'Error cambiando estado');
  }
}

// ----------------------------------------------------
// INICIALIZACIÓN GENERAL
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const isAuthorized = await checkAdminAuth();
    if (!isAuthorized) return;

    // Cargar datos iniciales
    await Promise.allSettled([
      loadAdminStats(),
      loadAdminOrders(),
      loadAdminProducts(),
    ]);
  } catch (err) {
    console.error('Error inicializando panel admin:', err);
  }

  // Logout de administrador
  const logoutBtn = document.getElementById('btn-admin-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await apiRequest('backend/api/logout.php', { method: 'POST' });
      location.assign('login.html');
    });
  }

  // Refrescar órdenes
  const refreshBtn = document.getElementById('btn-refresh-orders');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => loadAdminOrders());
  }

  // Filtros de estado de órdenes
  const filterBtns = document.querySelectorAll('#orders-status-filters button');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        b.classList.remove('btn-dark');
        b.classList.add('btn-outline-dark');
      });
      btn.classList.remove('btn-outline-dark');
      btn.classList.add('btn-dark');

      const filter = btn.dataset.filter;
      const search = document.getElementById('orders-search-input').value;
      loadAdminOrders(filter, search);
    });
  });

  // Buscador de órdenes
  const searchOrdersInput = document.getElementById('orders-search-input');
  if (searchOrdersInput) {
    let timer;
    searchOrdersInput.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const activeFilter = document.querySelector('#orders-status-filters button.btn-dark')?.dataset.filter || 'all';
        loadAdminOrders(activeFilter, searchOrdersInput.value);
      }, 300);
    });
  }

  // Guardar cambios del modal de orden
  const saveOrderBtn = document.getElementById('btn-save-order-status');
  if (saveOrderBtn) {
    saveOrderBtn.addEventListener('click', saveOrderStatusChanges);
  }

  // Modal crear producto
  const createProdBtn = document.getElementById('btn-open-create-product');
  if (createProdBtn) {
    createProdBtn.addEventListener('click', openCreateProductModal);
  }

  // Formulario producto
  const productForm = document.getElementById('product-form');
  if (productForm) {
    productForm.addEventListener('submit', handleSaveProduct);
  }

  // Filtro de productos por categoría y buscador
  const prodSearch = document.getElementById('products-search-input');
  const prodCatFilter = document.getElementById('products-category-filter');

  const filterProductsLocal = () => {
    const q = (prodSearch?.value || '').toLowerCase().trim();
    const cat = prodCatFilter?.value || 'all';

    const filtered = allProductsData.filter(p => {
      const matchQ = !q || p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
      const matchCat = cat === 'all' || String(p.category_id) === cat;
      return matchQ && matchCat;
    });
    renderProductsTable(filtered);
  };

  if (prodSearch) prodSearch.addEventListener('input', filterProductsLocal);
  if (prodCatFilter) prodCatFilter.addEventListener('change', filterProductsLocal);
});
