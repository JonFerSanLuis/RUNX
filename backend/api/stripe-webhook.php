<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/stripe.php';
require_once __DIR__ . '/_response.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'POST') !== 'POST') {
    apiError('Método no permitido.', 405);
}

$payload = file_get_contents('php://input');
if ($payload === false || $payload === '') {
    apiError('Cuerpo de la petición vacío.', 400);
}

$config = stripeConfig();
$sigHeader = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';

// Si se ha configurado la clave secreta de webhook, verificar firma criptográfica
if (!empty($config['webhook_secret'])) {
    require_once __DIR__ . '/../lib/StripeClient.php';
    $valid = StripeClient::verifyWebhookSignature($payload, $sigHeader, $config['webhook_secret']);
    if (!$valid) {
        error_log('Stripe Webhook: Firma inválida.');
        apiError('Firma de webhook no válida.', 400);
    }
}

$event = json_decode($payload, true);
if (!is_array($event) || !isset($event['type'])) {
    apiError('Evento de Stripe no válido.', 400);
}

$eventType = $event['type'];

if ($eventType === 'payment_intent.succeeded') {
    $intent = $event['data']['object'] ?? [];
    $paymentIntentId = $intent['id'] ?? null;

    if ($paymentIntentId) {
        try {
            $db = database();
            $stmt = $db->prepare('SELECT id, status, payment_status FROM orders WHERE payment_intent_id = :pi LIMIT 1');
            $stmt->execute(['pi' => $paymentIntentId]);
            $order = $stmt->fetch();

            if ($order && $order['payment_status'] !== 'paid') {
                $update = $db->prepare('UPDATE orders SET payment_status = "paid", status = CASE WHEN status = "pending" THEN "confirmed" ELSE status END WHERE id = :id');
                $update->execute(['id' => $order['id']]);
                error_log("Stripe Webhook: Pedido #{$order['id']} actualizado a pagado por {$paymentIntentId}.");
            }
        } catch (Throwable $dbEx) {
            error_log('Stripe Webhook DB Error: ' . $dbEx->getMessage());
        }
    }
}

jsonResponse(['received' => true]);
