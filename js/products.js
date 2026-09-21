/* Cliente del catálogo: los datos proceden de la API PHP/MySQL. */
const PRODUCT_API='backend/api/products.php';
let PRODUCTS=[];

function productCard(product){
  const badge=product.new?'Novedad':product.bestseller?'Más vendido':'';
  const image=product.images?.[0]||'assets/images/products-studio.png';
  return `<article class="product-card"><div class="product-image-wrap">${badge?`<span class="product-tag">${badge}</span>`:''}<a href="producto.html?id=${product.id}"><img class="product-image" src="${image}" alt="${product.name}"></a></div><div class="pt-3"><p class="product-category mb-1">${product.category}</p><a class="product-name d-block mb-1" href="producto.html?id=${product.id}">${product.name}</a><div class="rating mb-2"><span class="stars">★★★★★</span> ${Number(product.rating).toFixed(1)} <span class="text-secondary">(${product.reviews})</span></div><div class="d-flex align-items-center gap-2 mb-3"><span class="price">${formatPrice(product.price)}</span>${product.oldPrice?`<span class="old-price">${formatPrice(product.oldPrice)}</span>`:''}</div><button class="btn btn-dark btn-sm w-100 add-card" data-id="${product.id}">Añadir al carrito</button></div></article>`;
}

function apiUrl(parameters={}){
  const url=new URL(PRODUCT_API,window.location.href);
  Object.entries(parameters).forEach(([key,value])=>{if(value!==undefined&&value!==null&&value!=='')url.searchParams.set(key,value);});
  return url;
}

async function requestProducts(parameters={}){
  const response=await fetch(apiUrl(parameters),{headers:{Accept:'application/json'}});
  const body=await response.json().catch(()=>null);
  if(!response.ok||!body?.data)throw new Error(body?.error||'No hemos podido cargar los productos.');
  return body;
}

async function loadProducts(parameters={}){
  const body=await requestProducts(parameters);
  PRODUCTS=body.data;
  return body;
}

async function getProduct(id){
  const cached=PRODUCTS.find(product=>product.id===Number(id));
  if(cached)return cached;
  const body=await requestProducts({id});
  return body.data;
}

async function loadCategories(){
  const response=await fetch('backend/api/categories.php',{headers:{Accept:'application/json'}});
  const body=await response.json().catch(()=>null);
  if(!response.ok||!body?.data)throw new Error('No hemos podido cargar las categorías.');
  return body.data;
}
