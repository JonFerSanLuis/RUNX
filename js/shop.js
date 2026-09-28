let currentPage = 1;
const PAGE_SIZE = 12;

function filterValues(form, name) {
  return [...form.querySelectorAll(`[name="${name}"]:checked`)].map(input => input.value);
}

function categorySlug(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '-');
}

function shopParameters() {
  const form = document.querySelector('[data-filter-form]');
  if (!form) return {};

  const category = filterValues(form, 'category')[0];
  const price = filterValues(form, 'price')[0];

  const prices = {
    under15: { max_price: 14.99 },
    '15to25': { min_price: 15, max_price: 25 },
    over25: { min_price: 25.01 },
  };

  const searchInput = form.querySelector('[name="q"]');
  const urlParam = new URLSearchParams(location.search).get('q') || '';
  const searchQuery = searchInput && searchInput.value.trim() !== '' ? searchInput.value.trim() : urlParam.trim();

  return {
    page: currentPage,
    limit: PAGE_SIZE,
    sort:
      document.querySelector('#sortProducts')?.value ||
      document.querySelector('#sortProductsDesktop')?.value ||
      'relevance',
    category: categorySlug(category),
    q: searchQuery,
    color: filterValues(form, 'color').join(','),
    size: filterValues(form, 'size').join(','),
    ...(prices[price] || {}),
  };
}

function updateFilterCount() {
  const form = document.querySelector('[data-filter-form]');
  if (!form) return;
  const count = form.querySelectorAll('input:checked').length;
  document.querySelectorAll('[data-filter-count]').forEach(el => {
    el.textContent = count;
    el.hidden = count === 0;
  });
}

function loadingMarkup() {
  return `
    <div class="col-12 py-5 text-center">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando productos</span>
      </div>
      <p class="text-secondary mt-3 mb-0">Cargando productos…</p>
    </div>
  `;
}

function errorMarkup() {
  return `
    <div class="col-12">
      <div class="empty-state">
        <h2 class="h4">No hemos podido cargar los productos.</h2>
        <p class="text-secondary">Inténtalo de nuevo.</p>
        <button class="btn btn-primary" data-retry-products>Reintentar</button>
      </div>
    </div>
  `;
}

async function renderShop() {
  const grid = document.querySelector('[data-product-grid]');
  if (!grid) return;

  grid.innerHTML = loadingMarkup();
  try {
    const body = await loadProducts(shopParameters());
    const products = body.data;
    const searchQuery = shopParameters().q;
    const searchNotice = searchQuery
      ? `<div class="col-12 mb-2"><div class="alert alert-light border d-flex justify-content-between align-items-center py-2 px-3"><span>Búsqueda: <strong>${searchQuery}</strong></span><button type="button" class="btn btn-outline-dark btn-sm py-1" data-reset-filters>Limpiar búsqueda</button></div></div>`
      : '';

    grid.innerHTML = products.length
      ? `${searchNotice}${products.map(product => `<div class="col-6 col-md-4 col-lg-3">${productCard(product)}</div>`).join('')}`
      : `
        <div class="col-12">
          <div class="empty-state">
            <h2 class="h4">${searchQuery ? `No hay productos para "${searchQuery}"` : 'No hay productos con estos filtros'}</h2>
            <a href="tienda.html" class="btn btn-outline-dark mt-2">Ver todo el catálogo</a>
          </div>
        </div>
      `;

    document.querySelectorAll('[data-shop-count]').forEach(el => {
      el.textContent = `${body.pagination.total} producto${body.pagination.total !== 1 ? 's' : ''}`;
    });
    renderPagination(body.pagination);
  } catch (error) {
    console.error(error);
    grid.innerHTML = errorMarkup();
    document.querySelectorAll('[data-shop-count]').forEach(el => (el.textContent = ''));
    const paginationEl = document.querySelector('[data-pagination]');
    if (paginationEl) paginationEl.innerHTML = '';
  }
  updateFilterCount();
}

function renderPagination(pagination) {
  const target = document.querySelector('[data-pagination]');
  if (!target) return;

  target.innerHTML =
    pagination.pages > 1
      ? `<ul class="pagination justify-content-center">
          ${Array.from(
            { length: pagination.pages },
            (_, index) => `
            <li class="page-item ${index + 1 === pagination.page ? 'active' : ''}">
              <button class="page-link" data-page="${index + 1}" aria-label="Página ${index + 1}">${index + 1}</button>
            </li>
          `
          ).join('')}
        </ul>`
      : '';
}

function copyFilterState(from, to) {
  ['category', 'price', 'color', 'size'].forEach(name => {
    const values = filterValues(from, name);
    to.querySelectorAll(`[name="${name}"]`).forEach(input => {
      input.checked = values.includes(input.value);
    });
  });
  const fromQ = from.querySelector('[name="q"]');
  const toQ = to.querySelector('[name="q"]');
  if (fromQ && toQ) toQ.value = fromQ.value;
}

