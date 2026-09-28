<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/_response.php';
require_once __DIR__ . '/_auth.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    apiError('Método no permitido.', 405);
}

$productId = filter_input(INPUT_GET, 'product_id', FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
if ($productId === false || $productId === null) {
    apiError('Identificador de producto no válido.', 400);
}

try {
    $db = database();

    // Comprobar que el producto existe
    $pStmt = $db->prepare('SELECT id, name FROM products WHERE id = :id AND active = 1 LIMIT 1');
    $pStmt->execute(['id' => $productId]);
    if (!$pStmt->fetch()) {
        apiError('Producto no encontrado.', 404);
    }

    // Obtener todas las opiniones del producto
    $statement = $db->prepare(
        'SELECT r.id, r.product_id, r.user_id, r.rating, r.title, r.comment, r.verified_purchase, r.created_at, ' .
        'u.name AS user_name ' .
        'FROM product_reviews r ' .
        'INNER JOIN users u ON r.user_id = u.id ' .
        'WHERE r.product_id = :product_id ' .
        'ORDER BY r.created_at DESC'
    );
    $statement->execute(['product_id' => $productId]);
    $reviews = $statement->fetchAll();

    $totalReviews = count($reviews);
    $sumRating = 0;
    $counts = [5 => 0, 4 => 0, 3 => 0, 2 => 0, 1 => 0];

    foreach ($reviews as $rev) {
        $r = (int) $rev['rating'];
        $sumRating += $r;
        if (isset($counts[$r])) {
            $counts[$r]++;
        }
    }

    $averageRating = $totalReviews > 0 ? round($sumRating / $totalReviews, 1) : 0.0;
    $breakdown = [];
    foreach ([5, 4, 3, 2, 1] as $star) {
        $c = $counts[$star];
        $breakdown[$star] = [
            'count' => $c,
            'percent' => $totalReviews > 0 ? round(($c / $totalReviews) * 100) : 0,
        ];
    }

    // Comprobar estado del usuario actual (si está logueado)
    startUserSession();
    $currentUserId = $_SESSION['user_id'] ?? null;
    $userStatus = [
        'logged_in' => false,
        'already_reviewed' => false,
        'verified_purchase' => false,
    ];

    if ($currentUserId !== null) {
        $userStatus['logged_in'] = true;
        // ¿Ya ha escrito reseña?
        $revStmt = $db->prepare('SELECT id FROM product_reviews WHERE product_id = :pid AND user_id = :uid LIMIT 1');
        $revStmt->execute(['pid' => $productId, 'uid' => (int) $currentUserId]);
        $userStatus['already_reviewed'] = (bool) $revStmt->fetch();

        // ¿Compró el producto?
        $buyStmt = $db->prepare(
            'SELECT oi.id FROM order_items oi ' .
            'INNER JOIN orders o ON oi.order_id = o.id ' .
            'WHERE oi.product_id = :pid AND o.user_id = :uid AND o.status != "cancelled" LIMIT 1'
        );
        $buyStmt->execute(['pid' => $productId, 'uid' => (int) $currentUserId]);
        $userStatus['verified_purchase'] = (bool) $buyStmt->fetch();
    }

    jsonResponse([
        'success' => true,
        'stats' => [
            'average' => $averageRating,
            'total' => $totalReviews,
            'breakdown' => $breakdown,
        ],
        'reviews' => array_map(function (array $r): array {
            $firstName = explode(' ', trim((string) $r['user_name']))[0];
            $initial = mb_substr(explode(' ', trim((string) $r['user_name']))[1] ?? '', 0, 1);
            $displayName = $initial !== '' ? "{$firstName} {$initial}." : $firstName;

            return [
                'id' => (int) $r['id'],
                'user_name' => $displayName,
                'rating' => (int) $r['rating'],
                'title' => $r['title'] ?: '',
                'comment' => $r['comment'],
                'verified_purchase' => (bool) $r['verified_purchase'],
                'created_at' => $r['created_at'],
            ];
        }, $reviews),
        'user_status' => $userStatus,
    ]);
} catch (Throwable $e) {
    error_log('Error listando reviews: ' . $e->getMessage());
    apiError('No se han podido cargar las opiniones del producto.', 500);
}
