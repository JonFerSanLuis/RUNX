# PROJECT CONTEXT — TIENDA ONLINE RUNNING

## 1. DESCRIPCIÓN DEL PROYECTO

Estamos desarrollando una tienda online profesional especializada inicialmente en productos de running.

Los primeros productos que queremos estudiar y vender son principalmente:

* Calcetines técnicos de running.
* Calcetines antiampollas.
* Calcetines de compresión.
* Packs de calcetines.
* Cinturones/riñoneras para running.
* Cinturones para llevar el móvil.
* Accesorios relacionados con running.

El objetivo es crear una **marca deportiva real**, no una tienda genérica de dropshipping.

La marca todavía NO tiene nombre definitivo.

Actualmente se utiliza:

`BRAND NAME`

como nombre provisional.

---

# 2. OBJETIVO DEL PROYECTO

Crear una tienda online moderna, profesional, minimalista y orientada al deporte.

La tienda debe transmitir:

* Calidad.
* Confianza.
* Profesionalidad.
* Running.
* Producto técnico.
* Diseño premium.
* Simplicidad.

Debe evitar completamente la apariencia típica de:

* AliExpress.
* Tiendas genéricas de dropshipping.
* Webs saturadas de banners.
* Descuentos agresivos.
* Diseños sobrecargados.

---

# 3. TECNOLOGÍAS

## Frontend actual

Utilizar:

* HTML5
* CSS3
* Bootstrap 5
* JavaScript vanilla

## Backend futuro

Está previsto utilizar:

* PHP
* MySQL

## Herramientas

* Git
* GitHub
* VS Code
* Codex

---

# 4. TECNOLOGÍAS QUE NO DEBEN UTILIZARSE

No introducir estas tecnologías salvo que se solicite explícitamente:

* Vue
* React
* Angular
* Vite
* Node.js
* TypeScript
* Tailwind CSS
* jQuery

El proyecto debe mantenerse sencillo y compatible con los conocimientos actuales del propietario del proyecto.

---

# 5. ARQUITECTURA PREVISTA

La evolución prevista es:

```text
FASE 1
Frontend
HTML + CSS + Bootstrap + JavaScript
        ↓
FASE 2
PHP
        ↓
FASE 3
MySQL
        ↓
FASE 4
Usuarios y autenticación
        ↓
FASE 5
Pedidos
        ↓
FASE 6
Panel de administración
        ↓
FASE 7
Stripe / pagos
        ↓
FASE 8
Analítica y optimización
```

Actualmente estamos trabajando principalmente en el frontend.

---

# 6. ESTRUCTURA DEL PROYECTO

La estructura prevista es aproximadamente:

```text
/
├── index.html
├── tienda.html
├── producto.html
├── carrito.html
├── checkout.html
├── login.html
├── registro.html
├── cuenta.html
├── contacto.html
├── sobre-nosotros.html
├── faq.html
│
├── legal/
│   ├── aviso-legal.html
│   ├── privacidad.html
│   ├── cookies.html
│   ├── condiciones-compra.html
│   └── devoluciones.html
│
├── css/
│   ├── style.css
│   └── responsive.css
│
├── js/
│   ├── main.js
│   ├── products.js
│   ├── cart.js
│   ├── shop.js
│   └── product.js
│
├── assets/
│   ├── images/
│   ├── icons/
│   └── logo/
│
└── PROJECT_CONTEXT.md
```

La estructura puede modificarse si existe una razón técnica clara, pero debe mantenerse sencilla y organizada.

---

# 7. ESTADO ACTUAL DEL FRONTEND

La primera versión del frontend ya ha sido generada y visualmente nos gusta.

Actualmente existe una tienda con:

* Homepage.
* Tienda.
* Productos.
* Página individual de producto.
* Carrito.
* Checkout visual.
* Login.
* Registro.
* Cuenta.
* Contacto.
* Sobre nosotros.
* FAQ.
* Páginas legales.
* Navbar.
* Footer.
* Productos de prueba.
* Filtros.
* Ordenación.
* Carrito con localStorage.
* Diseño responsive.

La siguiente fase NO consiste en rehacer la web.

Consiste en mejorar especialmente la experiencia móvil.

