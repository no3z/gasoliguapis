# Estudio de mercado · mejores paradas, GLP y AdBlue · España · agosto de 2026

## Posicionamiento recomendado

El mercado español ya contiene numerosos comparadores que reutilizan precios de MITECO. Gasoliguapis debe ocupar una categoría más amplia: **la mejor parada completa en carretera**, no solo la gasolinera más barata. La decisión combina combustible, baños, limpieza, restaurante, café, accesibilidad, familias, descanso y tiempo de desvío.

GLP y AdBlue serán una ventaja técnica especialmente cuidada dentro de ese producto general. En estos combustibles existe además una incertidumbre operativa:

> ¿Podré repostar GLP de verdad, cuánto me desvío y qué alternativa tengo si falla?

La propuesta de marca es **paradas que sí merecen la pena**. Su capa diferencial de combustible será **GLP y AdBlue sin sorpresas**: disponibilidad con confianza y fecha, búsqueda según autonomía, acceso correcto, coste real del desvío y una estación de respaldo.

## Tamaño observable

En el feed oficial consultado el 10 de agosto de 2026 aparecen:

- 11.529 estaciones en total.
- 1.000 con precio de GLP publicado, aproximadamente el 8,7 %.
- 2.929 con precio de AdBlue publicado.
- 403 con ambos productos publicados.

Fuente: [servicio oficial de precios de carburantes de MITECO](https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/).

## Competidores y huecos

| Producto | Fortaleza | Hueco aprovechable |
|---|---|---|
| [GasAll](https://play.google.com/store/apps/details?id=com.gasall) | Escala, precios, rutas, históricos, descuentos y CarPlay | El estado operativo del surtidor GLP no es su producto central |
| [GLP Cerca](https://glp.rexvalentia.es/app) | Especialización GLP y cobertura de varios países | Sin capa comunitaria fuerte ni confirmación física del repostaje |
| [GasApp](https://gasapp.es/) | Muchos combustibles y mapa de calor | Amplitud generalista, poca certeza específica de GLP |
| [TANKO](https://tanko.es/es/precios/adblue/) | SEO, alertas, histórico y actualización frecuente | Oportunidad de ganar en metodología y estados de disponibilidad |
| [Gasofapp](https://apps.apple.com/es/app/gasofapp/id1671452622) | Rutas, servicios, descuentos y reseñas | Los servicios son atributos genéricos, no verificaciones recientes |
| [myLPG.eu](https://www.mylpg.eu/about/) | Gran catálogo internacional, conectores, confirmaciones y planificador | UX mejorable; oportunidad de integrar mejor ruta, parada y confianza |
| [iExit](https://www.iexitapp.com/) | Decisión por salida y servicios que vienen más adelante | Patrón aún poco resuelto para GLP en España |

No se copiarán código, textos, fotografías, datos ni identidad visual de terceros. Los patrones de interacción y modelos de negocio sí pueden estudiarse y adaptarse.

## Funcionalidades priorizadas

### P0 · Resolver la búsqueda

1. Toda España, todas las provincias y ubicación real.
2. Búsqueda en servidor antes del límite de resultados.
3. Total real, distancia visible, orden por precio o cercanía y carga progresiva.
4. GLP y AdBlue sin columnas duplicadas.
5. Precio, fuente y antigüedad siempre visibles.
6. Valoraciones propias y separadas de baños, café, limpieza y calidad general.

### P1 · Crear una ventaja defendible

1. **Confirmación en diez segundos:** he repostado, sin producto, averiado, cerrado o precio incorrecto.
2. **Índice de confianza:** alta, media o baja según fecha oficial, confirmaciones distintas e incidencias.
3. **Plan GLP seguro:** autonomía actual, estación principal y alternativa en cada tramo.
4. **Coste real del desvío:** kilómetros, minutos, consumo, peaje y cambio de sentido.
5. **Ficha técnica GLP:** horario real del surtidor, autoservicio, pago, boquilla, adaptador, turismo/autocaravana y restricciones.
6. **Ficha AdBlue útil:** surtidor o garrafa, turismo o camión, gran caudal y formato del precio.

En paralelo, la calidad de parada debe tener una verificación propia de diez segundos: baño abierto/cerrado, limpieza, cafetería abierta, comida disponible, accesibilidad y facilidad para familias, mascotas, campers o camiones. Cada atributo necesita fecha y nivel de confianza; una estrella genérica no sirve para decidir.

### P2 · Completar la mejor parada

- Baños, limpieza, café, accesibilidad, mascotas, familias, campers y camiones con fecha de verificación.
- Fotografías fechadas por categoría, no una galería genérica.
- Alertas de averías, reaperturas y cambios de precio en rutas guardadas.
- Perfiles de vehículo y predicción de autonomía basada en repostajes.
- Modo offline para un corredor y expansión a Portugal y Francia.

## Monetización compatible con la confianza

- Ficha profesional verificada para estaciones, sin bloquear las correcciones básicas.
- Un patrocinio claramente marcado por salida, sin alterar el ranking orgánico.
- Suscripción anual económica para offline, alertas y rutas avanzadas.
- Afiliación contextual con adaptadores, talleres, restauración y alojamiento.
- API B2B posterior para flotas y clubes, sin vender trayectos individuales.

No se mostrarán intersticiales antes de los resultados ni publicidad que dificulte una búsqueda urgente.

## Arquitectura económica

- Descargar MITECO una vez por ciclo y conservar el snapshot en R2.
- Escribir en D1 únicamente los cambios y las contribuciones de usuarios.
- Cachear listados nacionales y provinciales en el edge.
- Mantener la lista como interfaz primaria y cargar mapas solo bajo demanda.
- Delegar inicialmente la navegación en Google Maps, Waze o Apple Maps.
- PWA antes de aplicaciones nativas o integraciones con el coche.

## Métricas de producto

- Porcentaje de búsquedas que terminan en un repostaje confirmado.
- Estaciones GLP confirmadas durante los últimos 30 días.
- Rutas con al menos una alternativa segura.
- Incidencias resueltas y tiempo hasta su corrección.
- Usuarios que vuelven antes de 30 días.
- Clics de navegación por resultado y por nivel de confianza.

El número bruto de fichas es secundario. La métrica decisiva es que el conductor llegue y pueda repostar.
