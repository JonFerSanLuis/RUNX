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
    $statement = $db->prepare(
        'SELECT id, status, payment_method, payment_status, payment_intent_id, shipping_cost, total, shipping_name, shipping_address, shipping_city, ' .
        'shipping_postal_code, shipping_province, shipping_phone, notes, created_at ' .
        'FROM orders WHERE id = :id AND user_id = :user_id LIMIT 1'
    );
    $statement->execute(['id' => $orderId, 'user_id' => $userId]);
    $order = $statement->fetch();
    if (!$order) {
        apiError('Pedido no encontrado.', 404);
    }

    $itemsStatement = $db->prepare(
        'SELECT product_id, product_name, size, color, quantity, unit_price, subtotal ' .
        'FROM order_items WHERE order_id = :order_id ORDER BY id'
    );
    $itemsStatement->execute(['order_id' => $orderId]);
    $items = $itemsStatement->fetchAll();

    $subtotalCents = array_reduce(
        $items,
        fn(int $total, array $item): int => $total + moneyToCents((string) $item['subtotal']),
        0
    );

    jsonResponse(['data' => [
        'id' => (int) $order['id'],
        'status' => $order['status'],
        'status_label' => orderStatusLabel($order['status']),
        'payment_method' => $order['payment_method'] ?? 'card',
        'payment_method_label' => paymentMethodLabel($order['payment_method'] ?? 'card'),
        'payment_status' => $order['payment_status'] ?? 'unpaid',
        'payment_status_label' => paymentStatusLabel($order['payment_status'] ?? 'unpaid'),
        'payment_intent_id' => $order['payment_intent_id'],
        'created_at' => $order['created_at'],
        'subtotal' => centsToMoney($subtotalCents),
        'shipping' => $order['shipping_cost'],
        'total' => $order['total'],
        'shipping_details' => [
            'name' => $order['shipping_name'],
            'address' => $order['shipping_address'],
            'city' => $order['shipping_city'],
            'postal_code' => $order['shipping_postal_code'],
            'province' => $order['shipping_province'],
            'phone' => $order['shipping_phone'],
            'notes' => $order['notes'],
        ],
        'items' => array_map(fn(array $item): array => [
            'product_id' => (int) $item['product_id'],
            'product_name' => $item['product_name'],
            'size' => $item['size'],
            'color' => $item['color'],
            'quantity' => (int) $item['quantity'],
            'unit_price' => $item['unit_price'],
            'subtotal' => $item['subtotal'],
        ], $items),
    ]]);
} catch (Throwable $exception) {
    error_log($exception->getMessage());
    apiError('No hemos podido cargar el pedido. Inténtalo de nuevo.', 500);
}