function resetFilters() {
  document.querySelectorAll('[data-filter-form] input, [data-mobile-filter-form] input').forEach(input => {
    if (input.type === 'radio' || input.type === 'checkbox') {
      input.checked = false;
    } else {
      input.value = '';
    }
  });
  document.querySelectorAll('.site-search-form input[name="q"]').forEach(input => input.value = '');
  history.replaceState({}, '', 'tienda.html');
  currentPage = 1;
  renderShop();
}

function createMobileFilters() {
  const source = document.querySelector('[data-filter-form]');
  const root = document.querySelector('[data-mobile-filter-root]');
  if (!source || !root) return;

  root.innerHTML = '';
  const form = source.cloneNode(true);
  form.classList.remove('filter-panel');
  form.removeAttribute('data-filter-form');
  form.setAttribute('data-mobile-filter-form', '');
  form.querySelector('.d-flex')?.remove();

  form.querySelectorAll('[id]').forEach(input => {
    const previous = input.id;
    const replacement = `mobile-${previous}`;
    form.querySelectorAll(`label[for="${previous}"]`).forEach(label => (label.htmlFor = replacement));
    input.id = replacement;
  });

  const actions = document.createElement('div');
  actions.className = 'd-grid gap-2 mt-4';
  actions.innerHTML = `
    <button type="submit" class="btn btn-primary">Aplicar filtros</button>
    <button type="button" class="btn btn-outline-dark" data-reset-filters>Limpiar filtros</button>
  `;
  form.append(actions);
  root.append(form);

  document.querySelector('#mobileFilters')?.addEventListener('show.bs.offcanvas', () => {
    copyFilterState(source, form);
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    copyFilterState(form, source);
    currentPage = 1;
    renderShop();
    bootstrap.Offcanvas.getOrCreateInstance('#mobileFilters').hide();
  });
}

async function populateCategories(form) {
  const container = form.querySelector('[data-category-options]');
  if (!container) return;

  try {
    const categories = await loadCategories();
    if (!categories || !categories.length) {
      container.innerHTML = '<p class="small text-secondary mb-0">No hay categorías disponibles.</p>';
      return;
    }

    container.innerHTML = categories
      .map(
        cat => `
        <div class="form-check">
          <input class="form-check-input" type="radio" name="category" value="${cat.slug}" id="cat-${cat.slug}">
          <label class="form-check-label" for="cat-${cat.slug}">${cat.name}</label>
        </div>
      `
      )
      .join('');
  } catch (error) {
    console.error('Error al cargar categorías:', error);
    container.innerHTML = '<p class="small text-danger mb-0">No se pudieron cargar las categorías.</p>';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.querySelector('[data-filter-form]');
  if (!form) return;

  // 1. Cargar las categorías dinámicamente desde la API
  await populateCategories(form);

  // 2. Comprobar si hay una categoría en la query string (slug o nombre)
  const preset = new URLSearchParams(location.search).get('category');
  if (preset) {
    const targetSlug = categorySlug(preset);
    const input = form.querySelector(`[name="category"][value="${targetSlug}"]`);
    if (input) {
      input.checked = true;
    }
  }

  const presetSearch = new URLSearchParams(location.search).get('q');
  if (presetSearch) {
    const qInput = form.querySelector('[name="q"]');
    if (qInput) qInput.value = presetSearch;
  }

  // 3. Crear los filtros móviles a partir del formulario ya poblado
  createMobileFilters();

  // 4. Listeners para cambios
  form.addEventListener('change', event => {
    if (event.target.name === 'q') return;
    currentPage = 1;
    renderShop();
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    currentPage = 1;
    const qVal = form.querySelector('[name="q"]')?.value.trim();
    if (qVal) {
      history.replaceState({}, '', `tienda.html?q=${encodeURIComponent(qVal)}`);
    } else {
      history.replaceState({}, '', 'tienda.html');
    }
    renderShop();
  });

  document.querySelectorAll('#sortProducts, #sortProductsDesktop').forEach(select => {
    select.addEventListener('change', event => {
      document.querySelectorAll('#sortProducts, #sortProductsDesktop').forEach(other => {
        other.value = event.target.value;
      });
      currentPage = 1;
      renderShop();
    });
  });

  document.addEventListener('click', event => {
    const page = event.target.closest('[data-page]');
    if (page) {
      currentPage = Number(page.dataset.page);
      renderShop();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (event.target.closest('[data-reset-filters]')) {
      resetFilters();
    }
    if (event.target.closest('[data-retry-products]')) {
      renderShop();
    }
  });

  // 5. Render inicial de la tienda
  renderShop();
});
