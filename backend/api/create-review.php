<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/_response.php';
require_once __DIR__ . '/_auth.php';

requirePost();
$userId = authenticatedUserId();
$payload = requestPayload();

$productId = filter_var($payload['product_id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
$rating = filter_var($payload['rating'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 5]]);
$title = inputString($payload, 'title');
$comment = inputString($payload, 'comment');

if ($productId === false || $productId === null) {
    apiError('El producto indicado no es válido.', 422);
}
if ($rating === false || $rating === null) {
    apiError('Selecciona una valoración de 1 a 5 estrellas.', 422);
}
if (mb_strlen($title) > 120) {
    apiError('El título no puede superar los 120 caracteres.', 422);
}
if (mb_strlen($comment) < 5 || mb_strlen($comment) > 1000) {
    apiError('Tu opinión debe tener entre 5 y 1000 caracteres.', 422);
}

try {
    $db = database();

    // Comprobar existencia del producto
    $pCheck = $db->prepare('SELECT id, name FROM products WHERE id = :id AND active = 1 LIMIT 1');
    $pCheck->execute(['id' => $productId]);
    if (!$pCheck->fetch()) {
        apiError('El producto ya no está disponible en la tienda.', 404);
    }

    // Comprobar si ya existe reseña de este usuario para este producto
    $existing = $db->prepare('SELECT id FROM product_reviews WHERE product_id = :pid AND user_id = :uid LIMIT 1');
    $existing->execute(['pid' => $productId, 'uid' => $userId]);
    if ($existing->fetch()) {
        apiError('Ya has escrito una opinión para este producto.', 422);
    }

    // Comprobar si es compra verificada
    $orderCheck = $db->prepare(
        'SELECT oi.id FROM order_items oi ' .
        'INNER JOIN orders o ON oi.order_id = o.id ' .
        'WHERE oi.product_id = :pid AND o.user_id = :uid AND o.status != "cancelled" LIMIT 1'
    );
    $orderCheck->execute(['pid' => $productId, 'uid' => $userId]);
    $verifiedPurchase = $orderCheck->fetch() ? 1 : 0;

    $db->beginTransaction();

    // Insertar reseña
    $insert = $db->prepare(
        'INSERT INTO product_reviews (product_id, user_id, rating, title, comment, verified_purchase) ' .
        'VALUES (:pid, :uid, :rating, :title, :comment, :verified)'
    );
    $insert->execute([
        'pid' => $productId,
        'uid' => $userId,
        'rating' => $rating,
        'title' => $title !== '' ? $title : null,
        'comment' => $comment,
        'verified' => $verifiedPurchase,
    ]);

    // Recalcular métricas en la tabla products
    $updateProduct = $db->prepare(
        'UPDATE products SET ' .
        'reviews_count = (SELECT COUNT(*) FROM product_reviews WHERE product_id = :pid), ' .
        'rating = (SELECT ROUND(AVG(rating), 1) FROM product_reviews WHERE product_id = :pid) ' .
        'WHERE id = :pid'
    );
    $updateProduct->execute(['pid' => $productId]);

    $db->commit();

    jsonResponse([
        'success' => true,
        'verified_purchase' => (bool) $verifiedPurchase,
        'message' => '¡Gracias por compartir tu opinión! Ha sido publicada correctamente.',
    ]);
} catch (Throwable $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    error_log('Error creando reseña: ' . $e->getMessage());
    apiError('No se ha podido guardar tu opinión. Inténtalo de nuevo.', 500);
}
