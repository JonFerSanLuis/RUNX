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
$orderId = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
if ($orderId === false || $orderId === null) {
    apiError('Identificador de pedido no válido.', 400);
}

try {
    $db = database();
    $statement = $db->prepare('SELECT id, status, total, created_at FROM orders WHERE id = :id AND user_id = :user_id LIMIT 1');
    $statement->execute(['id' => $orderId, 'user_id' => $userId]);
    $order = $statement->fetch();
    if (!$order) {
        apiError('Pedido no encontrado.', 404);
    }
    $itemsStatement = $db->prepare('SELECT product_id, product_name, quantity, unit_price, subtotal FROM order_items WHERE order_id = :order_id ORDER BY id');
    $itemsStatement->execute(['order_id' => $orderId]);
    $items = $itemsStatement->fetchAll();
    $subtotalCents = array_reduce($items, fn(int $total, array $item): int => $total + moneyToCents((string) $item['subtotal']), 0);
    $totalCents = moneyToCents((string) $order['total']);
    jsonResponse(['data' => [
        'id' => (int) $order['id'], 'status' => $order['status'], 'status_label' => orderStatusLabel($order['status']),
        'created_at' => $order['created_at'], 'subtotal' => centsToMoney($subtotalCents),
        'shipping' => centsToMoney(max(0, $totalCents - $subtotalCents)), 'total' => $order['total'],
        'items' => array_map(fn(array $item): array => ['product_id' => (int) $item['product_id'], 'product_name' => $item['product_name'], 'quantity' => (int) $item['quantity'], 'unit_price' => $item['unit_price'], 'subtotal' => $item['subtotal']], $items),
    ]]);
} catch (Throwable $exception) {
    error_log($exception->getMessage());
    apiError('No hemos podido cargar el pedido. Inténtalo de nuevo.', 500);
}
