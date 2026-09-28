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
$shipping = $payload['shipping'] ?? null;
$paymentIntentId = isset($payload['payment_intent_id']) && is_string($payload['payment_intent_id']) ? trim($payload['payment_intent_id']) : null;
$paymentMethod = isset($payload['payment_method']) && is_string($payload['payment_method']) ? trim($payload['payment_method']) : 'card';

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

    // Validación y verificación del estado del pago
    $stripeCfg = stripeConfig();
    $paymentStatus = 'unpaid';
    $orderStatus = 'pending';

    if ($stripeCfg['ready']) {
        if (empty($paymentIntentId)) {
            throw new OrderValidationException('Se requiere la confirmación del pago con tarjeta antes de crear el pedido.');
        }

        require_once __DIR__ . '/../lib/StripeClient.php';
        $stripeClient = new StripeClient($stripeCfg['secret_key']);
        $intent = $stripeClient->getPaymentIntent($paymentIntentId);

        $intentStatus = $intent['status'] ?? '';
        if (!in_array($intentStatus, ['succeeded', 'processing'], true)) {
            throw new OrderValidationException('El pago con tarjeta no se ha completado en Stripe (estado: ' . $intentStatus . ').');
        }

        $paidAmount = (int) ($intent['amount'] ?? 0);
        if ($paidAmount !== $totalCents) {
            throw new OrderValidationException('El importe del cobro (' . centsToMoney($paidAmount) . ' €) no coincide con el total del pedido (' . centsToMoney($totalCents) . ' €).');
        }

        $paymentStatus = 'paid';
        $orderStatus = 'confirmed';
        $paymentMethod = 'card';
    } else {
        // En modo de simulación (sin claves de Stripe en .env)
        $paymentStatus = 'paid';
        $orderStatus = 'confirmed';
        $paymentMethod = 'card_mock';
        if (empty($paymentIntentId)) {
            $paymentIntentId = 'mock_pi_' . bin2hex(random_bytes(10));
        }
    }

    // Insertar pedido en orders con datos de envío y pago
    $orderStatement = $db->prepare(
        'INSERT INTO orders (user_id, status, payment_method, payment_status, payment_intent_id, shipping_cost, total, shipping_name, shipping_address, shipping_city, shipping_postal_code, shipping_province, shipping_phone, notes) ' .
        'VALUES (:user_id, :status, :payment_method, :payment_status, :payment_intent_id, :shipping_cost, :total, :shipping_name, :shipping_address, :shipping_city, :shipping_postal_code, :shipping_province, :shipping_phone, :notes)'
    );
    $orderStatement->execute([
        'user_id' => $userId,
        'status' => $orderStatus,
        'payment_method' => $paymentMethod,
        'payment_status' => $paymentStatus,
        'payment_intent_id' => $paymentIntentId,
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

    // Si el usuario registrado aún no tiene datos de entrega en su perfil, guardarlos automáticamente
    if ($userId !== null) {
        $updateUser = $db->prepare(
            'UPDATE users SET ' .
            'phone = CASE WHEN (phone IS NULL OR phone = "") AND :phone_check != "" THEN :phone_val ELSE phone END, ' .
            'address = CASE WHEN (address IS NULL OR address = "") AND :address_check != "" THEN :address_val ELSE address END, ' .
            'city = CASE WHEN (city IS NULL OR city = "") AND :city_check != "" THEN :city_val ELSE city END, ' .
            'postal_code = CASE WHEN (postal_code IS NULL OR postal_code = "") AND :postal_code_check != "" THEN :postal_code_val ELSE postal_code END, ' .
            'province = CASE WHEN (province IS NULL OR province = "") AND :province_check != "" THEN :province_val ELSE province END ' .
            'WHERE id = :user_id'
        );
        $updateUser->execute([
            'phone_check' => $shippingPhone,
            'phone_val' => $shippingPhone !== '' ? $shippingPhone : null,
            'address_check' => $shippingAddress,
            'address_val' => $shippingAddress !== '' ? $shippingAddress : null,
            'city_check' => $shippingCity,
            'city_val' => $shippingCity !== '' ? $shippingCity : null,
            'postal_code_check' => $shippingPostalCode,
            'postal_code_val' => $shippingPostalCode !== '' ? $shippingPostalCode : null,
            'province_check' => $shippingProvince,
            'province_val' => $shippingProvince !== '' ? $shippingProvince : null,
            'user_id' => $userId,
        ]);
    }

    $db->commit();

    // Notificaciones por correo electrónico (cliente y administrador)
    try {
        require_once __DIR__ . '/../lib/mailer.php';
        $userStmt = $db->prepare('SELECT name, email FROM users WHERE id = :id LIMIT 1');
        $userStmt->execute(['id' => $userId]);
        $userData = $userStmt->fetch();
        $customerEmail = $userData ? (string) $userData['email'] : '';
        $customerName = !empty($shippingName) ? $shippingName : ($userData ? (string) $userData['name'] : 'Cliente');

        $orderSummary = [
            'id' => $orderId,
            'subtotal' => centsToMoney($subtotalCents),
            'shipping_cost' => centsToMoney($shippingCents),
            'total' => centsToMoney($totalCents),
            'shipping_name' => $shippingName,
            'shipping_address' => $shippingAddress,
            'shipping_city' => $shippingCity,
            'shipping_postal_code' => $shippingPostalCode,
            'shipping_province' => $shippingProvince,
            'shipping_phone' => $shippingPhone,
            'notes' => $shippingNotes,
            'payment_method' => $paymentMethod,
            'payment_status' => $paymentStatus,
            'payment_intent_id' => $paymentIntentId,
        ];

        if ($customerEmail !== '') {
            sendOrderConfirmationEmail($orderSummary, $orderLines, $customerEmail, $customerName);
        }
        sendAdminNewOrderNotification($orderSummary, $orderLines, $customerEmail, $customerName);
    } catch (Throwable $mailException) {
        error_log('Error enviando notificaciones de pedido #' . $orderId . ': ' . $mailException->getMessage());
    }

    jsonResponse([
        'success' => true,
        'order_id' => $orderId,
        'payment_status' => $paymentStatus,
        'status' => $orderStatus,
        'message' => 'Pedido pagado y confirmado correctamente.',
    ]);
} catch (Throwable $exception) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    error_log($exception->getMessage());
    $message = $exception instanceof OrderValidationException ? $exception->getMessage() : 'No hemos podido crear el pedido. Inténtalo de nuevo.';
    apiError($message, $exception instanceof OrderValidationException ? 422 : 500);
}
