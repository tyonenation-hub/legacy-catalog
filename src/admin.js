import './style.css';
import { supabase, supabaseConfigured, PRODUCT_BUCKET } from './supabase.js';

const root = document.querySelector('#admin-app');
const CATEGORIES = [['streetwear','Streetwear'], ['anime','Anime']];
const COLORS = [
  ['negro','Negro'], ['blanco','Blanco'], ['arena','Arena'], ['verde-militar','Verde militar']
];
const ALL_SIZES = ['S','M','L','XL','XXL'];
let editingId = null;
let products = [];

const esc = (v='') => String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

function showSetup(){
  root.innerHTML = `<main class="adminShell">
    <section class="adminCard setupCard">
      <div class="brand">LEGACY</div><div class="sub">CATALOG ADMIN</div>
      <h1>Conecta Supabase</h1>
      <p>Esta versión carga fotos y modelos directamente desde el celular, pero primero debes conectar tu proyecto Supabase una sola vez.</p>
      <div class="adminSteps">
        <div><b>1.</b> Crea un proyecto gratuito en Supabase.</div>
        <div><b>2.</b> Ejecuta el archivo <code>supabase/schema.sql</code> en SQL Editor.</div>
        <div><b>3.</b> Activa Email/Password en Authentication y crea tu usuario administrador.</div>
        <div><b>4.</b> En GitHub agrega los secrets <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code>.</div>
      </div>
      <p class="muted">Después del nuevo deploy, este panel mostrará el inicio de sesión.</p>
    </section>
  </main>`;
}

function showLogin(message=''){
  root.innerHTML = `<main class="adminShell">
    <section class="adminCard loginCard">
      <div class="brand">LEGACY</div><div class="sub">CATALOG ADMIN</div>
      <h1>Administración</h1>
      <p class="muted">Solo para cargar y actualizar modelos del catálogo.</p>
      ${message ? `<div class="adminMessage error">${esc(message)}</div>` : ''}
      <form id="login-form" class="adminForm">
        <label>Email<input type="email" name="email" autocomplete="email" required></label>
        <label>Contraseña<input type="password" name="password" autocomplete="current-password" required></label>
        <button class="primaryBtn" type="submit">Entrar</button>
      </form>
    </section>
  </main>`;
  document.querySelector('#login-form')?.addEventListener('submit', login);
}

async function login(e){
  e.preventDefault();
  const fd = new FormData(e.currentTarget);
  const { error } = await supabase.auth.signInWithPassword({ email: fd.get('email'), password: fd.get('password') });
  if (error) return showLogin(error.message);
  await loadAdmin();
}

async function logout(){
  await supabase.auth.signOut();
  showLogin();
}

async function loadProducts(){
  const { data, error } = await supabase.from('catalog_products').select('*').order('created_at', { ascending:false });
  if (error) throw error;
  products = data || [];
}

function adminPage(){
  root.innerHTML = `<header class="topbar adminTopbar">
    <div><div class="brand">LEGACY</div><div class="sub">CATALOG ADMIN</div></div>
    <button class="backBtn" data-logout type="button">Salir</button>
  </header>
  <main class="adminShell wide">
    <section class="adminCard">
      <h1 id="form-title">Publicar modelo</h1>
      <form id="product-form" class="adminForm">
        <label>Colección
          <select name="category" required>${CATEGORIES.map(([v,l]) => `<option value="${v}">${l}</option>`).join('')}</select>
        </label>
        <label>Color
          <select name="color" required>${COLORS.map(([v,l]) => `<option value="${v}">${l}</option>`).join('')}</select>
        </label>
        <div class="uploadGrid">
          <label class="uploadBox">Foto frontal<input type="file" name="front" accept="image/*"></label>
          <label class="uploadBox">Foto posterior<input type="file" name="back" accept="image/*"></label>
        </div>
        <fieldset class="sizeField"><legend>Tallas disponibles</legend>
          <div class="checkRow">${ALL_SIZES.map(s => `<label><input type="checkbox" name="sizes" value="${s}">${s}</label>`).join('')}</div>
        </fieldset>
        <label class="toggleRow"><input type="checkbox" name="stock" checked> Disponible</label>
        <input type="hidden" name="edit-id">
        <div class="adminActions">
          <button class="primaryBtn" type="submit">Publicar modelo</button>
          <button class="secondaryBtn hidden" id="cancel-edit" type="button">Cancelar edición</button>
        </div>
        <div id="form-status"></div>
      </form>
    </section>
    <section class="adminCard">
      <div class="adminListHead"><h2>Modelos publicados</h2><span>${products.length}</span></div>
      <div class="adminProductList">
        ${products.length ? products.map(productRow).join('') : '<p class="muted">Aún no hay modelos cargados.</p>'}
      </div>
    </section>
  </main>`;

  document.querySelector('[data-logout]')?.addEventListener('click', logout);
  document.querySelector('#product-form')?.addEventListener('submit', saveProduct);
  document.querySelector('#cancel-edit')?.addEventListener('click', resetForm);
  document.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => startEdit(b.dataset.edit)));
  document.querySelectorAll('[data-toggle-stock]').forEach(b => b.addEventListener('click', () => toggleStock(b.dataset.toggleStock)));
  document.querySelectorAll('[data-delete]').forEach(b => b.addEventListener('click', () => deleteProduct(b.dataset.delete)));
}

