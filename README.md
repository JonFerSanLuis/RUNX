# BRAND NAME — frontend de tienda running

Primera fase visual y funcional de una tienda de equipamiento técnico para running. **BRAND NAME**, productos, reseñas, precios, condiciones comerciales y textos legales son provisionales.

## Tecnologías

HTML5, CSS3, Bootstrap 5 (CDN) y JavaScript vanilla. No requiere Node, compilación ni backend.

## Ejecutar

Abre `index.html` en un navegador o sirve la carpeta con cualquier servidor estático. Bootstrap se carga desde CDN, por lo que se necesita conexión para sus estilos y componentes.

## Estructura

- `index.html`, `tienda.html`, `producto.html`, `carrito.html`, `checkout.html`: experiencia de compra.
- `login.html`, `registro.html`, `cuenta.html`: interfaces de cuenta preparadas para backend.
- `contacto.html`, `sobre-nosotros.html`, `faq.html`, `legal/`: información y formularios provisionales.
- `css/`: estilos de marca y ajustes responsive.
- `js/products.js`: catálogo temporal centralizado.
- `js/cart.js`: carrito persistente mediante `localStorage`.
- `js/shop.js` y `js/product.js`: filtros/ordenación/paginación y ficha dinámica.

## Modificar catálogo y estilos

Edita el array `PRODUCTS` de `js/products.js`. Cada producto conserva los campos que necesitará una futura API: id, nombre, categoría, precio, imágenes, variantes, características, valoración y stock. Los colores, espaciados y tipografía base están en `css/style.css`.

## Estado actual y siguiente fase

El carrito se mantiene tras recargar usando la clave `brand-name-cart` de `localStorage`. Checkout, login, registro y contacto solo validan en frontend y muestran una simulación. Pendiente: PHP/MySQL, usuarios, pedidos, gestión real de stock, catálogo real, Stripe/PayPal, formularios enviados, contenidos legales definitivos y políticas comerciales.
