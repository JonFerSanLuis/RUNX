# BRAND NAME — tienda de running

Frontend responsive y API de catálogo para una tienda de running. Marca, productos, precios, reseñas y contenidos legales son provisionales.

## Tecnologías

HTML5, CSS3, Bootstrap 5, JavaScript vanilla, PHP, MySQL y PDO. No utiliza Node ni frameworks.

## Estructura relevante

- `backend/config/database.php`: conexión PDO y carga opcional de `.env`.
- `backend/api/products.php`: catálogo JSON, detalle, filtros, ordenación y paginación.
- `backend/api/categories.php`: categorías JSON.
- `database/schema.sql`: estructura MySQL con claves, relaciones e índices.
- `database/seed.sql`: 14 productos ficticios, variantes, imágenes y características.
- `js/products.js`: cliente `fetch()` de la API.
- `js/shop.js`, `js/product.js`, `js/cart.js`: tienda, producto y carrito con datos de API.

## Arranque local

1. Copia `.env.example` como `.env` y completa las credenciales locales de MySQL. `.env` no se versiona.
2. Ejecuta `database/schema.sql` y después `database/seed.sql` en MySQL:

   ```bash
   mysql -u root -p < database/schema.sql
   mysql -u root -p running_store < database/seed.sql
   ```

3. Desde la raíz del proyecto, inicia PHP:

   ```bash
   php -S localhost:8000
   ```

4. Abre `http://localhost:8000/index.html`. No abras el proyecto con `file:///`, ya que el catálogo necesita la API PHP.

## Probar la API

```text
http://localhost:8000/backend/api/categories.php
http://localhost:8000/backend/api/products.php
http://localhost:8000/backend/api/products.php?id=1
http://localhost:8000/backend/api/products.php?category=calcetines&min_price=10&max_price=20&sort=low&page=1&limit=12
http://localhost:8000/backend/api/products.php?color=Negro,Blanco&size=M&featured=1
```

La API devuelve errores públicos genéricos y nunca expone credenciales ni consultas SQL. Los criterios de ordenación usan una lista permitida y todos los filtros se parametrizan con PDO.

## Estado actual

El carrito permanece en `localStorage` y almacena IDs de los productos, cantidad, talla y color. El backend de esta fase solo expone catálogo. Están pendientes usuarios, sesiones, pedidos, pagos, stock avanzado, administración, formularios reales y políticas comerciales definitivas.
