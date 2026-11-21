# WMS: Kardex de Ubicaciones

Módulo independiente de la tienda (no toca nada fuera de esta carpeta).

- `index.html`: la aplicación (Resumen, Layout, Kardex e Inventario).
- `locs.json`: maestro de racks (7.464 posiciones, cámaras CD01 a CD06) tomado de la hoja GB del kardex.
- `products.json` y `seed.json` (catálogo de productos e inventario real) **no se suben** porque este repo es público. Están solo en la versión publicada.

Código de ubicación: `c` + cámara + pasillo + columna + nivel (+ profundidad en CD01 a CD04).
Ejemplo: `c401220502` = CD04, pasillo 01, columna 22, nivel 05, profundidad 02.

La versión publicada guarda los datos en una base compartida. Abierta fuera de esa página,
funciona como vista de ejemplo de solo lectura.
