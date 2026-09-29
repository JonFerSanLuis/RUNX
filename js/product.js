function productLoading() {
  return `
    <div class="container section-pad text-center">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando producto</span>
      </div>
      <p class="text-secondary mt-3">Cargando producto…</p>
    </div>
  `;
}

function productError(message) {
  return `
    <div class="container section-pad">
      <div class="empty-state">
        <h1 class="h3">${message}</h1>
        <p class="text-secondary">Comprueba la dirección o vuelve a la tienda.</p>
        <a href="tienda.html" class="btn btn-primary">Volver a la tienda</a>
      </div>
    </div>
  `;
}

async function renderProduct() {
  const root = document.querySelector('[data-product-detail]');
  if (!root) return;

  root.innerHTML = productLoading();
  const id = new URLSearchParams(location.search).get('id');
  if (!/^\d+$/.test(id || '')) {
    root.innerHTML = productError('Producto no encontrado');
    return;
  }

  let product;
  try {
    product = await getProduct(id);
  } catch (error) {
    root.innerHTML = productError(
      error.message === 'Producto no encontrado.'
        ? 'Producto no encontrado'
        : 'No hemos podido cargar el producto. Inténtalo de nuevo.'
    );
    return;
  }

  document.title = `${product.name} | BRAND NAME`;
  const images = product.images.length ? product.images : ['assets/images/products-studio.png'];

  let stockBadgeMarkup = '';
  if (product.stock <= 0) {
    stockBadgeMarkup = '<span class="badge bg-danger">Agotado</span>';
  } else if (product.stock <= 5) {
    stockBadgeMarkup = `<span class="badge bg-warning text-dark fw-bold">¡Solo quedan ${product.stock} unidades!</span>`;
  } else {
    stockBadgeMarkup = '<span class="badge bg-success-subtle text-success border border-success-subtle">En stock</span>';
  }

  let currentUserEmail = '';
  try {
    const session = await loadCurrentUser();
    if (session && session.authenticated && session.user && session.user.email) {
      currentUserEmail = session.user.email;
    }
  } catch (e) {}

  const isOutOfStock = product.stock <= 0;
  const buttonMarkup = isOutOfStock
    ? `
      <button class="btn btn-secondary w-100 py-3 mb-3" disabled>Producto agotado</button>
      <div class="card border border-warning-subtle bg-light p-3 rounded-3 shadow-sm" id="stock-alert-card">
        <div class="d-flex align-items-center gap-2 mb-2 text-dark">
          <h3 class="h6 mb-0 fw-bold">¿Quieres que te avisemos cuando haya stock?</h3>
        </div>
        <p class="small text-secondary mb-3">Introduce tu correo y te enviaremos una notificación automática en cuanto volvamos a tener unidades a la venta.</p>
        <form id="stock-alert-form" novalidate>
          <div class="input-group mb-1">
            <input type="email" class="form-control" id="stock-alert-email" placeholder="tu@email.com" value="${escapeHtml(currentUserEmail)}" required>
            <button class="btn btn-dark px-3 fw-semibold" type="submit" id="stock-alert-submit-btn">Avisarme</button>
          </div>
          <div id="stock-alert-feedback" class="small mt-2" style="display:none;"></div>
        </form>
      </div>
    `
    : `<button class="btn btn-dark w-100 py-3" data-add-product data-id="${product.id}">Añadir al carrito</button>`;

  root.innerHTML = `
    <div class="container section-pad">
      <div class="row g-4 g-lg-5">
        <div class="col-lg-6">
          <div class="product-gallery-main">
            <img src="${images[0]}" alt="${product.name}" data-main-image>
          </div>
          <div class="mt-3 d-flex gap-2" aria-label="Galería del producto">
            ${images
              .map(
                (image, index) => `
              <img class="thumbnail ${index ? '' : 'active'}" src="${image}" alt="Vista ${index + 1} de ${product.name}" data-gallery-image="${image}">
            `
              )
              .join('')}
          </div>
        </div>
        <div class="col-lg-5 offset-lg-1">
          <p class="product-category mb-2">${product.category}</p>
          <h1 class="display-5 fw-bold">${product.name}</h1>
          <div class="rating mb-3">
            <span class="stars">★★★★★</span> ${Number(product.rating).toFixed(1)}
            <a href="#reviews">${product.reviews} reseñas</a>
          </div>
          <div class="d-flex gap-2 align-items-center mb-4">
            <span class="h3 price mb-0">${formatPrice(product.price)}</span>
            ${product.oldPrice ? `<span class="old-price">${formatPrice(product.oldPrice)}</span>` : ''}
          </div>
          <p>${product.description}</p>
          <hr class="my-4">
          <fieldset class="mb-4">
            <legend class="h6">Color: <span data-selected-color>${product.colors[0] || 'Estándar'}</span></legend>
            <div class="d-flex gap-2 flex-wrap">
              ${(product.colors.length ? product.colors : ['Estándar'])
                .map(
                  (color, index) => `
                <button class="option-button color-option ${index ? '' : 'selected'}" data-value="${color}">
                  <span class="color-dot" style="background:${color === 'Blanco' ? '#f5f5f2' : color === 'Gris' ? '#7d8287' : color === 'Azul' ? '#235ee7' : '#151515'}"></span>${color}
                </button>
              `
                )
                .join('')}
            </div>
          </fieldset>
          <fieldset class="mb-4">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <legend class="h6 mb-0">Talla: <span data-selected-size>${product.sizes[0] || 'Única'}</span></legend>
              <button type="button" class="btn btn-link btn-sm p-0 text-decoration-none small text-secondary fw-semibold" data-open-size-guide>
                Guía de tallas
              </button>
            </div>
            <div class="d-flex gap-2 flex-wrap">
              ${(product.sizes.length ? product.sizes : ['Única'])
                .map(
                  (size, index) => `
                <button class="option-button size-option ${index ? '' : 'selected'}" data-value="${size}">${size}</button>
              `
                )
                .join('')}
            </div>
          </fieldset>
          <div class="d-flex align-items-center gap-3 mb-3">
            <div class="quantity-control">
              <button data-product-qty="-1" aria-label="Reducir cantidad" ${isOutOfStock ? 'disabled' : ''}>−</button>
              <input value="${isOutOfStock ? '0' : '1'}" aria-label="Cantidad" data-product-quantity readonly>
              <button data-product-qty="1" aria-label="Aumentar cantidad" ${isOutOfStock ? 'disabled' : ''}>+</button>
            </div>
            ${stockBadgeMarkup}
          </div>
          ${buttonMarkup}
          <section class="border-top mt-4 pt-3">
            <h2 class="h6">Características</h2>
            <ul class="small mb-0 ps-3">
              ${product.features.map(feature => `<li class="mb-1">${feature}</li>`).join('')}
            </ul>
          </section>
          <section class="border-top mt-4 pt-3 small">
            <p class="mb-2"><strong>Envío:</strong> Envío estándar por 4,95 € (gratis a partir de 50 €).</p>
            <p class="mb-0"><strong>Devoluciones:</strong> 30 días para cambios y devoluciones sin compromiso.</p>
          </section>
        </div>
      </div>
    </div>
    <section class="section-muted section-pad" id="reviews" data-product-reviews-section></section>
    <section class="section-pad">
      <div class="container">
        <div class="d-flex justify-content-between align-items-end mb-4">
          <div>
            <p class="eyebrow mb-1">Completa tu equipo</p>
            <h2 class="h1 fw-bold mb-0">También puede interesarte</h2>
          </div>
          <a href="tienda.html" class="fw-bold">Ver tienda</a>
        </div>
        <div class="row product-grid g-3 g-md-4" data-related-products></div>
      </div>
    </section>
  `;

  initProductReviews(product);

  let quantity = isOutOfStock ? 0 : 1;

  root.addEventListener('click', event => {
    const thumbnail = event.target.closest('[data-gallery-image]');
    if (thumbnail) {
      root.querySelector('[data-main-image]').src = thumbnail.dataset.galleryImage;
      root.querySelectorAll('[data-gallery-image]').forEach(img => img.classList.remove('active'));
      thumbnail.classList.add('active');
    }

    const option = event.target.closest('.color-option, .size-option');
    if (option) {
      const selector = option.classList.contains('color-option') ? '.color-option' : '.size-option';
      root.querySelectorAll(selector).forEach(btn => btn.classList.remove('selected'));
      option.classList.add('selected');
      root.querySelector(option.classList.contains('color-option') ? '[data-selected-color]' : '[data-selected-size]').textContent = option.dataset.value;
    }

    const delta = event.target.closest('[data-product-qty]');
    if (delta && !isOutOfStock) {
      const change = Number(delta.dataset.productQty);
      if (change > 0 && quantity >= product.stock) {
        showToast(`Solo hay ${product.stock} unidades disponibles de este producto.`);
      } else {
        quantity = Math.max(1, Math.min(product.stock, quantity + change));
        root.querySelector('[data-product-quantity]').value = quantity;
      }
    }

    const add = event.target.closest('[data-add-product]');
    if (add && product.stock > 0) {
      addToCart(product.id, quantity, {
        color: root.querySelector('.color-option.selected')?.dataset.value || '',
        size: root.querySelector('.size-option.selected')?.dataset.value || '',
      });
    }
  });

  const stockAlertForm = root.querySelector('#stock-alert-form');
  if (stockAlertForm) {
    stockAlertForm.addEventListener('submit', async event => {
      event.preventDefault();
      const emailInput = stockAlertForm.querySelector('#stock-alert-email');
      const feedback = stockAlertForm.querySelector('#stock-alert-feedback');
      const submitBtn = stockAlertForm.querySelector('#stock-alert-submit-btn');
      const emailVal = emailInput.value.trim();

      if (!emailVal || !emailInput.checkValidity()) {
        feedback.style.display = 'block';
        feedback.className = 'small mt-2 text-danger';
        feedback.textContent = 'Por favor, introduce una dirección de correo válida.';
        emailInput.focus();
        return;
      }

      const origText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Guardando…';
      feedback.style.display = 'none';

      try {
        const res = await apiRequest('backend/api/stock-alert.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product_id: product.id,
            email: emailVal,
          }),
        });

        feedback.style.display = 'block';
        feedback.className = 'small mt-2 text-success fw-semibold';
        feedback.textContent = res.message || '¡Anotado! Te avisaremos cuando vuelva a haber stock.';
        submitBtn.disabled = true;
        submitBtn.textContent = '✓ Registrado';
      } catch (err) {
        feedback.style.display = 'block';
        feedback.className = 'small mt-2 text-danger';
        feedback.textContent = err.message || 'No se ha podido registrar el aviso. Inténtalo de nuevo.';
        submitBtn.disabled = false;
        submitBtn.textContent = origText;
      }
    });
  }

  try {
    const related = await requestProducts({ category: product.categorySlug, limit: 4, sort: 'relevance' });
    const target = root.querySelector('[data-related-products]');
    if (target) {
      target.innerHTML = related.data
        .filter(item => item.id !== product.id)
        .slice(0, 3)
        .map(item => `<div class="col-6 col-md-4 col-lg-4">${productCard(item)}</div>`)
        .join('');
    }
  } catch (error) {
    console.error(error);
  }
}

