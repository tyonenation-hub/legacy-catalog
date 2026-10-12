import './style.css';
import { PRODUCTS, SETTINGS } from './catalog.js';

const app = document.querySelector('#app');
let filterColor = 'Todos';
let filterSearch = '';
let favorites = new Set(JSON.parse(localStorage.getItem('legacy-favorites') || '[]'));
let cart = JSON.parse(localStorage.getItem('legacy-cart') || '[]');

const money = (p) => p == null ? 'Consultar' : `${SETTINGS.currency} ${Number(p).toFixed(2)}`;
const placeholder = (name) => `<div class="ph"><span>${name}</span><small>Agrega tus fotos en src/catalog.js</small></div>`;
const imageHtml = (p) => p.images?.[0] ? `<img src="${p.images[0]}" alt="${p.name}">` : placeholder(p.name);
const colors = ['Todos', ...new Set(PRODUCTS.flatMap(p => p.colors))];

function save(){
  localStorage.setItem('legacy-favorites', JSON.stringify([...favorites]));
  localStorage.setItem('legacy-cart', JSON.stringify(cart));
}

function filtered(){
  return PRODUCTS.filter(p => {
    const c = filterColor === 'Todos' || p.colors.includes(filterColor);
    const q = !filterSearch || `${p.name} ${p.category} ${p.description}`.toLowerCase().includes(filterSearch.toLowerCase());
    return c && q;
  });
}

function render(){
  const items = filtered();
  app.innerHTML = `
    <header class="topbar">
      <div><div class="brand">${SETTINGS.brand}</div><div class="sub">${SETTINGS.subtitle}</div></div>
      <button class="cartBtn" data-action="cart">Pedido <b>${cart.length}</b></button>
    </header>
    <main>
      <section class="hero">
        <p class="eyebrow">NUEVA COLECCIÓN</p>
        <h1>Streetwear que habla por ti.</h1>
        <p>Explora diseños, colores y tallas. Arma tu pedido y envíalo por WhatsApp.</p>
      </section>
      <section class="tools">
        <input id="search" placeholder="Buscar diseño..." value="${filterSearch}">
        <div class="chips">${colors.map(c=>`<button class="chip ${filterColor===c?'active':''}" data-color="${c}">${c}</button>`).join('')}</div>
      </section>
      <section class="grid">
        ${items.map(p=>`
          <article class="card">
            <button class="fav ${favorites.has(p.id)?'on':''}" data-fav="${p.id}">♥</button>
            <div class="image">${imageHtml(p)}</div>
            <div class="cardBody">
              <div class="row"><h3>${p.name}</h3><strong>${money(p.price)}</strong></div>
              <p>${p.category}</p>
              <div class="swatches">${p.colors.map(c=>`<span title="${c}">${c}</span>`).join('')}</div>
              <button class="primary" data-view="${p.id}">Ver producto</button>
            </div>
          </article>`).join('') || '<p class="empty">No encontramos productos.</p>'}
      </section>
    </main>
    <nav class="bottom"><button data-home>Catálogo</button><button data-favs>Favoritos</button><button data-action="cart">Pedido (${cart.length})</button></nav>
    <div id="modal"></div>
  `;
  bind();
}

function bind(){
  document.querySelector('#search')?.addEventListener('input', e=>{filterSearch=e.target.value; render();});
  document.querySelectorAll('[data-color]').forEach(b=>b.onclick=()=>{filterColor=b.dataset.color;render();});
  document.querySelectorAll('[data-fav]').forEach(b=>b.onclick=()=>{const id=b.dataset.fav; favorites.has(id)?favorites.delete(id):favorites.add(id);save();render();});
  document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>openProduct(b.dataset.view));
  document.querySelectorAll('[data-action="cart"]').forEach(b=>b.onclick=openCart);
  document.querySelector('[data-favs]')?.addEventListener('click',()=>{filterSearch='';filterColor='Todos';const ids=[...favorites];openList(ids,'Favoritos');});
}

function openProduct(id){
  const p=PRODUCTS.find(x=>x.id===id); if(!p)return;
  const modal=document.querySelector('#modal');
  modal.innerHTML=`<div class="overlay"><section class="sheet">
    <button class="close">×</button>
    <div class="detailImage">${imageHtml(p)}</div>
    <h2>${p.name}</h2><p>${p.description}</p><strong class="price">${money(p.price)}</strong>
    <label>Color<select id="pColor">${p.colors.map(x=>`<option>${x}</option>`).join('')}</select></label>
    <label>Talla<select id="pSize">${p.sizes.map(x=>`<option>${x}</option>`).join('')}</select></label>
    <button class="primary add">Agregar al pedido</button>
  </section></div>`;
  modal.querySelector('.close').onclick=()=>modal.innerHTML='';
  modal.querySelector('.overlay').onclick=e=>{if(e.target.classList.contains('overlay'))modal.innerHTML='';};
  modal.querySelector('.add').onclick=()=>{
    cart.push({id:p.id,color:modal.querySelector('#pColor').value,size:modal.querySelector('#pSize').value,qty:1});save();modal.innerHTML='';render();
  };
}

function openCart(){
  const modal=document.querySelector('#modal');
  const rows=cart.map((x,i)=>{const p=PRODUCTS.find(y=>y.id===x.id);return `<div class="cartRow"><div><b>${p?.name||x.id}</b><small>${x.color} · ${x.size}</small></div><button data-remove="${i}">Eliminar</button></div>`}).join('');
  modal.innerHTML=`<div class="overlay"><section class="sheet"><button class="close">×</button><h2>Tu pedido</h2>${rows||'<p>Aún no agregaste productos.</p>'}<button class="primary send" ${cart.length?'':'disabled'}>Enviar pedido por WhatsApp</button></section></div>`;
  modal.querySelector('.close').onclick=()=>modal.innerHTML='';
  modal.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{cart.splice(Number(b.dataset.remove),1);save();openCart();render();});
  modal.querySelector('.send')?.addEventListener('click',sendWhatsApp);
}

function sendWhatsApp(){
  if(!SETTINGS.whatsapp){alert('Configura tu número de WhatsApp en src/catalog.js');return;}
  const lines=['Hola, quiero consultar por este pedido de LEGACY:',''];
  cart.forEach((x,i)=>{const p=PRODUCTS.find(y=>y.id===x.id);lines.push(`${i+1}. ${p?.name||x.id} — ${x.color} — talla ${x.size}`)});
  const url=`https://wa.me/${SETTINGS.whatsapp}?text=${encodeURIComponent(lines.join('\n'))}`;
  window.open(url,'_blank');
}

function openList(ids,title){
  const modal=document.querySelector('#modal');
  const ps=PRODUCTS.filter(p=>ids.includes(p.id));
  modal.innerHTML=`<div class="overlay"><section class="sheet"><button class="close">×</button><h2>${title}</h2>${ps.map(p=>`<button class="listItem" data-view2="${p.id}">${p.name}</button>`).join('')||'<p>No hay productos guardados.</p>'}</section></div>`;
  modal.querySelector('.close').onclick=()=>modal.innerHTML='';
  modal.querySelectorAll('[data-view2]').forEach(b=>b.onclick=()=>openProduct(b.dataset.view2));
}

if('serviceWorker' in navigator){ window.addEventListener('load',()=>navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(()=>{})); }
render();
