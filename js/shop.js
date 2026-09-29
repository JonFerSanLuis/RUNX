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
  const inStock = form.querySelector('[name="in_stock"]')?.checked;
  const pricePreset = filterValues(form, 'price_preset')[0] || filterValues(form, 'price')[0];

  let minPrice = form.querySelector('[name="min_price"]')?.value.trim();
  let maxPrice = form.querySelector('[name="max_price"]')?.value.trim();

  const prices = {
    under15: { max_price: 14.99 },
    '15to25': { min_price: 15, max_price: 25 },
    over25: { min_price: 25.01 },
  };

  const priceFilter = {};
  if (minPrice !== '' && minPrice !== undefined && !isNaN(minPrice)) priceFilter.min_price = Number(minPrice);
  if (maxPrice !== '' && maxPrice !== undefined && !isNaN(maxPrice)) priceFilter.max_price = Number(maxPrice);

  if (Object.keys(priceFilter).length === 0 && pricePreset && prices[pricePreset]) {
    Object.assign(priceFilter, prices[pricePreset]);
  }

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
    in_stock: inStock ? 'true' : undefined,
    color: filterValues(form, 'color').join(','),
    size: filterValues(form, 'size').join(','),
    ...priceFilter,
  };
}

function updateFilterCount() {
  const form = document.querySelector('[data-filter-form]');
  if (!form) return;
  const count = form.querySelectorAll('input:checked').length +
    (form.querySelector('[name="min_price"]')?.value ? 1 : 0) +
    (form.querySelector('[name="max_price"]')?.value ? 1 : 0);
  document.querySelectorAll('[data-filter-count]').forEach(el => {
    el.textContent = count;
    el.hidden = count === 0;
  });
}

