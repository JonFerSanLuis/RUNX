<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../_response.php';
require_once __DIR__ . '/../_auth.php';

requireAdmin();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$db = database();

if ($method === 'GET') {
    // Listado de productos para gestión de catálogo
    try {
        $stmt = $db->query(
            'SELECT p.id, p.category_id, p.name, p.slug, p.description, p.price, p.old_price, p.stock, ' .
            'p.rating, p.reviews_count, p.featured, p.bestseller, p.is_new, p.active, p.created_at, ' .
            'c.name AS category_name, ' .
            '(SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY sort_order ASC, id ASC LIMIT 1) AS image_url ' .
            'FROM products p ' .
            'LEFT JOIN categories c ON p.category_id = c.id ' .
            'ORDER BY p.id DESC'
        );
        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $catsStmt = $db->query('SELECT id, name, slug FROM categories ORDER BY name ASC');
        $categories = $catsStmt->fetchAll(PDO::FETCH_ASSOC);

        jsonResponse([
            'success' => true,
            'products' => array_map(function (array $p): array {
                return [
                    'id' => (int) $p['id'],
                    'category_id' => (int) $p['category_id'],
                    'category_name' => $p['category_name'] ?: 'Sin categoría',
                    'name' => $p['name'],
                    'slug' => $p['slug'],
                    'description' => $p['description'],
                    'price' => (float) $p['price'],
                    'old_price' => $p['old_price'] !== null ? (float) $p['old_price'] : null,
                    'stock' => (int) $p['stock'],
                    'rating' => (float) $p['rating'],
                    'reviews_count' => (int) $p['reviews_count'],
                    'featured' => (bool) $p['featured'],
                    'bestseller' => (bool) $p['bestseller'],
                    'is_new' => (bool) $p['is_new'],
                    'active' => (bool) $p['active'],
                    'image_url' => $p['image_url'] ?: 'assets/images/products-studio.png',
                    'created_at' => $p['created_at'],
                ];
            }, $products),
            'categories' => $categories,
        ]);
    } catch (Throwable $e) {
        error_log('Admin products GET error: ' . $e->getMessage());
        apiError('No se han podido cargar los productos.', 500);
    }
} elseif ($method === 'POST') {
    // Crear o editar producto
    $payload = requestPayload();
    $id = filter_var($payload['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    $name = inputString($payload, 'name');
    $categoryId = filter_var($payload['category_id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    $description = inputString($payload, 'description');
    $price = filter_var($payload['price'] ?? null, FILTER_VALIDATE_FLOAT);
    $oldPrice = !empty($payload['old_price']) ? filter_var($payload['old_price'], FILTER_VALIDATE_FLOAT) : null;
    $stock = filter_var($payload['stock'] ?? 0, FILTER_VALIDATE_INT, ['options' => ['min_range' => 0]]) !== false
        ? (int) $payload['stock'] : 0;
    $active = isset($payload['active']) ? (int) filter_var($payload['active'], FILTER_VALIDATE_BOOLEAN) : 1;
    $featured = isset($payload['featured']) ? (int) filter_var($payload['featured'], FILTER_VALIDATE_BOOLEAN) : 0;
    $bestseller = isset($payload['bestseller']) ? (int) filter_var($payload['bestseller'], FILTER_VALIDATE_BOOLEAN) : 0;
    $isNew = isset($payload['is_new']) ? (int) filter_var($payload['is_new'], FILTER_VALIDATE_BOOLEAN) : 0;
    $imageUrl = inputString($payload, 'image_url');

    if ($name === '' || mb_strlen($name) > 180) {
        apiError('El nombre del producto es obligatorio (máx. 180 caracteres).', 422);
    }
    if ($categoryId === false || $categoryId === null) {
        apiError('Selecciona una categoría válida.', 422);
    }
    if ($price === false || $price <= 0) {
        apiError('El precio debe ser un número positivo.', 422);
    }

    // Generar slug
    $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $name), '-'));

    try {
        $db->beginTransaction();

        if ($id) {
            // Actualizar producto existente
            $upd = $db->prepare(
                'UPDATE products SET category_id = :cat, name = :name, slug = :slug, description = :desc, ' .
                'price = :price, old_price = :old_price, stock = :stock, active = :active, ' .
                'featured = :featured, bestseller = :bestseller, is_new = :is_new ' .
                'WHERE id = :id'
            );
            $upd->execute([
                'cat' => $categoryId,
                'name' => $name,
                'slug' => $slug . '-' . $id,
                'desc' => $description,
                'price' => number_format($price, 2, '.', ''),
                'old_price' => $oldPrice !== null ? number_format($oldPrice, 2, '.', '') : null,
                'stock' => $stock,
                'active' => $active,
                'featured' => $featured,
                'bestseller' => $bestseller,
                'is_new' => $isNew,
                'id' => $id,
            ]);

            $productId = $id;
            $msg = 'Producto actualizado correctamente.';
        } else {
            // Insertar nuevo producto
            $uniqueSlug = $slug . '-' . bin2hex(random_bytes(3));
            $ins = $db->prepare(
                'INSERT INTO products (category_id, name, slug, description, price, old_price, stock, active, featured, bestseller, is_new) ' .
                'VALUES (:cat, :name, :slug, :desc, :price, :old_price, :stock, :active, :featured, :bestseller, :is_new)'
            );
            $ins->execute([
                'cat' => $categoryId,
                'name' => $name,
                'slug' => $uniqueSlug,
                'desc' => $description,
                'price' => number_format($price, 2, '.', ''),
                'old_price' => $oldPrice !== null ? number_format($oldPrice, 2, '.', '') : null,
                'stock' => $stock,
                'active' => $active,
                'featured' => $featured,
                'bestseller' => $bestseller,
                'is_new' => $isNew,
            ]);
            $productId = (int) $db->lastInsertId();
            $msg = 'Producto añadido al catálogo correctamente.';
        }

        // Si se envió una imagen, guardarla en product_images
        if ($imageUrl !== '') {
            $imgCheck = $db->prepare('SELECT id FROM product_images WHERE product_id = :pid ORDER BY sort_order ASC LIMIT 1');
            $imgCheck->execute(['pid' => $productId]);
            $existingImg = $imgCheck->fetch(PDO::FETCH_ASSOC);

            if ($existingImg) {
                $imgUpd = $db->prepare('UPDATE product_images SET image_url = :url WHERE id = :id');
                $imgUpd->execute(['url' => $imageUrl, 'id' => $existingImg['id']]);
            } else {
                $imgIns = $db->prepare('INSERT INTO product_images (product_id, image_url, sort_order) VALUES (:pid, :url, 0)');
                $imgIns->execute(['pid' => $productId, 'url' => $imageUrl]);
            }
        }

        $db->commit();
        jsonResponse(['success' => true, 'product_id' => $productId, 'message' => $msg]);
    } catch (Throwable $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        error_log('Admin products POST error: ' . $e->getMessage());
        apiError('No se pudo guardar el producto: ' . $e->getMessage(), 500);
    }
} elseif ($method === 'PATCH') {
    // Activar o desactivar producto rápidamente
    $payload = requestPayload();
    $id = filter_var($payload['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    if (!$id) {
        apiError('ID de producto no válido.', 422);
    }

    try {
        $stmt = $db->prepare('UPDATE products SET active = 1 - active WHERE id = :id');
        $stmt->execute(['id' => $id]);
        jsonResponse(['success' => true, 'message' => 'Estado del producto actualizado.']);
    } catch (Throwable $e) {
        apiError('Error actualizando estado.', 500);
    }
} else {
    apiError('Método no permitido.', 405);
}
