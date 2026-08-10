# Gasoliguapis

Aplicación móvil para encontrar la mejor parada en carretera por sentido, desvío, precio, cafetería, baños, limpieza y servicios.

## Estado

- Experiencia móvil y escritorio con lista, mapa, filtros, favoritos y fichas de estación.
- La interfaz visible utiliza datos etiquetados como demostración.
- Esquema D1 de 20 tablas para catálogo, red viaria, precios, comunidad, fotos y moderación.
- Ingesta paginada y protegida del censo/precios oficiales de MITECO.
- R2 reservado para fotos aportadas por usuarios.
- Google/Facebook OAuth está representado en la experiencia, pero no simula un acceso real hasta seleccionar y configurar un proveedor compatible.

## Desarrollo

Requiere Node.js 22.13 o posterior.

```bash
npm install
npm run dev
npm run build
npm test
```

Las variables locales se documentan en `.env.example`. Los secretos alojados se gestionan en Sites y nunca se guardan en el repositorio.

## Datos

`POST /api/internal/sync-miteco?offset=0&limit=250` importa un tramo del censo oficial. Requiere `Authorization: Bearer <INGEST_SECRET>` y debe repetirse con el `nextOffset` devuelto. Los clientes leen datos normalizados desde `GET /api/stations`.

La investigación, licencias, estrategia de cobertura, comunidad y monetización se encuentran en `docs/product-data-strategy.md`.
