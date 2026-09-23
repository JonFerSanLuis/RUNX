<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/_response.php';
require_once __DIR__ . '/_auth.php';
require_once __DIR__ . '/_orders.php';

requirePost();
$userId = authenticatedUserId();
$items = requestPayload()['items'] ?? null;

if (!is_array($items) || $items === [] || count($items) > 50) {
    apiError('El carrito no es válido o está vacío.', 422);
}

$quantities = [];
foreach ($items as $item) {
    if (!is_array($item) || !isset($item['product_id'], $item['quantity'])
        || filter_var($item['product_id'], FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]) === false
        || filter_var($item['quantity'], FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 100]]) === false) {
        apiError('Los productos o cantidades del carrito no son válidos.', 422);
    }
    $productId = (int) $item['product_id'];
    $quantities[$productId] = ($quantities[$productId] ?? 0) + (int) $item['quantity'];
    if ($quantities[$productId] > 100) {
        apiError('La cantidad solicitada no es válida.', 422);
    }
}
ksort($quantities);

$db = database();
try {
    $db->beginTransaction();
    $products = [];
    $subtotalCents = 0;
    $productStatement = $db->prepare('SELECT id, name, price, stock FROM products WHERE id = :id AND active = 1 FOR UPDATE');

    foreach ($quantities as $productId => $quantity) {
        $productStatement->execute(['id' => $productId]);
        $product = $productStatement->fetch();
        if (!$product) {
            throw new OrderValidationException('Uno de los productos ya no está disponible.');
        }
        if ((int) $product['stock'] < $quantity) {
            throw new OrderValidationException("No hay stock suficiente para {$product['name']}.");
        }
        $unitPriceCents = moneyToCents((string) $product['price']);
        $lineSubtotalCents = $unitPriceCents * $quantity;
        $subtotalCents += $lineSubtotalCents;
        $products[] = [
            'id' => (int) $product['id'], 'name' => $product['name'], 'quantity' => $quantity,
            'unit_price_cents' => $unitPriceCents, 'subtotal_cents' => $lineSubtotalCents,
        ];
    }

    $shipping = shippingCents($subtotalCents);
    $totalCents = $subtotalCents + $shipping;
    $orderStatement = $db->prepare('INSERT INTO orders (user_id, total) VALUES (:user_id, :total)');
    $orderStatement->execute(['user_id' => $userId, 'total' => centsToMoney($totalCents)]);
    $orderId = (int) $db->lastInsertId();
    $itemStatement = $db->prepare('INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal) VALUES (:order_id, :product_id, :product_name, :quantity, :unit_price, :subtotal)');
    $stockStatement = $db->prepare('UPDATE products SET stock = stock - :quantity_to_subtract WHERE id = :id AND stock >= :quantity_available');

    foreach ($products as $product) {
        $itemStatement->execute([
            'order_id' => $orderId, 'product_id' => $product['id'], 'product_name' => $product['name'],
            'quantity' => $product['quantity'], 'unit_price' => centsToMoney($product['unit_price_cents']),
            'subtotal' => centsToMoney($product['subtotal_cents']),
        ]);
        $stockStatement->execute(['id' => $product['id'], 'quantity_to_subtract' => $product['quantity'], 'quantity_available' => $product['quantity']]);
        if ($stockStatement->rowCount() !== 1) {
            throw new OrderValidationException('No hay stock suficiente para completar el pedido.');
        }
    }

    $db->commit();
    jsonResponse(['success' => true, 'order_id' => $orderId, 'message' => 'Pedido creado correctamente.']);
} catch (Throwable $exception) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    error_log($exception->getMessage());
    $message = $exception instanceof OrderValidationException ? $exception->getMessage() : 'No hemos podido crear el pedido. Inténtalo de nuevo.';
    apiError($message, $exception instanceof OrderValidationException ? 422 : 500);
}
