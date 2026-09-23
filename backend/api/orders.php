<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/_response.php';
require_once __DIR__ . '/_auth.php';
require_once __DIR__ . '/_orders.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    apiError('Método no permitido.', 405);
}
$userId = authenticatedUserId();

try {
    $statement = database()->prepare('SELECT id, status, total, created_at FROM orders WHERE user_id = :user_id ORDER BY created_at DESC, id DESC');
    $statement->execute(['user_id' => $userId]);
    $orders = array_map(fn(array $order): array => [
        'id' => (int) $order['id'], 'status' => $order['status'], 'status_label' => orderStatusLabel($order['status']),
        'total' => $order['total'], 'created_at' => $order['created_at'],
    ], $statement->fetchAll());
    jsonResponse(['data' => $orders]);
} catch (Throwable $exception) {
    error_log($exception->getMessage());
    apiError('No hemos podido cargar los pedidos. Inténtalo de nuevo.', 500);
}
