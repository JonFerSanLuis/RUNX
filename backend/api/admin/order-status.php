<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../_response.php';
require_once __DIR__ . '/../_auth.php';
require_once __DIR__ . '/../_orders.php';
require_once __DIR__ . '/../../lib/mailer.php';

requirePost();
requireAdmin();

$payload = requestPayload();
$orderId = filter_var($payload['order_id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
$status = inputString($payload, 'status');
$carrier = inputString($payload, 'tracking_carrier');
$trackingNumber = inputString($payload, 'tracking_number');
$notifyCustomer = isset($payload['notify_customer']) ? filter_var($payload['notify_customer'], FILTER_VALIDATE_BOOLEAN) : true;

$validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
if ($orderId === false || $orderId === null) {
    apiError('Identificador de pedido no válido.', 422);
}
if (!in_array($status, $validStatuses, true)) {
    apiError('El estado seleccionado no es válido.', 422);
}

try {
    $db = database();

    // Obtener datos del pedido y del cliente
    $stmt = $db->prepare(
        'SELECT o.id, o.status, o.total, o.shipping_name, o.shipping_city, u.email, u.name AS user_name ' .
        'FROM orders o ' .
        'LEFT JOIN users u ON o.user_id = u.id ' .
        'WHERE o.id = :id LIMIT 1'
    );
    $stmt->execute(['id' => $orderId]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$order) {
        apiError('Pedido no encontrado.', 404);
    }

    $oldStatus = $order['status'];

    // Actualizar pedido
    $updateSql = 'UPDATE orders SET status = :status, tracking_carrier = :carrier, tracking_number = :track, ' .
                 'shipped_at = CASE WHEN :status_check = "shipped" AND shipped_at IS NULL THEN NOW() ELSE shipped_at END ' .
                 'WHERE id = :id';

    $updStmt = $db->prepare($updateSql);
    $updStmt->execute([
        'status' => $status,
        'carrier' => $carrier !== '' ? $carrier : null,
        'track' => $trackingNumber !== '' ? $trackingNumber : null,
        'status_check' => $status,
        'id' => $orderId,
    ]);

    // Si el estado cambia a enviado y se solicita notificar al cliente, enviar email
    $emailSent = false;
    if ($status === 'shipped' && $notifyCustomer) {
        $customerEmail = (string) ($order['email'] ?? '');
        $customerName = (string) (!empty($order['shipping_name']) ? $order['shipping_name'] : ($order['user_name'] ?? 'Cliente'));

        if ($customerEmail !== '') {
            try {
                $emailSent = sendOrderShippedEmail($order, $customerEmail, $customerName, $carrier, $trackingNumber);
            } catch (Throwable $mailEx) {
                error_log('Error enviando email de envío: ' . $mailEx->getMessage());
            }
        }
    }

    jsonResponse([
        'success' => true,
        'message' => 'Estado actualizado a ' . orderStatusLabel($status) . ($emailSent ? ' y notificación enviada al cliente por email.' : '.'),
        'new_status' => $status,
        'new_status_label' => orderStatusLabel($status),
        'email_sent' => $emailSent,
    ]);
} catch (Throwable $e) {
    error_log('Admin order-status error: ' . $e->getMessage());
    apiError('No se pudo actualizar el estado del pedido: ' . $e->getMessage(), 500);
}