function renderReviewStars(rating) {
  const full = Math.round(Number(rating) || 0);
  return '★'.repeat(Math.max(0, Math.min(5, full))) + '☆'.repeat(Math.max(0, 5 - full));
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

async function initProductReviews(product) {
  const container = document.querySelector('[data-product-reviews-section]');
  if (!container) return;

  async function loadReviews() {
    container.innerHTML = `
      <div class="container text-center py-4 text-secondary">
        <div class="spinner-border spinner-border-sm text-primary mb-2" role="status"></div>
        <div class="small">Cargando opiniones…</div>
      </div>
    `;

    try {
      const res = await apiRequest(`backend/api/reviews.php?product_id=${product.id}`);
      const stats = res.stats;
      const reviews = res.reviews;
      const userStatus = res.user_status;

      let actionButtonHtml = '';
      if (!userStatus.logged_in) {
        actionButtonHtml = `
          <a href="login.html?redirect=${encodeURIComponent('producto.html?id=' + product.id + '#reviews')}" class="btn btn-outline-dark btn-sm">
            Inicia sesión para opinar
          </a>
        `;
      } else if (userStatus.already_reviewed) {
        actionButtonHtml = `
          <span class="badge bg-success-subtle text-success border border-success-subtle py-2 px-3">
            ✓ Ya has valorado este producto
          </span>
        `;
      } else {
        actionButtonHtml = `
          <button class="btn btn-dark btn-sm" id="btn-toggle-review-form">
            Escribir una opinión
          </button>
        `;
      }

      container.innerHTML = `
        <div class="container">
          <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
            <div>
              <p class="eyebrow mb-1">Opiniones y Experiencias</p>
              <h2 class="h2 fw-bold mb-0">Valoraciones de clientes</h2>
            </div>
            <div>${actionButtonHtml}</div>
          </div>

          <div class="row g-4 mb-4">
            <div class="col-md-4 col-lg-3">
              <div class="bg-white p-4 text-center h-100 border">
                <div class="display-3 fw-bold mb-1">${stats.average > 0 ? stats.average.toFixed(1) : '—'}</div>
                <div class="stars mb-2" style="color:#dca616; font-size:1.4rem;">${renderReviewStars(stats.average)}</div>
                <p class="text-secondary small mb-0">${stats.total} ${stats.total === 1 ? 'opinión' : 'opiniones'}</p>
              </div>
            </div>
            <div class="col-md-8 col-lg-9">
              <div class="bg-white p-4 h-100 border">
                <h3 class="h6 fw-bold mb-3">Distribución de puntuaciones</h3>
                <div class="vstack gap-2">
                  ${[5, 4, 3, 2, 1].map(star => {
                    const row = stats.breakdown[star] || { count: 0, percent: 0 };
                    return `
                      <div class="d-flex align-items-center gap-2 small">
                        <span style="min-width: 45px;">${star} ★</span>
                        <div class="progress flex-grow-1" style="height: 8px;">
                          <div class="progress-bar bg-warning" role="progressbar" style="width: ${row.percent}%" aria-valuenow="${row.percent}" aria-valuemin="0" aria-valuemax="100"></div>
                        </div>
                        <span class="text-secondary text-end" style="min-width: 65px;">${row.count} (${row.percent}%)</span>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            </div>
          </div>

          <!-- Formulario de reseña desplegable -->
          <div id="review-form-card" class="bg-white p-4 border mb-4 d-none">
            <h3 class="h5 fw-bold mb-1">Comparte tu experiencia con este producto</h3>
            <p class="text-secondary small mb-3">Tu opinión ayuda a otros corredores a elegir el material adecuado.</p>
            ${userStatus.verified_purchase ? `
              <div class="badge bg-success-subtle text-success border border-success-subtle mb-3 p-2">
                ✓ Comprador verificado: Tu reseña lucirá el distintivo de compra real en la tienda
              </div>
            ` : ''}

            <form id="create-review-form" novalidate>
              <div class="mb-3">
                <label class="form-label fw-semibold small">Tu puntuación *</label>
                <div class="star-picker d-block" id="star-picker" data-rating="5">
                  <span class="star active" data-val="1">★</span>
                  <span class="star active" data-val="2">★</span>
                  <span class="star active" data-val="3">★</span>
                  <span class="star active" data-val="4">★</span>
                  <span class="star active" data-val="5">★</span>
                </div>
                <input type="hidden" name="rating" id="review-rating-input" value="5">
              </div>

              <div class="mb-3">
                <label for="reviewTitle" class="form-label fw-semibold small">Título (opcional)</label>
                <input type="text" class="form-control" id="reviewTitle" name="title" maxlength="120" placeholder="Ej: Comodidad inmejorable para distancias largas">
              </div>

              <div class="mb-3">
                <label for="reviewComment" class="form-label fw-semibold small">Tu opinión *</label>
                <textarea class="form-control" id="reviewComment" name="comment" rows="3" minlength="5" maxlength="1000" required placeholder="Cuéntanos qué tal se adaptan, ajuste, sensaciones al correr, durabilidad..."></textarea>
                <div class="invalid-feedback">Escribe al menos 5 caracteres.</div>
              </div>

              <div class="d-flex justify-content-end gap-2">
                <button type="button" class="btn btn-outline-secondary btn-sm" id="btn-cancel-review">Cancelar</button>
                <button type="submit" class="btn btn-primary btn-sm" id="btn-submit-review">Publicar opinión</button>
              </div>
            </form>
          </div>

          <!-- Listado de reseñas -->
          <div class="vstack gap-3">
            ${reviews.length ? reviews.map(r => `
              <article class="bg-white p-4 border">
                <div class="d-flex justify-content-between align-items-start mb-2 flex-wrap gap-2">
                  <div>
                    <div class="stars mb-1" style="color:#dca616;">${renderReviewStars(r.rating)}</div>
                    ${r.title ? `<h4 class="h6 fw-bold mb-1 text-dark">${escapeHtml(r.title)}</h4>` : ''}
                  </div>
                  <time class="small text-secondary" datetime="${r.created_at}">${orderDate(r.created_at)}</time>
                </div>
                <p class="mb-2 text-secondary" style="font-size: .95rem;">${escapeHtml(r.comment)}</p>
                <div class="d-flex align-items-center gap-2 small text-secondary">
                  <span class="fw-semibold text-dark">${escapeHtml(r.user_name)}</span>
                  ${r.verified_purchase ? `
                    <span class="badge bg-success-subtle text-success border border-success-subtle d-inline-flex align-items-center gap-1" style="font-size: .75rem;">
                      ✓ Compra verificada
                    </span>
                  ` : ''}
                </div>
              </article>
            `).join('') : `
              <div class="bg-white p-5 text-center border">
                <p class="text-secondary mb-2">Este producto todavía no tiene opiniones de clientes.</p>
                ${!userStatus.already_reviewed && userStatus.logged_in ? '<p class="small text-muted mb-0">¡Sé el primero en compartir tu experiencia!</p>' : ''}
              </div>
            `}
          </div>
        </div>
      `;

      // Event listener para mostrar formulario
      const toggleBtn = container.querySelector('#btn-toggle-review-form');
      const formCard = container.querySelector('#review-form-card');
      const cancelBtn = container.querySelector('#btn-cancel-review');

      if (toggleBtn && formCard) {
        toggleBtn.addEventListener('click', () => {
          formCard.classList.remove('d-none');
          toggleBtn.classList.add('d-none');
          formCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
      }

      if (cancelBtn && formCard && toggleBtn) {
        cancelBtn.addEventListener('click', () => {
          formCard.classList.add('d-none');
          toggleBtn.classList.remove('d-none');
        });
      }

      // Star picker interactivo
      const starPicker = container.querySelector('#star-picker');
      const ratingInput = container.querySelector('#review-rating-input');
      if (starPicker && ratingInput) {
        const stars = starPicker.querySelectorAll('.star');

        const updateStars = val => {
          stars.forEach(s => {
            const v = Number(s.dataset.val);
            if (v <= val) {
              s.classList.add('active');
            } else {
              s.classList.remove('active');
            }
          });
        };

        stars.forEach(star => {
          star.addEventListener('mouseenter', () => updateStars(Number(star.dataset.val)));
          star.addEventListener('click', () => {
            const val = Number(star.dataset.val);
            ratingInput.value = val;
            starPicker.dataset.rating = val;
            updateStars(val);
          });
        });

        starPicker.addEventListener('mouseleave', () => {
          updateStars(Number(starPicker.dataset.rating || 5));
        });
      }

      // Enviar reseña
      const reviewForm = container.querySelector('#create-review-form');
      if (reviewForm) {
        reviewForm.addEventListener('submit', async ev => {
          ev.preventDefault();
          reviewForm.classList.add('was-validated');
          if (!reviewForm.checkValidity()) return;

          const submitBtn = reviewForm.querySelector('#btn-submit-review');
          submitBtn.disabled = true;
          submitBtn.textContent = 'Publicando…';

          try {
            const payload = {
              product_id: product.id,
              rating: Number(reviewForm.rating.value),
              title: reviewForm.title.value.trim(),
              comment: reviewForm.comment.value.trim(),
            };

            const result = await apiRequest('backend/api/create-review.php', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });

            if (typeof showToast === 'function') {
              showToast(result.message || '¡Gracias por tu opinión!');
            }

            // Recargar sección de opiniones
            loadReviews();
          } catch (err) {
            alert(err.message || 'No se ha podido enviar la opinión.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Publicar opinión';
          }
        });
      }
    } catch (e) {
      container.innerHTML = `
        <div class="container text-center py-4 text-secondary">
          <p class="mb-0">No se han podido cargar las opiniones en este momento.</p>
        </div>
      `;
    }
  }

  loadReviews();
}

document.addEventListener('DOMContentLoaded', renderProduct);