---

# 8. DISEÑO VISUAL

El diseño actual gusta y debe conservarse.

Características:

* Minimalista.
* Deportivo.
* Premium.
* Limpio.
* Blanco/negro/grises.
* Color de acento limitado.
* Mucho espacio en blanco.
* Buena jerarquía visual.

NO cambiar radicalmente:

* Colores.
* Identidad.
* Estructura.
* Estética.
* Tipografía.

Las mejoras deben ser evolutivas.

---

# 9. PROBLEMA PRINCIPAL ACTUAL: MOBILE

La versión móvil actualmente pierde bastante calidad respecto a desktop.

La siguiente prioridad del proyecto es conseguir una experiencia móvil mucho más pulida.

El diseño debe seguir un enfoque:

```text
Mobile → Tablet → Desktop
```

No simplemente reducir el diseño desktop.

---

# 10. TIENDA — FILTROS EN MÓVIL

Problema actual:

Al entrar en la página de productos desde móvil, los filtros aparecen abiertos.

Comportamiento deseado:

## Desktop

Los filtros pueden permanecer visibles en una columna lateral.

## Móvil

Los filtros deben estar cerrados inicialmente.

Debe existir un botón:

`Filtros`

Al pulsarlo:

* Abrir panel desplegable.
* Mostrar categoría.
* Mostrar precio.
* Mostrar talla.
* Mostrar color.
* Botón "Aplicar filtros".
* Botón "Limpiar filtros".

Después de aplicar los filtros:

* El panel debe cerrarse.
* Los resultados deben actualizarse.
* Mostrar el número de filtros activos cuando sea útil.

Los filtros deben seguir funcionando con JavaScript.

---

# 11. PRODUCTOS EN MÓVIL

Problema actual:

Las tarjetas de producto ocupan prácticamente todo el ancho de la pantalla.

Esto hace que la tienda se vea poco refinada.

Comportamiento deseado:

## Móvil

Mostrar:

**2 productos por fila**

Debe existir:

* Margen lateral.
* Separación entre tarjetas.
* Imágenes proporcionadas.
* Tarjetas más compactas.

Ejemplo conceptual:

```text
┌───────────────────────────┐
│                           │
│  ┌────────┐  ┌────────┐  │
│  │PRODUCTO│  │PRODUCTO│  │
│  │        │  │        │  │
│  │ 9,99 € │  │14,99 € │  │
│  └────────┘  └────────┘  │
│                           │
└───────────────────────────┘
```

## Tablet

Aproximadamente:

3 columnas.

## Desktop

Aproximadamente:

4 columnas.

No utilizar anchuras rígidas que rompan otros tamaños.

---

# 12. TARJETAS DE PRODUCTO

En móvil deben priorizar:

1. Imagen.
2. Nombre.
3. Valoración.
4. Precio.
5. CTA.

El nombre del producto debería ocupar aproximadamente un máximo visual de 2 líneas.

Evitar tarjetas excesivamente altas.

Los botones deben tener suficiente área táctil.

---

# 13. NAVBAR MÓVIL

Debe funcionar correctamente en pantallas pequeñas.

Estructura deseada:

```text
LOGO                 CARRITO  ☰
```

Al abrir el menú:

* Inicio.
* Tienda.
* Categorías.
* Sobre nosotros.
* Contacto.
* FAQ.

Debe:

* Cerrarse correctamente.
* No provocar overflow.
* No tapar contenido innecesariamente.
* Mantener el carrito accesible.
* Mantener visible el contador del carrito.

---

# 14. HOMEPAGE MÓVIL

Revisar específicamente:

* Hero.
* Titulares.
* Subtítulos.
* Botones.
* Imágenes.
* Categorías.
* Productos destacados.
* Beneficios.
* Testimonios.
* CTA.
* Footer.

El hero no debe ser simplemente una versión reducida del desktop.

Debe:

* Tener altura adecuada.
* Mantener texto legible.
* Recortar correctamente la imagen.
* Mantener el CTA visible.
* No cortar elementos.
* No provocar scroll horizontal.

---

# 15. PÁGINA DE PRODUCTO EN MÓVIL

Orden recomendado:

```text
Galería
↓
Nombre
↓
Valoración
↓
Precio
↓
Descripción
↓
Color
↓
Talla
↓
Cantidad
↓
Añadir al carrito
↓
Características
↓
Envío
↓
Devoluciones
↓
Reseñas
↓
Productos relacionados
```

El botón:

`Añadir al carrito`

debe ser especialmente visible y fácil de pulsar.

---

# 16. CARRITO EN MÓVIL

Evitar tablas horizontales.

Cada producto debería aparecer como bloque/tarjeta con:

* Imagen.
* Nombre.
* Precio.
* Cantidad.
* Eliminar.

Después:

* Subtotal.
* Envío.
* Total.
* Finalizar compra.

El botón principal debe ser fácil de pulsar.

---

# 17. CHECKOUT EN MÓVIL

Utilizar una sola columna.

Campos:

* Nombre.
* Apellidos.
* Email.
* Teléfono.
* Dirección.
* Ciudad.
* Provincia.
* Código postal.
* País.

El resumen del pedido puede utilizar un acordeón en móvil.

Los pagos reales todavía NO están implementados.

---

# 18. FORMULARIOS

Revisar:

* Login.
* Registro.
* Contacto.
* Checkout.

En móvil:

* Una columna.
* Inputs suficientemente grandes.
* Labels claros.
* Espaciado suficiente.
* Botones cómodos.
* Mensajes de error legibles.

---

# 19. TIPOGRAFÍA RESPONSIVE

Revisar:

* H1.
* H2.
* H3.
* Texto normal.
* Precios.
* Botones.

No permitir:

* Titulares gigantes.
* Texto ilegible.
* Precios demasiado pequeños.
* Botones con texto cortado.

---

# 20. ESPACIADO

Mantener márgenes laterales consistentes.

Evitar:

* Contenido pegado al borde.
* Espacios excesivos.
* Secciones comprimidas.
* Padding incoherente.

El diseño móvil debe respirar.

---

# 21. IMÁGENES

Las imágenes de producto deben:

* Mantener proporción.
* No deformarse.
* Utilizar `object-fit` correctamente.
* Tener altura coherente.
* No provocar saltos de layout.

Las imágenes actuales son provisionales.

Posteriormente serán sustituidas por fotografías reales de los productos seleccionados.

---

# 22. OVERFLOW HORIZONTAL

Comprobar TODO el proyecto para evitar:

* `overflow-x`.
* Elementos fuera de pantalla.
* Imágenes demasiado grandes.
* Texto que no hace wrap.
* Botones demasiado anchos.
* Anchuras fijas.
* Tablas problemáticas.
* Márgenes negativos innecesarios.

La web no debe tener scroll horizontal accidental en móvil.

---

# 23. BREAKPOINTS A COMPROBAR

Comprobar especialmente:

* 320px.
* 360px.
* 375px.
* 390px.
* 414px.
* 768px.
* 992px.
* 1200px.

No optimizar únicamente para 390px.

---

# 24. PRODUCTOS DE PRUEBA

Los productos actuales son placeholders.

NO utilizar todavía productos reales de Alibaba.

La estructura de productos debe mantenerse preparada para posteriormente sustituirlos.

Campos mínimos:

```javascript
{
    id,
    name,
    category,
    price,
    oldPrice,
    description,
    images,
    colors,
    sizes,
    features,
    rating,
    reviews,
    stock,
    featured
}
```

---

# 25. CARRITO

Actualmente el carrito debe utilizar JavaScript + localStorage.

Debe permitir:

* Añadir.
* Eliminar.
* Cambiar cantidades.
* Vaciar.
* Calcular subtotal.
* Calcular total.
* Mantener datos tras recargar.

No romper esta funcionalidad mientras se realizan cambios visuales.

---

# 26. FUTURO BACKEND

Todavía NO implementar:

* PHP.
* MySQL.
* Autenticación real.
* Usuarios reales.
* Pedidos reales.
* Stripe.
* Panel administrativo completo.

Pero el frontend debe estar preparado para conectarse posteriormente.

---

# 27. FUTURO PANEL DE ADMINISTRACIÓN

Más adelante se quiere implementar:

