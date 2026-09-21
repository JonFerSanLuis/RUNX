let currentPage=1;
const PAGE_SIZE=8;

function filterValues(form,name){return [...form.querySelectorAll(`[name="${name}"]:checked`)].map(input=>input.value);}
function activeProducts(){
  const form=document.querySelector('[data-filter-form]');
  let list=[...PRODUCTS];
  const category=filterValues(form,'category')[0]||'';
  const colors=filterValues(form,'color');
  const sizes=filterValues(form,'size');
  const price=filterValues(form,'price')[0]||'';
  if(category)list=list.filter(product=>product.category===category);
  if(colors.length)list=list.filter(product=>colors.some(color=>product.colors.includes(color)));
  if(sizes.length)list=list.filter(product=>sizes.some(size=>product.sizes.includes(size)));
  if(price==='under15')list=list.filter(product=>product.price<15);
  if(price==='15to25')list=list.filter(product=>product.price>=15&&product.price<=25);
  if(price==='over25')list=list.filter(product=>product.price>25);
  const sort=document.querySelector('#sortProducts')?.value||document.querySelector('#sortProductsDesktop')?.value||'relevance';
  const compare={low:(a,b)=>a.price-b.price,high:(a,b)=>b.price-a.price,best:(a,b)=>Number(b.bestseller)-Number(a.bestseller),new:(a,b)=>Number(b.new)-Number(a.new),rating:(a,b)=>b.rating-a.rating};
  if(compare[sort])list.sort(compare[sort]);
  return list;
}

function updateFilterCount(){
  const form=document.querySelector('[data-filter-form]');
  const count=form.querySelectorAll('input:checked').length;
  document.querySelectorAll('[data-filter-count]').forEach(el=>{el.textContent=count;el.hidden=count===0;});
}

function renderShop(){
  const grid=document.querySelector('[data-product-grid]');
  if(!grid)return;
  const products=activeProducts();
  const pageProducts=products.slice((currentPage-1)*PAGE_SIZE,currentPage*PAGE_SIZE);
  grid.innerHTML=pageProducts.length?pageProducts.map(product=>`<div class="col-6 col-md-4 col-lg-3">${productCard(product)}</div>`).join(''):`<div class="col-12"><div class="empty-state"><h2 class="h4">No hay productos con estos filtros</h2><button class="btn btn-outline-dark mt-2" data-reset-filters>Limpiar filtros</button></div></div>`;
  document.querySelectorAll('[data-shop-count]').forEach(el=>el.textContent=`${products.length} producto${products.length!==1?'s':''}`);
  updateFilterCount();
  renderPagination(products.length);
}

function renderPagination(total){
  const target=document.querySelector('[data-pagination]');
  if(!target)return;
  const pages=Math.ceil(total/PAGE_SIZE);
  target.innerHTML=pages>1?`<ul class="pagination justify-content-center">${Array.from({length:pages},(_,index)=>`<li class="page-item ${index+1===currentPage?'active':''}"><button class="page-link" data-page="${index+1}" aria-label="Página ${index+1}">${index+1}</button></li>`).join('')}</ul>`:'';
}

function copyFilterState(from,to){
  ['category','price','color','size'].forEach(name=>{
    const values=filterValues(from,name);
    to.querySelectorAll(`[name="${name}"]`).forEach(input=>input.checked=values.includes(input.value));
  });
}

function resetFilters(){
  document.querySelectorAll('[data-filter-form] input,[data-mobile-filter-form] input').forEach(input=>input.checked=false);
  history.replaceState({},'', 'tienda.html');
  currentPage=1;
  renderShop();
}

function createMobileFilters(){
  const source=document.querySelector('[data-filter-form]');
  const root=document.querySelector('[data-mobile-filter-root]');
  if(!source||!root)return;
  const form=source.cloneNode(true);
  form.classList.remove('filter-panel');
  form.removeAttribute('data-filter-form');
  form.setAttribute('data-mobile-filter-form','');
  form.querySelector('.d-flex')?.remove();
  form.querySelectorAll('[id]').forEach(input=>{
    const previous=input.id, replacement=`mobile-${previous}`;
    form.querySelectorAll(`label[for="${previous}"]`).forEach(label=>label.htmlFor=replacement);
    input.id=replacement;
  });
  const actions=document.createElement('div');
  actions.className='d-grid gap-2 mt-4';
  actions.innerHTML='<button type="submit" class="btn btn-primary">Aplicar filtros</button><button type="button" class="btn btn-outline-dark" data-reset-filters>Limpiar filtros</button>';
  form.append(actions);
  root.append(form);
  document.querySelector('#mobileFilters').addEventListener('show.bs.offcanvas',()=>copyFilterState(source,form));
  form.addEventListener('submit',event=>{
    event.preventDefault();
    copyFilterState(form,source);
    currentPage=1;
    renderShop();
    bootstrap.Offcanvas.getOrCreateInstance('#mobileFilters').hide();
  });
}

document.addEventListener('DOMContentLoaded',()=>{
  const form=document.querySelector('[data-filter-form]');
  if(!form)return;
  const preset=new URLSearchParams(location.search).get('category');
  if(preset){const input=form.querySelector(`[name="category"][value="${preset}"]`);if(input)input.checked=true;}
  createMobileFilters();
  form.addEventListener('change',()=>{currentPage=1;renderShop();});
  document.querySelectorAll('#sortProducts,#sortProductsDesktop').forEach(select=>select.addEventListener('change',event=>{
    document.querySelectorAll('#sortProducts,#sortProductsDesktop').forEach(other=>other.value=event.target.value);
    currentPage=1;renderShop();
  }));
  document.addEventListener('click',event=>{
    const page=event.target.closest('[data-page]');
    if(page){currentPage=Number(page.dataset.page);renderShop();window.scrollTo({top:0,behavior:'smooth'});}
    if(event.target.closest('[data-reset-filters]'))resetFilters();
  });
  renderShop();
});
