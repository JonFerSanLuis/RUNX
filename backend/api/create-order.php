<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/_response.php';
require_once __DIR__ . '/_auth.php';
require_once __DIR__ . '/_orders.php';

requirePost();
$userId = authenticatedUserId();
$payload = requestPayload();
$items = $payload['items'] ?? null;
$shipping = $payload['shipping'] ?? null;

if (!is_array($items) || $items === [] || count($items) > 50) {
    apiError('El carrito no es válido o está vacío.', 422);
}

if (!is_array($shipping)) {
    apiError('Los datos de envío no son válidos.', 422);
}

// Validación de datos de envío
$shippingName = inputString($shipping, 'name');
$shippingAddress = inputString($shipping, 'address');
$shippingCity = inputString($shipping, 'city');
$shippingPostalCode = inputString($shipping, 'postal_code');
$shippingProvince = inputString($shipping, 'province');
$shippingPhone = inputString($shipping, 'phone');
$shippingNotes = inputString($shipping, 'notes');

if ($shippingName === '' || mb_strlen($shippingName) > 120) {
    apiError('Introduce el nombre del destinatario (máx. 120 caracteres).', 422);
}
if ($shippingAddress === '' || mb_strlen($shippingAddress) > 255) {
    apiError('Introduce una dirección de entrega válida.', 422);
}
if ($shippingCity === '' || mb_strlen($shippingCity) > 100) {
    apiError('Introduce la ciudad de entrega.', 422);
}
if ($shippingPostalCode === '' || mb_strlen($shippingPostalCode) > 20) {
    apiError('Introduce un código postal válido.', 422);
}
if ($shippingProvince === '' || mb_strlen($shippingProvince) > 100) {
    apiError('Introduce la provincia.', 422);
}
if ($shippingPhone === '' || mb_strlen($shippingPhone) > 30) {
    apiError('Introduce un teléfono de contacto para el transportista.', 422);
}
if (mb_strlen($shippingNotes) > 500) {
    apiError('Las notas de entrega no pueden superar los 500 caracteres.', 422);
}

// Validación de ítems y agregación de cantidades por producto
$validatedItems = [];
$productQuantities = [];

foreach ($items as $item) {
    if (!is_array($item) || !isset($item['product_id'], $item['quantity'])
        || filter_var($item['product_id'], FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]) === false
        || filter_var($item['quantity'], FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 100]]) === false) {
        apiError('Los productos o cantidades del carrito no son válidos.', 422);
    }

    $productId = (int) $item['product_id'];
    $quantity = (int) $item['quantity'];
    $size = isset($item['size']) && is_string($item['size']) ? trim($item['size']) : null;
    $color = isset($item['color']) && is_string($item['color']) ? trim($item['color']) : null;

    if ($size !== null && ($size === '' || mb_strlen($size) > 30)) {
        $size = null;
    }
    if ($color !== null && ($color === '' || mb_strlen($color) > 60)) {
        $color = null;
    }

    $validatedItems[] = [
        'product_id' => $productId,
        'quantity' => $quantity,
        'size' => $size,
        'color' => $color,
    ];

    $productQuantities[$productId] = ($productQuantities[$productId] ?? 0) + $quantity;
    if ($productQuantities[$productId] > 100) {
        apiError('La cantidad solicitada supera el límite permitido.', 422);
    }
}

// Ordenar por ID de producto para evitar deadlocks en la transacción
ksort($productQuantities);

$db = database();
try {
    $db->beginTransaction();

    $productStatement = $db->prepare('SELECT id, name, price, stock FROM products WHERE id = :id AND active = 1 FOR UPDATE');
    $productDetails = [];
    $subtotalCents = 0;

    foreach ($productQuantities as $productId => $totalQty) {
        $productStatement->execute(['id' => $productId]);
        $product = $productStatement->fetch();
        if (!$product) {
            throw new OrderValidationException('Uno de los productos ya no está disponible.');
        }
        if ((int) $product['stock'] < $totalQty) {
            throw new OrderValidationException("No hay stock suficiente para {$product['name']}.");
        }

        $unitPriceCents = moneyToCents((string) $product['price']);
        $productDetails[$productId] = [
            'id' => (int) $product['id'],
            'name' => (string) $product['name'],
            'unit_price_cents' => $unitPriceCents,
            'unit_price_money' => centsToMoney($unitPriceCents),
        ];
    }

    // Calcular subtotales por cada línea del pedido (respetando variantes)
    $orderLines = [];
    foreach ($validatedItems as $item) {
        $pInfo = $productDetails[$item['product_id']];
        $lineSubtotalCents = $pInfo['unit_price_cents'] * $item['quantity'];
        $subtotalCents += $lineSubtotalCents;

        $orderLines[] = [
            'product_id' => $pInfo['id'],
            'product_name' => $pInfo['name'],
            'size' => $item['size'],
            'color' => $item['color'],
            'quantity' => $item['quantity'],
            'unit_price' => $pInfo['unit_price_money'],
            'subtotal' => centsToMoney($lineSubtotalCents),
        ];
    }

    $shippingCents = shippingCents($subtotalCents);
    $totalCents = $subtotalCents + $shippingCents;

    // Insertar pedido en orders con datos de envío
    $orderStatement = $db->prepare(
        'INSERT INTO orders (user_id, status, shipping_cost, total, shipping_name, shipping_address, shipping_city, shipping_postal_code, shipping_province, shipping_phone, notes) ' .
        'VALUES (:user_id, :status, :shipping_cost, :total, :shipping_name, :shipping_address, :shipping_city, :shipping_postal_code, :shipping_province, :shipping_phone, :notes)'
    );
    $orderStatement->execute([
        'user_id' => $userId,
        'status' => 'pending',
        'shipping_cost' => centsToMoney($shippingCents),
        'total' => centsToMoney($totalCents),
        'shipping_name' => $shippingName,
        'shipping_address' => $shippingAddress,
        'shipping_city' => $shippingCity,
        'shipping_postal_code' => $shippingPostalCode,
        'shipping_province' => $shippingProvince,
        'shipping_phone' => $shippingPhone,
        'notes' => $shippingNotes !== '' ? $shippingNotes : null,
    ]);
    $orderId = (int) $db->lastInsertId();

    // Insertar líneas de pedido en order_items con talla y color
    $itemStatement = $db->prepare(
        'INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price, subtotal) ' .
        'VALUES (:order_id, :product_id, :product_name, :size, :color, :quantity, :unit_price, :subtotal)'
    );

    foreach ($orderLines as $line) {
        $itemStatement->execute([
            'order_id' => $orderId,
            'product_id' => $line['product_id'],
            'product_name' => $line['product_name'],
            'size' => $line['size'],
            'color' => $line['color'],
            'quantity' => $line['quantity'],
            'unit_price' => $line['unit_price'],
            'subtotal' => $line['subtotal'],
        ]);
    }

    // Actualizar stock de cada producto involucrado
    $stockStatement = $db->prepare(
        'UPDATE products SET stock = stock - :quantity_to_subtract WHERE id = :id AND stock >= :quantity_available'
    );
    foreach ($productQuantities as $productId => $totalQty) {
        $stockStatement->execute([
            'id' => $productId,
            'quantity_to_subtract' => $totalQty,
            'quantity_available' => $totalQty,
        ]);
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