function renderActiveFilterChips(params) {
  const bar = document.getElementById('activeFiltersBar');
  if (!bar) return;

  const chips = [];
  const form = document.querySelector('[data-filter-form]');

  if (params.category) {
    const catLabel = form?.querySelector(`[name="category"][value="${params.category}"]`)?.nextElementSibling?.textContent || params.category;
    chips.push(`<span class="active-filter-chip">Categoría: ${catLabel} <button type="button" aria-label="Quitar filtro" data-clear-one="category">×</button></span>`);
  }

  if (params.in_stock) {
    chips.push(`<span class="active-filter-chip">✓ Solo en stock <button type="button" aria-label="Quitar filtro" data-clear-one="in_stock">×</button></span>`);
  }

  if (params.min_price !== undefined || params.max_price !== undefined) {
    let pLabel = 'Precio: ';
    if (params.min_price !== undefined && params.max_price !== undefined) pLabel += `${params.min_price} € – ${params.max_price} €`;
    else if (params.min_price !== undefined) pLabel += `> ${params.min_price} €`;
    else if (params.max_price !== undefined) pLabel += `< ${params.max_price} €`;
    chips.push(`<span class="active-filter-chip">${pLabel} <button type="button" aria-label="Quitar filtro" data-clear-one="price">×</button></span>`);
  }

  if (params.color) {
    params.color.split(',').filter(Boolean).forEach(c => {
      chips.push(`<span class="active-filter-chip">Color: ${c} <button type="button" aria-label="Quitar filtro" data-clear-one="color" data-val="${c}">×</button></span>`);
    });
  }

  if (params.size) {
    params.size.split(',').filter(Boolean).forEach(s => {
      chips.push(`<span class="active-filter-chip">Talla: ${s} <button type="button" aria-label="Quitar filtro" data-clear-one="size" data-val="${s}">×</button></span>`);
    });
  }

  if (params.q) {
    chips.push(`<span class="active-filter-chip">"${params.q}" <button type="button" aria-label="Quitar filtro" data-clear-one="q">×</button></span>`);
  }

  if (chips.length) {
    chips.push(`<button type="button" class="btn btn-link btn-sm p-0 text-danger text-decoration-none ms-2 small fw-semibold" data-reset-filters>Limpiar todos</button>`);
    bar.innerHTML = chips.join('');
    bar.style.display = 'flex';
  } else {
    bar.innerHTML = '';
    bar.style.display = 'none';
  }
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

  const currentParams = shopParameters();
  renderActiveFilterChips(currentParams);

  grid.innerHTML = loadingMarkup();
  try {
    const body = await loadProducts(currentParams);
    const products = body.data;
    const searchQuery = currentParams.q;

    grid.innerHTML = products.length
      ? products.map(product => `<div class="col-6 col-md-4 col-lg-4">${productCard(product)}</div>`).join('')
      : `
        <div class="col-12">
          <div class="empty-state">
            <h2 class="h4">${searchQuery ? `No hay productos para "${searchQuery}"` : 'No hay productos con los filtros seleccionados'}</h2>
            <p class="text-secondary small">Prueba a desmarcar algunos filtros para ver más resultados.</p>
            <button type="button" class="btn btn-outline-dark mt-2" data-reset-filters>Restablecer filtros</button>
          </div>
        </div>
      `;

    document.querySelectorAll('[data-shop-count]').forEach(el => {
      el.textContent = `Mostrando ${products.length} de ${body.pagination.total} producto${body.pagination.total !== 1 ? 's' : ''}`;
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
  ['category', 'price_preset', 'price', 'color', 'size'].forEach(name => {
    const values = filterValues(from, name);
    to.querySelectorAll(`[name="${name}"]`).forEach(input => {
      input.checked = values.includes(input.value);
    });
  });

  const fromInStock = from.querySelector('[name="in_stock"]');
  const toInStock = to.querySelector('[name="in_stock"]');
  if (fromInStock && toInStock) toInStock.checked = fromInStock.checked;

  const fromMin = from.querySelector('[name="min_price"]');
  const toMin = to.querySelector('[name="min_price"]');
  if (fromMin && toMin) toMin.value = fromMin.value;

  const fromMax = from.querySelector('[name="max_price"]');
  const toMax = to.querySelector('[name="max_price"]');
  if (fromMax && toMax) toMax.value = fromMax.value;

  const fromQ = from.querySelector('[name="q"]');
  const toQ = to.querySelector('[name="q"]');
  if (fromQ && toQ) toQ.value = fromQ.value;
}

function resetFilters() {
  document.querySelectorAll('[data-filter-form] input, [data-mobile-filter-form] input').forEach(input => {
    if (input.type === 'radio') {
      input.checked = (input.name === 'price_preset' && input.value === 'all');
    } else if (input.type === 'checkbox') {
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
    const clearOne = event.target.closest('[data-clear-one]');
    if (clearOne) {
      const type = clearOne.dataset.clearOne;
      const val = clearOne.dataset.val;
      const form = document.querySelector('[data-filter-form]');
      if (type === 'category') {
        form?.querySelectorAll('[name="category"]').forEach(i => i.checked = false);
      } else if (type === 'in_stock') {
        const inp = form?.querySelector('[name="in_stock"]');
        if (inp) inp.checked = false;
      } else if (type === 'price') {
        form?.querySelectorAll('[name="price_preset"], [name="price"]').forEach(i => {
          i.checked = (i.name === 'price_preset' && i.value === 'all');
        });
        const minInp = form?.querySelector('[name="min_price"]');
        const maxInp = form?.querySelector('[name="max_price"]');
        if (minInp) minInp.value = '';
        if (maxInp) maxInp.value = '';
      } else if (type === 'color') {
        const inp = form?.querySelector(`[name="color"][value="${val}"]`);
        if (inp) inp.checked = false;
      } else if (type === 'size') {
        const inp = form?.querySelector(`[name="size"][value="${val}"]`);
        if (inp) inp.checked = false;
      } else if (type === 'q') {
        const inp = form?.querySelector('[name="q"]');
        if (inp) inp.value = '';
        history.replaceState({}, '', 'tienda.html');
      }
      currentPage = 1;
      renderShop();
      return;
    }

    const applyPriceBtn = event.target.closest('[data-apply-price]');
    if (applyPriceBtn) {
      const form = document.querySelector('[data-filter-form]');
      form?.querySelectorAll('[name="price_preset"]').forEach(i => i.checked = false);
      currentPage = 1;
      renderShop();
      return;
    }

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