function productRow(p){
  const color = COLORS.find(([v]) => v === p.color_slug)?.[1] || p.color_slug;
  const category = CATEGORIES.find(([v]) => v === (p.category || 'streetwear'))?.[1] || 'Streetwear';
  return `<article class="adminProductRow">
    <div class="adminThumbPair">
      ${p.front_url ? `<img src="${esc(p.front_url)}" alt="Frente">` : '<div></div>'}
      ${p.back_url ? `<img src="${esc(p.back_url)}" alt="Espalda">` : '<div></div>'}
    </div>
    <div class="adminProductInfo">
      <strong>${esc(category)} · ${esc(color)}</strong>
      <span>${(p.sizes || []).join(' · ') || 'Sin tallas'}</span>
      <small class="${p.stock ? 'availableText' : 'soldText'}">${p.stock ? 'Disponible' : 'Agotado'}</small>
    </div>
    <div class="adminRowActions">
      <button data-edit="${p.id}" type="button">Editar</button>
      <button data-toggle-stock="${p.id}" type="button">${p.stock ? 'Agotar' : 'Activar'}</button>
      <button class="dangerBtn" data-delete="${p.id}" type="button">Eliminar</button>
    </div>
  </article>`;
}

function status(text, kind=''){
  const el = document.querySelector('#form-status');
  if (el) el.innerHTML = text ? `<div class="adminMessage ${kind}">${esc(text)}</div>` : '';
}

async function uploadFile(file, color, side, id){
  if (!file) return null;
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g,'');
  const path = `${color}/${id}-${side}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(PRODUCT_BUCKET).upload(path, file, { upsert:false, cacheControl:'3600' });
  if (error) throw error;
  return supabase.storage.from(PRODUCT_BUCKET).getPublicUrl(path).data.publicUrl;
}

async function saveProduct(e){
  e.preventDefault();
  const form = e.currentTarget;
  const fd = new FormData(form);
  const id = fd.get('edit-id') || crypto.randomUUID();
  const category = fd.get('category') || 'streetwear';
  const color = fd.get('color');
  const sizes = fd.getAll('sizes');
  if (!sizes.length) return status('Selecciona al menos una talla.', 'error');
  const current = products.find(p => p.id === id);
  if (!current && (!fd.get('front')?.size || !fd.get('back')?.size)) return status('Carga foto frontal y posterior.', 'error');
  status('Subiendo imágenes…');
  try {
    const front = await uploadFile(fd.get('front'), color, 'front', id) || current?.front_url || '';
    const back = await uploadFile(fd.get('back'), color, 'back', id) || current?.back_url || '';
    const payload = { id, category, color_slug:color, front_url:front, back_url:back, sizes, stock:fd.get('stock') === 'on' };
    const { error } = await supabase.from('catalog_products').upsert(payload);
    if (error) throw error;
    await loadProducts();
    adminPage();
  } catch(err){ status(err.message || 'No se pudo guardar.', 'error'); }
}

function startEdit(id){
  const p = products.find(x => x.id === id); if (!p) return;
  editingId = id;
  const f = document.querySelector('#product-form');
  f.elements['category'].value = p.category || 'streetwear';
  f.elements['color'].value = p.color_slug;
  f.elements['edit-id'].value = id;
  f.elements['stock'].checked = !!p.stock;
  f.querySelectorAll('input[name="sizes"]').forEach(x => x.checked = (p.sizes || []).includes(x.value));
  document.querySelector('#form-title').textContent = 'Editar modelo';
  f.querySelector('.primaryBtn').textContent = 'Guardar cambios';
  document.querySelector('#cancel-edit').classList.remove('hidden');
  window.scrollTo({top:0, behavior:'smooth'});
}

function resetForm(){ editingId = null; adminPage(); }

async function toggleStock(id){
  const p = products.find(x => x.id === id); if (!p) return;
  const { error } = await supabase.from('catalog_products').update({stock:!p.stock}).eq('id', id);
  if (error) return alert(error.message);
  await loadProducts(); adminPage();
}

function extractObjectPath(url){
  const marker = `/storage/v1/object/public/${PRODUCT_BUCKET}/`;
  const i = url?.indexOf(marker);
  return i >= 0 ? decodeURIComponent(url.slice(i + marker.length)) : null;
}

async function deleteProduct(id){
  const p = products.find(x => x.id === id); if (!p) return;
  if (!confirm('¿Eliminar este modelo del catálogo?')) return;
  const paths = [extractObjectPath(p.front_url), extractObjectPath(p.back_url)].filter(Boolean);
  if (paths.length) await supabase.storage.from(PRODUCT_BUCKET).remove(paths);
  const { error } = await supabase.from('catalog_products').delete().eq('id', id);
  if (error) return alert(error.message);
  await loadProducts(); adminPage();
}

async function loadAdmin(){
  try { await loadProducts(); adminPage(); }
  catch(err){ root.innerHTML = `<main class="adminShell"><section class="adminCard"><h1>Error</h1><p>${esc(err.message)}</p></section></main>`; }
}

if (!supabaseConfigured || !supabase) {
  showSetup();
} else {
  const { data:{ session } } = await supabase.auth.getSession();
  if (session) await loadAdmin(); else showLogin();
  supabase.auth.onAuthStateChange(async (_event, sessionNow) => {
    if (sessionNow && !products.length) await loadAdmin();
  });
}
