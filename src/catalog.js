export const SETTINGS = {
  brand: 'LEGACY',
  subtitle: 'Streetwear Catalog',
  whatsapp: '', // Escribe tu número con código de país, sin + ni espacios. Ej.: 519XXXXXXXX
  facebook: 'legacy - ropa streetwear'
};

// Carga tus fotos en public/productos/<color>/ y reemplaza las rutas de ejemplo.
// No se muestra nombre de diseño ni precio al cliente.
export const COLOR_GROUPS = [
  {
    color: 'Negro',
    slug: 'negro',
    models: [
      {
        id: 'negro-01',
        front: '', // 'productos/negro/modelo01-frente.webp'
        back: '',  // 'productos/negro/modelo01-espalda.webp'
        sizes: ['S', 'M', 'L', 'XL'],
        stock: true
      }
    ]
  },
  {
    color: 'Blanco',
    slug: 'blanco',
    models: [
      {
        id: 'blanco-01',
        front: '',
        back: '',
        sizes: ['S', 'M', 'L', 'XL'],
        stock: true
      }
    ]
  },
  {
    color: 'Arena',
    slug: 'arena',
    models: [
      {
        id: 'arena-01',
        front: '',
        back: '',
        sizes: ['S', 'M', 'L', 'XL'],
        stock: true
      }
    ]
  },
  {
    color: 'Verde militar',
    slug: 'verde-militar',
    models: [
      {
        id: 'verde-militar-01',
        front: '',
        back: '',
        sizes: ['S', 'M', 'L', 'XL'],
        stock: true
      }
    ]
  }
];
