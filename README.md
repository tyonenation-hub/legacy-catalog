# LEGACY Catalog v1

Primera versión funcional del catálogo digital/PWA de LEGACY.

## Funciones
- Catálogo responsive para móvil.
- Filtros por color y búsqueda.
- Ficha de producto con talla y color.
- Favoritos guardados localmente.
- Pedido simple y envío a WhatsApp.
- PWA instalable desde el navegador.
- Proyecto listo para APK con Capacitor.
- Workflow separado para GitHub Pages.

## Personalización rápida
Edita `src/catalog.js`:
- `SETTINGS.whatsapp`: número con código de país, sin + ni espacios.
- `price`: precio numérico o `null` para mostrar "Consultar".
- `sizes`, `colors`, `description`.
- `images`: rutas o URLs de las fotos/mockups. Ejemplo: `['/products/legacy001-front.png','/products/legacy001-back.png']`.

Para archivos locales, crea `public/products/` y guarda allí las imágenes.

## Publicar como PWA
Sube el proyecto a GitHub. En Settings > Pages, selecciona **GitHub Actions** como origen. El workflow `Deploy PWA to GitHub Pages` publicará el catálogo.

## APK
El workflow `Build Android APK` genera `app-debug.apk` en Artifacts.
