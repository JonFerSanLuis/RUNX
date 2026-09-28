<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../_response.php';
require_once __DIR__ . '/../_auth.php';
require_once __DIR__ . '/../_orders.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    apiError('Método no permitido.', 405);
}

requireAdmin();

$statusFilter = filter_input(INPUT_GET, 'status', FILTER_DEFAULT);
$search = trim((string) filter_input(INPUT_GET, 'q', FILTER_DEFAULT));
$limit = filter_input(INPUT_GET, 'limit', FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 100]]) ?: 50;

try {
    $db = database();

    $whereClauses = ['1=1'];
    $params = [];

    if ($statusFilter && in_array($statusFilter, ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'], true)) {
        $whereClauses[] = 'o.status = :status';
        $params['status'] = $statusFilter;
    }

    if ($search !== '') {
        if (ctype_digit($search)) {
            $whereClauses[] = '(o.id = :search_id OR o.shipping_phone LIKE :search_phone)';
            $params['search_id'] = (int) $search;
            $params['search_phone'] = '%' . $search . '%';
        } else {
            $whereClauses[] = '(o.shipping_name LIKE :search_name OR o.shipping_city LIKE :search_city OR u.email LIKE :search_email OR o.tracking_number LIKE :search_track)';
            $params['search_name'] = '%' . $search . '%';
            $params['search_city'] = '%' . $search . '%';
            $params['search_email'] = '%' . $search . '%';
            $params['search_track'] = '%' . $search . '%';
        }
    }

    $sql = 'SELECT o.id, o.user_id, o.status, o.payment_method, o.payment_status, o.payment_intent_id, ' .
           'o.shipping_cost, o.total, o.shipping_name, o.shipping_address, o.shipping_city, ' .
           'o.shipping_postal_code, o.shipping_province, o.shipping_phone, o.notes, ' .
           'o.tracking_carrier, o.tracking_number, o.shipped_at, o.created_at, ' .
           'u.email AS user_email ' .
           'FROM orders o ' .
           'LEFT JOIN users u ON o.user_id = u.id ' .
           'WHERE ' . implode(' AND ', $whereClauses) . ' ' .
           'ORDER BY o.created_at DESC LIMIT ' . (int) $limit;

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Obtener las líneas de productos para cada pedido
    $orderIds = array_column($orders, 'id');
    $itemsByOrder = [];

    if (!empty($orderIds)) {
        $inPlaceholders = implode(',', array_fill(0, count($orderIds), '?'));
        $itemStmt = $db->prepare(
            "SELECT order_id, product_name, size, color, quantity, unit_price, subtotal " .
            "FROM order_items WHERE order_id IN ({$inPlaceholders}) ORDER BY id ASC"
        );
        $itemStmt->execute($orderIds);
        $allItems = $itemStmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($allItems as $it) {
            $oid = (int) $it['order_id'];
            if (!isset($itemsByOrder[$oid])) {
                $itemsByOrder[$oid] = [];
            }
            $itemsByOrder[$oid][] = [
                'product_name' => $it['product_name'],
                'size' => $it['size'],
                'color' => $it['color'],
                'quantity' => (int) $it['quantity'],
                'unit_price' => $it['unit_price'],
                'subtotal' => $it['subtotal'],
            ];
        }
    }

    $result = array_map(function (array $o) use ($itemsByOrder): array {
        $oid = (int) $o['id'];
        $items = $itemsByOrder[$oid] ?? [];

        return [
            'id' => $oid,
            'user_id' => (int) $o['user_id'],
            'user_email' => $o['user_email'] ?: '',
            'status' => $o['status'],
            'status_label' => orderStatusLabel($o['status']),
            'payment_method' => $o['payment_method'],
            'payment_method_label' => paymentMethodLabel($o['payment_method']),
            'payment_status' => $o['payment_status'],
            'payment_status_label' => paymentStatusLabel($o['payment_status']),
            'payment_intent_id' => $o['payment_intent_id'],
            'total' => $o['total'],
            'shipping_cost' => $o['shipping_cost'],
            'created_at' => $o['created_at'],
            'shipping_details' => [
                'name' => $o['shipping_name'],
                'address' => $o['shipping_address'],
                'city' => $o['shipping_city'],
                'postal_code' => $o['shipping_postal_code'],
                'province' => $o['shipping_province'],
                'phone' => $o['shipping_phone'],
                'notes' => $o['notes'],
            ],
            'tracking' => [
                'carrier' => $o['tracking_carrier'],
                'number' => $o['tracking_number'],
                'shipped_at' => $o['shipped_at'],
            ],
            'items_count' => array_sum(array_column($items, 'quantity')),
            'items' => $items,
        ];
    }, $orders);

    jsonResponse(['success' => true, 'data' => $result]);
} catch (Throwable $e) {
    error_log('Admin orders error: ' . $e->getMessage());
    apiError('No se han podido cargar los pedidos.', 500);
}
