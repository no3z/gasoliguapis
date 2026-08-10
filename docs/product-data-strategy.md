# Gasoliguapis: estrategia de producto y datos

Investigación consolidada el 10 de agosto de 2026. La interfaz actual usa datos de demostración; no deben presentarse como observaciones reales.

## Posicionamiento

Gasoliguapis debe responder «¿dónde merece la pena parar?» y no limitarse a «¿dónde está más barata la gasolina?». La ventaja defendible es combinar sentido de circulación, desvío real, frescura y puntuaciones estructuradas de baños, limpieza, café, accesibilidad y servicios.

La lista debe ser la vista principal en móvil; el mapa es una ayuda secundaria. Los presets prioritarios son familias, mascotas, vehículo eléctrico, camión/autocaravana y movilidad reducida.

## Fuentes permitidas y recomendadas

- [MITECO: censo y precios de estaciones](https://datos.gob.es/es/catalogo/e05068001-instalaciones-de-suministro-de-combustibles-a-vehiculos-con-venta-publica): fuente nacional oficial, CC BY 4.0, con identificador `IDEESS`, ubicación, horario, rótulo, margen, productos y precios.
- [API REST oficial de precios](https://sedeaplicaciones.minetur.gob.es/ServiciosRestCarburantes/PreciosCarburantes/help/operations/PreciosEESSTerrestres): refresco del endpoint cada 30 minutos; los datos son declarados por los titulares y deben mostrar su antigüedad.
- [RIPREE: recarga eléctrica](https://datos.gob.es/es/catalogo/e05068001-puntos-de-recarga-de-vehiculos-electricos): ubicación, operador, conectores y potencia. No equivale a disponibilidad en tiempo real.
- [IGN/CNIG: Redes de Transporte](https://datos.gob.es/es/catalogo/e00125901-transporte) y [WFS INSPIRE](https://servicios.idee.es/wfs-inspire/transportes?REQUEST=GetCapabilities&SERVICE=WFS&VERSION=2.0.0): geometría, enlaces, puntos kilométricos, titularidad y áreas de servicio.
- [Catálogo de la Red de Carreteras del Estado](https://catalogorce.transportes.gob.es/descarga-catalogo): nomenclatura oficial anual; hay que filtrar vías en servicio.
- [NAP DGT/Transportes](https://nap.transportes.gob.es/Home/): incidencias y datos de movilidad reutilizables según cada conjunto.
- [CartoCiudad](https://datos.gob.es/en/catalogo/e0dat0002-servicio-rest-de-geocodificacion-de-espana-cartociudad): geocodificación pública; comprobar capacidad antes de escalar.

Ruta-e/MITECO publica servicios declarados por titulares como cafetería, tienda, lavado y agua/aire, pero no existe una descarga pública estable claramente documentada de todos esos campos. Antes de basar producción en su endpoint interno debe solicitarse un canal oficial a MITECO.

No existe una fuente nacional fiable para limpieza, calidad de baños, duchas, cambiadores, modernidad o calidad de comida. Esos datos deben proceder de propietarios verificados, usuarios y comprobaciones recientes de la plataforma.

No se deben copiar reseñas, fotos ni menús de Google, Tripadvisor o webs de marcas. El OAuth de Google solo autentica; no concede derechos sobre datos de Google Maps.

## Ingesta

1. Importación mensual de la red IGN/CNIG y cruce anual con el catálogo RCE.
2. Sincronización nocturna completa del censo MITECO usando `IDEESS` como referencia externa.
3. Descarga de precios cada 30 minutos desde backend; conservar hash, fecha de descarga, fuente y observaciones normalizadas.
4. Actualización semanal de RIPREE. Modelar estación, cargador y conector por separado.
5. Cruce con áreas de servicio y enlaces viarios. No usar solo distancia en línea recta: produce falsos positivos en calzadas paralelas y salidas inaccesibles desde un sentido.
6. Cada campo debe conservar `source`, `source_updated_at`, `fetched_at`, `confidence` y quién lo confirmó.
7. En interfaz: distinguir dato oficial, declarado por el negocio y confirmado por usuarios.

El MVP debería cubrir toda España con catálogo/precios básicos y enriquecer primero 300–500 paradas en A-1 a A-6, A-7 y AP-7. El alcance inicial recomendado son vías A/AP de la Red de Carreteras del Estado y estaciones hasta un desvío configurable.

### GLP y AdBlue

En la comprobación oficial del 10 de agosto de 2026, el feed contenía 1.000 estaciones con precio GLP declarado, 2.928 con AdBlue y 403 con ambos. Los campos exactos son `Precio Gases licuados del petróleo` y `Precio Adblue`.

La declaración de AdBlue es voluntaria: precio presente significa disponibilidad oficial confirmada, pero campo vacío significa «desconocido», no «no disponible». La interfaz debe conservar ese tercer estado y permitir confirmación por negocio o comunidad.

## Comunidad, confianza y legal

- Una cuenta social reduce spam, pero no verifica una visita.
- La visita verificada debe basarse en geolocalización puntual o navegación iniciada, sin guardar un historial continuo.
- Las notas deben aplicar media bayesiana, frescura y confianza; dos votos no pueden superar automáticamente cientos de valoraciones.
- Mostrar fecha, fuente y nivel de confianza de precios y servicios.
- Moderación, denuncia, apelación, derecho de respuesta del negocio y auditoría son requisitos del MVP.
- Aceptar y rechazar cookies debe tener la misma facilidad; analítica y publicidad requieren consentimiento separado.
- Los anuncios y promociones deben quedar rotulados y nunca alterar la nota ni ocultar reseñas.
- La atribución MITECO propuesta: «Origen de los datos: Ministerio para la Transición Ecológica y el Reto Demográfico», con fecha de actualización.
- [Condiciones MITECO](https://www.datosabiertos.miteco.gob.es/es/aviso-legal.html) y [licencia CNIG](https://centrodedescargas.cnig.es/CentroDescargas/aviso-legal).

## Modelo de negocio

Orden recomendado:

1. Fichas Pro para estaciones (respuestas, verificación, analítica y promociones): 39–99 €/mes por ubicación como hipótesis a validar.
2. Panel multiestación, reputación y datos B2B para cadenas.
3. Cupones y promociones de cafetería, menú, lavado o recarga.
4. Patrocinios contextuales por corredor, identificados como publicidad.
5. Publicidad programática limitada y no invasiva.
6. Afiliación con alojamientos, asistencia y turismo.
7. Premium opcional sin anuncios, con rutas offline y alertas avanzadas.

La métrica principal debe ser la decisión de parada cualificada: inicio de navegación y confirmación posterior. Métricas secundarias: cobertura verificada, frescura, búsqueda a navegación, reseña tras visita, repetición a 30/90 días y conversión de propietarios.

## Decisiones pendientes

1. Si el alcance incluye solo la Red de Carreteras del Estado o también autovías autonómicas.
2. Desvío máximo aceptable: 1, 2 o 5 km / tiempo equivalente.
3. Público inicial prioritario: familias, profesionales, turistas o ahorro.
4. Proveedor de identidad. Sites no debe recibir un OAuth Google/Facebook propio improvisado: confirmar una ruta soportada o usar acceso con ChatGPT en el primer MVP.
