import './style.css';
import { COLOR_GROUPS, SETTINGS } from './catalog.js';
import { supabase, supabaseConfigured } from './supabase.js';

const app = document.querySelector('#app');
let currentSlug = null;
let currentCategory = 'streetwear';
let liveGroups = structuredClone(COLOR_GROUPS);
const selectedSizes = new Map();

const groupBySlug = (slug) => liveGroups.find(g => g.slug === slug);
const asset = (path) => path ? (/^https?:\/\//.test(path) ? path : `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`) : '';

async function loadCatalog(){
  if (!supabaseConfigured || !supabase) return;
  const { data, error } = await supabase
    .from('catalog_products')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) {
    console.warn('No se pudo cargar Supabase:', error.message);
    return;
  }
  liveGroups = COLOR_GROUPS.map(group => ({
    ...group,
    models: (data || [])
      .filter(p => p.color_slug === group.slug)
      .map(p => ({
        id: p.id,
        front: p.front_url || '',
        back: p.back_url || '',
        sizes: p.sizes || [],
        stock: p.stock !== false,
        category: p.category || 'streetwear'
      }))
  }));
}

function photo(path, label, group){
  if (!path) {
    return `<div class="photo placeholder"><span>${label}</span><small>Imagen no disponible</small></div>`;
  }
  return `<button class="photo" data-zoom="${asset(path)}" data-label="${label}" type="button">
    <img src="${asset(path)}" alt="Polo ${group.color} - ${label}" loading="lazy">
    <span class="photoTag">${label}</span>
  </button>`;
}

function renderHome(category=currentCategory){
  currentSlug = null;
  currentCategory = category;
  const categoryLabel = currentCategory === 'anime' ? 'ANIME' : 'STREETWEAR';
  app.innerHTML = `
    <header class="topbar">
      <div><div class="brand">${SETTINGS.brand}</div><div class="sub">${SETTINGS.subtitle}</div></div>
    </header>
    <main class="shell">
      <section class="hero compactHero">
        <p class="eyebrow">CATÁLOGO LEGACY</p>
        <h1>Elige una colección.</h1>
        <p>Selecciona Streetwear o Anime y luego el color que quieres ver.</p>
      </section>
      <section class="categoryTabs" aria-label="Colecciones">
        <button class="categoryTab ${currentCategory === 'streetwear' ? 'active' : ''}" data-category="streetwear" type="button">STREETWEAR</button>
        <button class="categoryTab ${currentCategory === 'anime' ? 'active' : ''}" data-category="anime" type="button">ANIME</button>
      </section>
      ${!supabaseConfigured ? '<div class="setupNotice">Catálogo en modo local. El administrador puede conectar Supabase para cargar modelos directamente.</div>' : ''}
      <div class="collectionLabel">${categoryLabel}</div>
      <section class="colorGrid">
        ${liveGroups.map(g => {
          const count = g.models.filter(m => (m.category || 'streetwear') === currentCategory).length;
          return `
          <button class="colorCard color-${g.slug}" data-color-open="${g.slug}" type="button">
            <div class="colorVisual"><span class="teeGlyph">T</span></div>
            <div class="colorInfo">
              <strong>${g.color}</strong>
              <span>${count} ${count === 1 ? 'modelo' : 'modelos'}</span>
            </div>
            <span class="arrow">›</span>
          </button>`;
        }).join('')}
      </section>
      <p class="homeNote">Toca un color para ver los modelos de ${categoryLabel.toLowerCase()}.</p>
    </main>
    <div id="modal"></div>`;

  document.querySelectorAll('[data-category]').forEach(btn => {
    btn.addEventListener('click', () => renderHome(btn.dataset.category));
  });
  document.querySelectorAll('[data-color-open]').forEach(btn => {
    btn.addEventListener('click', () => renderColor(btn.dataset.colorOpen));
  });
}

function renderColor(slug){
  const group = groupBySlug(slug);
  if (!group) return renderHome(currentCategory);
  currentSlug = slug;
  const models = group.models.filter(m => (m.category || 'streetwear') === currentCategory);
  const categoryLabel = currentCategory === 'anime' ? 'ANIME' : 'STREETWEAR';

  app.innerHTML = `
    <header class="topbar">
      <button class="backBtn" data-back type="button">‹ ${categoryLabel}</button>
      <div class="headerTitle"><div class="brand">${group.color}</div><div class="sub">${categoryLabel} · MODELOS DISPONIBLES</div></div>
    </header>
    <main class="shell">
      <section class="colorHeader">
        <h1>${group.color}</h1>
        <p>${models.length} ${models.length === 1 ? 'modelo disponible' : 'modelos disponibles'}</p>
      </section>
      <section class="modelGrid">
        ${models.map(m => modelCard(group, m)).join('') || '<p class="empty">Aún no hay modelos cargados en esta colección.</p>'}
      </section>
    </main>
    <div id="modal"></div>`;

  bindColorView(group);
}

function modelCard(group, model){
  const selected = selectedSizes.get(model.id) || model.sizes?.[0] || '';
  return `<article class="modelCard">
    <div class="photoPair">
      ${photo(model.front, 'Frente', group)}
      ${photo(model.back, 'Espalda', group)}
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
  document.querySelector('[data-back]')?.addEventListener('click', () => renderHome(currentCategory));

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
    alert('El número de WhatsApp todavía no está configurado.');
    return;
  }
  const size = selectedSizes.get(modelId) || model.sizes?.[0] || 'Consultar';
  const photoUrl = asset(model.back || model.front || '');
  const text = [
    'Hola, quiero consultar por este polo de LEGACY.',
    `Colección: ${currentCategory === 'anime' ? 'Anime' : 'Streetwear'}`,
    `Color: ${group.color}`,
    `Talla: ${size}`,
    photoUrl ? `Foto del diseño (espalda): ${photoUrl}` : '',
    '¿Está disponible?'
  ].filter(Boolean).join('\n');
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

await loadCatalog();
renderHome();
