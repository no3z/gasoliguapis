# Gasoliguapis

Aplicación móvil para encontrar la mejor parada en carretera por sentido, desvío, precio, cafetería, baños, limpieza y servicios.

## Estado

- Experiencia móvil y escritorio con catálogo oficial, filtros, favoritos y valoraciones.
- Las fichas ficticias se han retirado de la superficie indexable.
- Esquema D1 de 20 tablas para catálogo, red viaria, precios, comunidad, fotos y moderación.
- Ingesta paginada y protegida del censo/precios oficiales de MITECO, con un único snapshot por ciclo en R2 y escrituras D1 solo cuando cambia un dato.
- Respuestas oficiales cacheables en CDN durante 30 minutos y tolerantes a caídas temporales del proveedor.
- Filtros oficiales por Gasóleo A, Gasolina 95, GLP y AdBlue, con requisitos combinables GLP + AdBlue.
- Búsqueda real en toda España, las 52 provincias o un radio de 75 km usando ubicación aproximada.
- Consulta por nombre, municipio o dirección antes de limitar resultados, total de coincidencias y hasta 100 estaciones por búsqueda.
- Ordenación por precio o cercanía y carga progresiva en el dispositivo.
- Mapa vectorial interactivo con todas las coincidencias cargadas, selección sincronizada con la lista y orden por precio, cercanía o puntuación.
- Experiencia inmersiva con controles translúcidos, perspectiva 2D/3D y edificios extruidos cuando el nivel de zoom lo permite.
- La estación seleccionada queda fijada al principio de la lista y puede abrirse en Google Maps o Apple Maps.
- Filtros reales de baños, cafetería, restaurante y estaciones con valoraciones, además de GLP y AdBlue.
- Propuesta automática de la parada con mejor equilibrio entre cercanía, precio y valoraciones disponibles cuando el usuario comparte su ubicación.
- Snapshot estático compacto de GLP y AdBlue como respaldo gratuito si la base o la fuente oficial no responden durante una visita.
- Valoraciones separadas de parada, baños, café y limpieza; no se mezclan en una única nota genérica.
- Confirmaciones rápidas de GLP, AdBlue, baños, cafetería, restaurante y limpieza, separadas del dato oficial y con cercanía opcional comprobada sin almacenar coordenadas.
- Votos 1–5 autenticados con la identidad disponible en Sites, sin comentarios públicos; el esquema conserva soporte multi-proveedor para Google/Facebook.
- Google/Facebook no simulan un acceso real hasta confirmar callbacks y configurar credenciales compatibles.
- Portada cacheable sin consulta de identidad; la sesión se comprueba únicamente al abrir el perfil o escribir.
- SEO técnico con canónicas, robots, sitemap, manifest, datos estructurados, páginas provinciales de GLP y contenidos sobre GLP, AdBlue, metodología y ahorro neto.

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

`POST /api/internal/sync-miteco?offset=0&limit=250` descarga una vez el censo oficial, conserva el snapshot en R2 e importa un tramo. Requiere `Authorization: Bearer <INGEST_SECRET>` y debe repetirse con el `nextOffset` devuelto; los tramos siguientes reutilizan el snapshot. Los clientes leen datos normalizados desde `GET /api/stations`.

Para que los buscadores puedan indexar las páginas, el Site debe tener acceso público. Mientras siga protegido por inicio de sesión, Google recibirá un `401` aunque `robots.txt` y el sitemap estén preparados.

La investigación, licencias, estrategia de cobertura, comunidad y monetización se encuentran en `docs/product-data-strategy.md`. El estudio competitivo especializado en GLP y AdBlue está en `docs/market-study-glp-2026.md`.
