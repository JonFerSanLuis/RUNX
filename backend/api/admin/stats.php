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

try {
    $db = database();

    // 1. Métricas económicas y de pedidos
    $revenue = (float) ($db->query("SELECT SUM(total) FROM orders WHERE payment_status = 'paid'")->fetchColumn() ?: 0);
    $totalOrders = (int) $db->query("SELECT COUNT(*) FROM orders")->fetchColumn();
    $pendingOrders = (int) $db->query("SELECT COUNT(*) FROM orders WHERE status IN ('pending', 'confirmed')")->fetchColumn();
    $shippedOrders = (int) $db->query("SELECT COUNT(*) FROM orders WHERE status = 'shipped'")->fetchColumn();
    $deliveredOrders = (int) $db->query("SELECT COUNT(*) FROM orders WHERE status = 'delivered'")->fetchColumn();
    $totalCustomers = (int) $db->query("SELECT COUNT(*) FROM users")->fetchColumn();
    $totalProducts = (int) $db->query("SELECT COUNT(*) FROM products WHERE active = 1")->fetchColumn();

    // 2. Alertas de inventario crítico (stock <= 5)
    $lowStockStmt = $db->query(
        "SELECT p.id, p.name, p.price, p.stock, c.name AS category_name " .
        "FROM products p " .
        "LEFT JOIN categories c ON p.category_id = c.id " .
        "WHERE p.active = 1 AND p.stock <= 5 " .
        "ORDER BY p.stock ASC LIMIT 10"
    );
    $lowStockProducts = $lowStockStmt->fetchAll(PDO::FETCH_ASSOC);

    // 3. Últimos pedidos
    $recentStmt = $db->query(
        "SELECT id, status, payment_status, total, created_at, shipping_name, shipping_city, tracking_number " .
        "FROM orders ORDER BY created_at DESC LIMIT 6"
    );
    $recentOrders = array_map(function (array $o): array {
        return [
            'id' => (int) $o['id'],
            'status' => $o['status'],
            'status_label' => orderStatusLabel($o['status']),
            'payment_status' => $o['payment_status'],
            'payment_status_label' => paymentStatusLabel($o['payment_status']),
            'total' => $o['total'],
            'created_at' => $o['created_at'],
            'shipping_name' => $o['shipping_name'],
            'shipping_city' => $o['shipping_city'],
            'tracking_number' => $o['tracking_number'],
        ];
    }, $recentStmt->fetchAll(PDO::FETCH_ASSOC));

    jsonResponse([
        'success' => true,
        'metrics' => [
            'revenue_total' => $revenue,
            'revenue_total_label' => number_format($revenue, 2, ',', '.') . ' €',
            'orders_total' => $totalOrders,
            'orders_pending' => $pendingOrders,
            'orders_shipped' => $shippedOrders,
            'orders_delivered' => $deliveredOrders,
            'customers_total' => $totalCustomers,
            'products_total' => $totalProducts,
        ],
        'low_stock_products' => $lowStockProducts,
        'recent_orders' => $recentOrders,
    ]);
} catch (Throwable $e) {
    error_log('Admin stats error: ' . $e->getMessage());
    apiError('No se han podido cargar las estadísticas del panel.', 500);
}
