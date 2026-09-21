const CART_KEY='brand-name-cart';

function getCart(){try{return JSON.parse(localStorage.getItem(CART_KEY))||[];}catch{return [];}}
function saveCart(cart){localStorage.setItem(CART_KEY,JSON.stringify(cart));updateCartCount();}
function addToCart(productId,quantity=1,variant={}){const cart=getCart();const key=`${productId}-${variant.size||''}-${variant.color||''}`;const found=cart.find(item=>item.key===key);if(found)found.quantity+=Number(quantity);else cart.push({key,productId:Number(productId),quantity:Number(quantity),size:variant.size||'',color:variant.color||''});saveCart(cart);showToast('Producto añadido al carrito');}
function removeFromCart(key){saveCart(getCart().filter(item=>item.key!==key));renderCart();}
function updateQuantity(key,quantity){const cart=getCart();const item=cart.find(item=>item.key===key);if(item){item.quantity=Math.max(1,Number(quantity)||1);saveCart(cart);}renderCart();}
function clearCart(){localStorage.removeItem(CART_KEY);updateCartCount();renderCart();}
function cartDetails(){return getCart().map(item=>({...item,product:getProduct(item.productId)})).filter(item=>item.product);}
function cartSubtotal(){return cartDetails().reduce((sum,item)=>sum+item.product.price*item.quantity,0);}
function updateCartCount(){const count=getCart().reduce((sum,item)=>sum+item.quantity,0);document.querySelectorAll('[data-cart-count]').forEach(el=>el.textContent=count);}

function cartItemsMarkup(items){return items.map(({key,product,quantity,size,color})=>`<div class="cart-row d-flex gap-3"><img class="cart-thumb" src="${product.images[0]}" alt="${product.name}"><div class="flex-grow-1"><a class="fw-bold" href="producto.html?id=${product.id}">${product.name}</a><p class="small text-secondary mb-2">${[color,size].filter(Boolean).join(' · ')||'Variante estándar'}</p><span class="price">${formatPrice(product.price)}</span><div class="mt-2"><div class="quantity-control"><button aria-label="Reducir cantidad" data-change-qty="${key}" data-delta="-1">−</button><input aria-label="Cantidad" value="${quantity}" readonly><button aria-label="Aumentar cantidad" data-change-qty="${key}" data-delta="1">+</button></div></div></div><div class="cart-row-total text-end"><strong>${formatPrice(product.price*quantity)}</strong><button class="btn btn-link text-danger d-block small p-0 mt-3 ms-auto" data-remove-cart="${key}">Eliminar</button></div></div>`).join('');}

function summaryMarkup(subtotal,checkout=false){return `<div class="summary-card"><h2 class="h5">${checkout?'Resumen del pedido':'Resumen del pedido'}</h2><div class="d-flex justify-content-between my-3"><span>Subtotal</span><strong>${formatPrice(subtotal)}</strong></div><div class="d-flex justify-content-between my-3"><span>Envío</span><span class="text-secondary small">Por calcular</span></div><hr><div class="d-flex justify-content-between h5"><span>Total</span><strong>${formatPrice(subtotal)}</strong></div><p class="small text-secondary mb-0">El importe del envío se mostrará cuando se definan las condiciones comerciales.</p>${checkout?'':'<a href="checkout.html" class="btn btn-primary w-100 mt-3">Finalizar compra</a>'}</div>`;}

function renderCart(){
  const target=document.querySelector('[data-cart-content]');
  if(!target)return;
  const items=cartDetails();
  if(!items.length){target.innerHTML=`<div class="empty-state"><h2>Tu carrito está vacío</h2><p class="text-secondary">Añade productos de la colección para verlos aquí.</p><a href="tienda.html" class="btn btn-primary">Ir a la tienda</a></div>`;return;}
  const subtotal=cartSubtotal();
  target.innerHTML=`<div class="row g-4 g-lg-5"><div class="col-lg-8"><div class="d-flex justify-content-between align-items-center mb-3"><h2 class="h4 mb-0">Productos (${items.reduce((sum,item)=>sum+item.quantity,0)})</h2><button class="btn btn-link text-danger p-0" data-clear-cart>Vaciar carrito</button></div>${cartItemsMarkup(items)}</div><aside class="col-lg-4">${summaryMarkup(subtotal)}</aside></div>`;
}

function renderCheckoutSummary(){
  const target=document.querySelector('[data-checkout-summary]');
  if(!target)return;
  const items=cartDetails();
  const products=items.length?`<div class="small mb-3">${items.map(item=>`<div class="d-flex justify-content-between gap-2 mb-2"><span>${item.product.name} × ${item.quantity}</span><strong>${formatPrice(item.product.price*item.quantity)}</strong></div>`).join('')}</div>`:'<p class="small text-secondary">Tu carrito está vacío.</p>';
  target.innerHTML=`<div class="checkout-summary d-lg-none"><details><summary>Ver resumen del pedido (${items.reduce((sum,item)=>sum+item.quantity,0)})</summary><div>${products}${summaryMarkup(cartSubtotal(),true)}</div></details></div><div class="d-none d-lg-block">${products}${summaryMarkup(cartSubtotal(),true)}</div>`;
}
