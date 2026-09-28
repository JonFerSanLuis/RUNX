<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/stripe.php';
require_once __DIR__ . '/_response.php';
require_once __DIR__ . '/_auth.php';
require_once __DIR__ . '/_orders.php';

requirePost();
$userId = authenticatedUserId();
$payload = requestPayload();
$items = $payload['items'] ?? null;

if (!is_array($items) || $items === [] || count($items) > 50) {
    apiError('El carrito no es válido o está vacío.', 422);
}

// Validación y agregación de ítems para calcular el precio exacto desde la base de datos
$productQuantities = [];
foreach ($items as $item) {
    if (!is_array($item) || !isset($item['product_id'], $item['quantity'])
        || filter_var($item['product_id'], FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]) === false
        || filter_var($item['quantity'], FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 100]]) === false) {
        apiError('Los productos del carrito no son válidos.', 422);
    }
    $productId = (int) $item['product_id'];
    $quantity = (int) $item['quantity'];
    $productQuantities[$productId] = ($productQuantities[$productId] ?? 0) + $quantity;
}

$db = database();
$subtotalCents = 0;

try {
    $stmt = $db->prepare('SELECT id, name, price, stock FROM products WHERE id = :id AND active = 1');
    foreach ($productQuantities as $productId => $totalQty) {
        $stmt->execute(['id' => $productId]);
        $product = $stmt->fetch();
        if (!$product) {
            apiError('Uno de los productos ya no está disponible en el catálogo.', 422);
        }
        if ((int) $product['stock'] < $totalQty) {
            apiError("No hay stock suficiente para {$product['name']}.", 422);
        }
        $subtotalCents += moneyToCents((string) $product['price']) * $totalQty;
    }

    $shippingCents = shippingCents($subtotalCents);
    $totalCents = $subtotalCents + $shippingCents;

    if ($totalCents <= 0) {
        apiError('El total del pedido no puede ser cero.', 422);
    }

    $config = stripeConfig();

    if ($config['ready']) {
        require_once __DIR__ . '/../lib/StripeClient.php';
        $stripe = new StripeClient($config['secret_key']);

        $intent = $stripe->createPaymentIntent($totalCents, $config['currency'], [
            'metadata' => [
                'user_id' => (string) $userId,
                'items_count' => (string) count($items),
            ],
            'description' => 'Pedido en tienda online BRAND NAME',
        ]);

        jsonResponse([
            'success' => true,
            'client_secret' => $intent['client_secret'],
            'id' => $intent['id'],
            'amount' => $totalCents,
            'currency' => $config['currency'],
            'mock' => false,
        ]);
    } else {
        // Modo de simulación local (sin claves de Stripe en .env)
        jsonResponse([
            'success' => true,
            'client_secret' => 'mock_sec_' . bin2hex(random_bytes(16)),
            'id' => 'mock_pi_' . bin2hex(random_bytes(12)),
            'amount' => $totalCents,
            'currency' => $config['currency'] ?: 'eur',
            'mock' => true,
            'message' => 'Modo de simulación de pago activo (Stripe no configurado en .env)',
        ]);
    }
} catch (Throwable $exception) {
    error_log('Error creando PaymentIntent: ' . $exception->getMessage());
    apiError('No se pudo inicializar la pasarela de pago: ' . $exception->getMessage(), 500);
}
