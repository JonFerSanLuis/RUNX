<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/_response.php';

function stringList(PDO $db, string $table, string $column, int $productId): array
{
    $statement = $db->prepare("SELECT {$column} FROM {$table} WHERE product_id = :product_id ORDER BY sort_order, id");
    $statement->execute(['product_id' => $productId]);
    return array_column($statement->fetchAll(), $column);
}

function productPayload(PDO $db, array $row): array
{
    $id = (int) $row['id'];
    return [
        'id' => $id,
        'name' => $row['name'],
        'slug' => $row['slug'],
        'category' => $row['category_name'],
        'categorySlug' => $row['category_slug'],
        'price' => (float) $row['price'],
        'oldPrice' => $row['old_price'] === null ? null : (float) $row['old_price'],
        'description' => $row['description'],
        'stock' => (int) $row['stock'],
        'rating' => (float) $row['rating'],
        'reviews' => (int) $row['reviews_count'],
        'featured' => (bool) $row['featured'],
        'bestseller' => (bool) $row['bestseller'],
        'new' => (bool) $row['is_new'],
        'createdAt' => $row['created_at'],
        'images' => stringList($db, 'product_images', 'image_url', $id),
        'colors' => stringList($db, 'product_colors', 'name', $id),
        'sizes' => stringList($db, 'product_sizes', 'name', $id),
        'features' => stringList($db, 'product_features', 'feature_text', $id),
    ];
}

function integerParameter(string $name, int $default, int $min, int $max): int
{
    $value = filter_input(INPUT_GET, $name, FILTER_VALIDATE_INT);
    if ($value === null || $value === false) {
        return $default;
    }
    return max($min, min($max, $value));
}

function textListParameter(string $name, int $maxLength): array
{
    $value = filter_input(INPUT_GET, $name, FILTER_UNSAFE_RAW);
    if (!is_string($value) || $value === '') {
        return [];
    }
    return array_values(array_filter(array_map('trim', explode(',', $value)), fn(string $item): bool => $item !== '' && mb_strlen($item) <= $maxLength));
}

try {
    $db = database();
    $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    if (array_key_exists('id', $_GET) && ($id === null || $id === false)) {
        apiError('Identificador de producto no válido.', 400);
    }
    $baseSelect = 'SELECT p.*, c.name AS category_name, c.slug AS category_slug FROM products p INNER JOIN categories c ON c.id = p.category_id';

    if ($id !== null && $id !== false) {
        $statement = $db->prepare("{$baseSelect} WHERE p.id = :id AND p.active = 1");
        $statement->execute(['id' => $id]);
        $product = $statement->fetch();
        if (!$product) {
            apiError('Producto no encontrado.', 404);
        }
        jsonResponse(['data' => productPayload($db, $product)]);
    }

    $where = ['p.active = 1'];
    $params = [];
    $category = filter_input(INPUT_GET, 'category', FILTER_UNSAFE_RAW);
    if (is_string($category) && preg_match('/^[a-z0-9-]{1,120}$/', $category)) {
        $where[] = 'c.slug = :category';
        $params['category'] = $category;
    }
    $minPrice = filter_input(INPUT_GET, 'min_price', FILTER_VALIDATE_FLOAT);
    if ($minPrice !== false && $minPrice !== null && $minPrice >= 0) {
        $where[] = 'p.price >= :min_price';
        $params['min_price'] = $minPrice;
    }
    $maxPrice = filter_input(INPUT_GET, 'max_price', FILTER_VALIDATE_FLOAT);
    if ($maxPrice !== false && $maxPrice !== null && $maxPrice >= 0) {
        $where[] = 'p.price <= :max_price';
        $params['max_price'] = $maxPrice;
    }
    $featured = filter_input(INPUT_GET, 'featured', FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
    if ($featured === true) {
        $where[] = 'p.featured = 1';
    }
    $colors = textListParameter('color', 60);
    if ($colors) {
        $placeholders = [];
        foreach ($colors as $index => $color) {
            $key = "color_{$index}";
            $placeholders[] = ":{$key}";
            $params[$key] = $color;
        }
        $where[] = 'EXISTS (SELECT 1 FROM product_colors pc WHERE pc.product_id = p.id AND pc.name IN (' . implode(',', $placeholders) . '))';
    }
    $sizes = textListParameter('size', 30);
    if ($sizes) {
        $placeholders = [];
        foreach ($sizes as $index => $size) {
            $key = "size_{$index}";
            $placeholders[] = ":{$key}";
            $params[$key] = $size;
        }
        $where[] = 'EXISTS (SELECT 1 FROM product_sizes ps WHERE ps.product_id = p.id AND ps.name IN (' . implode(',', $placeholders) . '))';
    }

    $sorts = [
        'relevance' => 'p.featured DESC, p.bestseller DESC, p.id DESC',
        'best' => 'p.bestseller DESC, p.reviews_count DESC',
        'low' => 'p.price ASC',
        'high' => 'p.price DESC',
        'new' => 'p.is_new DESC, p.created_at DESC',
        'rating' => 'p.rating DESC, p.reviews_count DESC',
    ];
    $sort = filter_input(INPUT_GET, 'sort', FILTER_UNSAFE_RAW) ?: 'relevance';
    $orderBy = $sorts[$sort] ?? $sorts['relevance'];
    $page = integerParameter('page', 1, 1, 10000);
    $limit = integerParameter('limit', 12, 1, 50);
    $whereSql = implode(' AND ', $where);

    $count = $db->prepare("SELECT COUNT(*) FROM products p INNER JOIN categories c ON c.id = p.category_id WHERE {$whereSql}");
    $count->execute($params);
    $total = (int) $count->fetchColumn();
    $pages = max(1, (int) ceil($total / $limit));
    $page = min($page, $pages);
    $offset = ($page - 1) * $limit;
    $statement = $db->prepare("{$baseSelect} WHERE {$whereSql} ORDER BY {$orderBy} LIMIT :limit OFFSET :offset");
    foreach ($params as $key => $value) {
        $statement->bindValue(":{$key}", $value);
    }
    $statement->bindValue(':limit', $limit, PDO::PARAM_INT);
    $statement->bindValue(':offset', $offset, PDO::PARAM_INT);
    $statement->execute();
    $products = array_map(fn(array $row): array => productPayload($db, $row), $statement->fetchAll());
    jsonResponse(['data' => $products, 'pagination' => ['page' => $page, 'limit' => $limit, 'total' => $total, 'pages' => $pages]]);
} catch (Throwable $exception) {
    error_log($exception->getMessage());
    apiError('No hemos podido cargar los productos. Inténtalo de nuevo.', 500);
}