* Dashboard.
* Productos.
* Categorías.
* Pedidos.
* Clientes.
* Stock.
* Cupones.
* Reseñas.
* Configuración.
* Estadísticas.

No implementar ahora salvo que se solicite explícitamente.

---

# 28. FUTURO PROVEEDOR

Actualmente estamos investigando proveedores.

Una de las plataformas que estamos considerando es Alibaba.

Uno de los productos que estamos estudiando es un:

**Calcetín técnico/de compresión para running.**

Todavía NO se ha elegido proveedor definitivo.

No incorporar productos reales hasta que se confirme:

* Calidad.
* Precio.
* MOQ.
* Envío a España.
* Tiempo de entrega.
* Almacén de origen.
* Seguimiento.
* Posibilidad de muestra.
* Personalización.
* Packaging.
* Composición.
* Tallas.

---

# 29. ESTRATEGIA DE PRODUCTO

Los dos grupos principales que se están estudiando son:

## Calcetines

Posibles variantes:

* Técnicos.
* Antiampollas.
* Compresión.
* Transpirables.
* Amortiguados.
* Trail.
* Running.
* Gym/CrossFit.
* Packs.

## Cinturones

Posibles variantes:

* Para móvil.
* Impermeables.
* Reflectantes.
* Doble bolsillo.
* Con espacio para llaves.
* Con espacio para geles.
* Con portabotella.

La idea futura es construir una marca especializada y no una tienda con cientos de productos aleatorios.

---

# 30. PRINCIPIO GENERAL DE DESARROLLO

El propietario del proyecto tiene conocimientos de:

* HTML.
* CSS.
* Bootstrap.
* JavaScript.
* PHP.
* MySQL.
* Git.
* Linux.

Por tanto:

* Mantener el código comprensible.
* No añadir complejidad innecesaria.
* Evitar dependencias innecesarias.
* Preferir soluciones sencillas.
* Explicar cambios importantes cuando sea necesario.

---

# 31. REGLA PARA CODEX

Cuando se trabaje sobre este proyecto:

* Modificar directamente los archivos.
* No limitarse a explicar qué código habría que escribir.
* Revisar el código existente antes de modificarlo.
* Mantener las funcionalidades existentes.
* No rehacer partes que ya funcionan sin necesidad.
* Probar los cambios.
* Buscar errores después de modificar.
* Mantener coherencia entre páginas.

Si una decisión no está especificada:

1. Elegir la solución más sencilla.
2. Mantener la estética existente.
3. Priorizar UX.
4. Priorizar responsive.
5. No introducir tecnologías nuevas innecesariamente.

---

# 32. PRIORIDAD ACTUAL

La prioridad inmediata es:

### PRIORIDAD 1

Optimizar completamente la experiencia móvil.

### PRIORIDAD 2

Comprobar que desktop no se haya deteriorado.

### PRIORIDAD 3

Revisar navegación, filtros y carrito.

### PRIORIDAD 4

Después de terminar responsive, continuar con nuevas funcionalidades.

---

# 33. PRÓXIMAS FASES PREVISTAS

Después de terminar el responsive:

```text
1. Responsive completo
       ↓
2. Pulido UX/UI
       ↓
3. Productos reales
       ↓
4. Selección de proveedor
       ↓
5. PHP
       ↓
6. MySQL
       ↓
7. Registro/Login real
       ↓
8. Productos desde BD
       ↓
9. Carrito conectado al backend
       ↓
10. Pedidos
       ↓
11. Panel administración
       ↓
12. Stripe
       ↓
13. Emails
       ↓
14. SEO
       ↓
15. Analytics
       ↓
16. Deploy
```

---

# 34. REGLA FINAL

Este archivo es el contexto principal del proyecto.

Si este proyecto se continúa desde otra conversación, cuenta o herramienta de IA, leer primero:

`PROJECT_CONTEXT.md`

Después inspeccionar el código real del proyecto.

El código existente tiene prioridad sobre cualquier descripción antigua de este documento si existe una discrepancia.

No asumir que una funcionalidad existe simplemente porque aparece descrita aquí: comprobar siempre el código actual.

La prioridad es mantener una tienda:

**profesional + rápida + responsive + sencilla + mantenible + preparada para crecer.**
