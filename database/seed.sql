USE running_store;

INSERT INTO categories (id, name, slug, description) VALUES
(1, 'Calcetines', 'calcetines', 'Calcetines técnicos de running.'),
(2, 'Running', 'running', 'Equipamiento esencial para correr.'),
(3, 'Accesorios', 'accesorios', 'Accesorios funcionales de running.');

INSERT INTO products (id, category_id, name, slug, description, price, old_price, stock, rating, reviews_count, featured, bestseller, is_new, active, created_at) VALUES
(1,1,'Calcetines técnicos Endurance','calcetines-tecnicos-endurance','Calcetín técnico ligero para entrenamientos y carreras de cualquier distancia.',12.95,15.95,18,4.8,124,1,1,0,1,'2026-01-10'),
(2,3,'Cinturón running Pace','cinturon-running-pace','Cinturón compacto para llevar lo imprescindible con estabilidad durante la carrera.',24.95,NULL,12,4.7,89,1,1,1,1,'2026-02-12'),
(3,1,'Calcetines Performance Crew','calcetines-performance-crew','Mayor cobertura y compresión suave para sesiones de entrenamiento exigentes.',14.95,NULL,8,4.9,56,1,0,1,1,'2026-02-25'),
(4,2,'Riñonera Trail Essential','rinonera-trail-essential','Solución minimalista para tus rutas, con espacio organizado y acceso rápido.',29.95,34.95,20,4.6,41,1,0,0,1,'2026-01-22'),
(5,1,'Calcetines Recovery Light','calcetines-recovery-light','Diseño fino y confortable para entrenamientos diarios.',11.95,NULL,25,4.5,32,0,0,0,1,'2025-12-08'),
(6,3,'Banda porta-dorsal Race','banda-porta-dorsal-race','Accesorio funcional para carreras y entrenamiento.',16.95,NULL,15,4.4,21,0,0,1,1,'2026-02-06'),
(7,1,'Calcetines Antiampollas Flow','calcetines-antiampollas-flow','Doble capa ligera para largas sesiones de asfalto.',15.95,NULL,14,4.7,65,1,1,0,1,'2026-01-29'),
(8,2,'Cinturón Phone Secure','cinturon-phone-secure','Cinturón ceñido con compartimento para móvil y llaves.',27.95,NULL,11,4.6,38,0,1,1,1,'2026-03-01'),
(9,1,'Calcetines Compresión Tempo','calcetines-compresion-tempo','Compresión suave para dar soporte en ritmos sostenidos.',17.95,19.95,17,4.5,29,0,0,0,1,'2025-11-18'),
(10,3,'Portageles Run Lite','portageles-run-lite','Accesorio minimalista para llevar nutrición de carrera.',13.95,NULL,23,4.3,18,0,0,0,1,'2025-12-20'),
(11,1,'Calcetines Trail Cushion','calcetines-trail-cushion','Acolchado estratégico para terrenos variables.',16.95,NULL,9,4.8,47,1,0,1,1,'2026-03-05'),
(12,2,'Riñonera City Distance','rinonera-city-distance','Riñonera ligera de perfil bajo para rodajes urbanos.',26.95,NULL,16,4.6,34,0,0,0,1,'2026-01-15'),
(13,1,'Pack Calcetines Daily x3','pack-calcetines-daily-x3','Pack de tres pares técnicos para entrenamiento diario.',29.95,34.95,30,4.7,72,1,1,0,1,'2026-02-18'),
(14,3,'Cinturón Reflective Night','cinturon-reflective-night','Cinturón con detalles reflectantes para salidas de baja luz.',25.95,NULL,13,4.5,26,0,0,1,1,'2026-03-08');

INSERT INTO product_images (product_id, image_url, sort_order) SELECT id, 'assets/images/products-studio.png', 1 FROM products;
INSERT INTO product_colors (product_id,name,sort_order) SELECT id,'Negro',1 FROM products;
INSERT INTO product_colors (product_id,name,sort_order) SELECT id,'Blanco',2 FROM products WHERE category_id=1;
INSERT INTO product_colors (product_id,name,sort_order) SELECT id,'Gris',2 FROM products WHERE category_id IN (2,3);
INSERT INTO product_sizes (product_id,name,sort_order) SELECT id,'S',1 FROM products WHERE category_id=1;
INSERT INTO product_sizes (product_id,name,sort_order) SELECT id,'M',2 FROM products WHERE category_id=1;
INSERT INTO product_sizes (product_id,name,sort_order) SELECT id,'L',3 FROM products WHERE category_id=1;
INSERT INTO product_sizes (product_id,name,sort_order) SELECT id,'Única',1 FROM products WHERE category_id IN (2,3);
INSERT INTO product_features (product_id,feature_text,sort_order) SELECT id,'Tejido transpirable',1 FROM products;
INSERT INTO product_features (product_id,feature_text,sort_order) SELECT id,'Diseño ligero y funcional',2 FROM products;
INSERT INTO product_features (product_id,feature_text,sort_order) SELECT id,'Ajuste pensado para running',3 FROM products;
