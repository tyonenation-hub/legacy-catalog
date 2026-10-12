import './style.css';
import { COLOR_GROUPS, SETTINGS } from './catalog.js';

const app = document.querySelector('#app');
let currentSlug = null;
const selectedSizes = new Map();

const groupBySlug = (slug) => COLOR_GROUPS.find(g => g.slug === slug);
const asset = (path) => path ? `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}` : '';

function photo(path, label, group, model){
  if (!path) {
    return `<button class="photo placeholder" data-placeholder="1" type="button">
      <span>${label}</span>
      <small>Agrega la foto en<br>public/productos/${group.slug}/</small>
    </button>`;
  }
  return `<button class="photo" data-zoom="${asset(path)}" data-label="${label}" type="button">
    <img src="${asset(path)}" alt="Polo ${group.color} - ${label}" loading="lazy">
    <span class="photoTag">${label}</span>
  </button>`;
}

function renderHome(){
  currentSlug = null;
  app.innerHTML = `
    <header class="topbar">
      <div><div class="brand">${SETTINGS.brand}</div><div class="sub">${SETTINGS.subtitle}</div></div>
    </header>
    <main class="shell">
      <section class="hero compactHero">
        <p class="eyebrow">CATÁLOGO LEGACY</p>
        <h1>Elige un color.</h1>
        <p>Entra a cada color para ver todos los modelos disponibles.</p>
      </section>
      <section class="colorGrid">
        ${COLOR_GROUPS.map(g => `
          <button class="colorCard color-${g.slug}" data-color-open="${g.slug}" type="button">
            <div class="colorVisual"><span class="teeGlyph">T</span></div>
            <div class="colorInfo">
              <strong>${g.color}</strong>
              <span>${g.models.length} ${g.models.length === 1 ? 'modelo' : 'modelos'}</span>
            </div>
            <span class="arrow">›</span>
          </button>`).join('')}
      </section>
      <p class="homeNote">Toca un color para ver sus modelos.</p>
    </main>
    <div id="modal"></div>`;

  document.querySelectorAll('[data-color-open]').forEach(btn => {
    btn.addEventListener('click', () => renderColor(btn.dataset.colorOpen));
  });
}

function renderColor(slug){
  const group = groupBySlug(slug);
  if (!group) return renderHome();
  currentSlug = slug;

  app.innerHTML = `
    <header class="topbar">
      <button class="backBtn" data-back type="button">‹ Colores</button>
      <div class="headerTitle"><div class="brand">${group.color}</div><div class="sub">MODELOS DISPONIBLES</div></div>
    </header>
    <main class="shell">
      <section class="colorHeader">
        <h1>${group.color}</h1>
        <p>${group.models.length} ${group.models.length === 1 ? 'modelo disponible' : 'modelos disponibles'}</p>
      </section>
      <section class="modelGrid">
        ${group.models.map((m, index) => modelCard(group, m, index)).join('') || '<p class="empty">Aún no hay modelos cargados.</p>'}
      </section>
    </main>
    <div id="modal"></div>`;

  bindColorView(group);
}

function modelCard(group, model, index){
  const selected = selectedSizes.get(model.id) || model.sizes?.[0] || '';
  return `<article class="modelCard">
    <div class="photoPair">
      ${photo(model.front, 'Frente', group, model)}
      ${photo(model.back, 'Espalda', group, model)}
    </div>
    <div class="modelBody">
      <div class="availability ${model.stock ? 'available' : 'soldout'}">
        <span class="dot"></span>${model.stock ? 'Disponible' : 'Agotado'}
      </div>
      <div class="sizesTitle">Tallas disponibles</div>
      <div class="sizes" data-model-sizes="${model.id}">
        ${(model.sizes || []).map(s => `<button type="button" class="sizeBtn ${s === selected ? 'active' : ''}" data-size="${s}" data-model="${model.id}">${s}</button>`).join('')}
      </div>
      <button class="whatsappBtn" data-order="${model.id}" ${model.stock ? '' : 'disabled'} type="button">Pedir por WhatsApp</button>
    </div>
  </article>`;
}

function bindColorView(group){
  document.querySelector('[data-back]')?.addEventListener('click', renderHome);

  document.querySelectorAll('[data-size]').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedSizes.set(btn.dataset.model, btn.dataset.size);
      document.querySelectorAll(`[data-model-sizes="${btn.dataset.model}"] .sizeBtn`).forEach(x => x.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  document.querySelectorAll('[data-order]').forEach(btn => {
    btn.addEventListener('click', () => sendWhatsApp(group, btn.dataset.order));
  });

  document.querySelectorAll('[data-zoom]').forEach(btn => {
    btn.addEventListener('click', () => openImage(btn.dataset.zoom, btn.dataset.label, group.color));
  });
}

function sendWhatsApp(group, modelId){
  const model = group.models.find(m => m.id === modelId);
  if (!model) return;
  if (!SETTINGS.whatsapp) {
    alert('Configura tu número de WhatsApp en src/catalog.js');
    return;
  }
  const size = selectedSizes.get(modelId) || model.sizes?.[0] || 'Consultar';
  const text = [
    'Hola, quiero consultar por este polo de LEGACY.',
    `Color: ${group.color}`,
    `Talla: ${size}`,
    '¿Está disponible?'
  ].join('\n');
  window.open(`https://wa.me/${SETTINGS.whatsapp}?text=${encodeURIComponent(text)}`, '_blank');
}

function openImage(src, label, color){
  const modal = document.querySelector('#modal');
  if (!modal) return;
  modal.innerHTML = `<div class="overlay" data-close-overlay>
    <section class="imageModal">
      <button class="close" data-close type="button">×</button>
      <img src="${src}" alt="${label} ${color}">
      <div class="modalCaption">${color} · ${label}</div>
    </section>
  </div>`;
  modal.querySelector('[data-close]')?.addEventListener('click', () => modal.innerHTML = '');
  modal.querySelector('[data-close-overlay]')?.addEventListener('click', e => {
    if (e.target.hasAttribute('data-close-overlay')) modal.innerHTML = '';
  });
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {}));
}

renderHome();
