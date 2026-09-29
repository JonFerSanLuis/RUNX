<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/_response.php';
require_once __DIR__ . '/_auth.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$db = database();

if ($method === 'POST') {
    $payload = requestPayload();
    $productId = filter_var($payload['product_id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    $email = mb_strtolower(inputString($payload, 'email'));

    if (!$productId) {
        apiError('Identificador de producto no válido.', 422);
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 190) {
        apiError('Por favor, introduce un correo electrónico válido.', 422);
    }

    // Verificar existencia del producto y stock
    $stmt = $db->prepare('SELECT id, name, stock FROM products WHERE id = :id LIMIT 1');
    $stmt->execute(['id' => $productId]);
    $product = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$product) {
        apiError('Producto no encontrado.', 404);
    }

    if ((int) $product['stock'] > 0) {
        jsonResponse([
            'success' => true,
            'has_stock' => true,
            'message' => '¡El producto ya dispone de unidades a la venta! Puedes comprarlo ahora.',
        ]);
    }

    // Comprobar si el usuario tiene sesión activa
    startUserSession();
    $userId = $_SESSION['user_id'] ?? null;
    $userId = (is_int($userId) || ctype_digit((string) $userId)) ? (int) $userId : null;

    // Verificar si ya existe alerta pendiente
    $checkStmt = $db->prepare('SELECT id FROM stock_alerts WHERE product_id = :pid AND email = :email AND status = "pending" LIMIT 1');
    $checkStmt->execute(['pid' => $productId, 'email' => $email]);
    if ($checkStmt->fetch()) {
        jsonResponse([
            'success' => true,
            'message' => '¡Ya estás en la lista de espera! Te avisaremos al correo facilitado en cuanto repongamos stock.',
        ]);
    }

    // Insertar alerta
    $ins = $db->prepare('INSERT INTO stock_alerts (product_id, user_id, email, status) VALUES (:pid, :uid, :email, "pending")');
    $ins->execute([
        'pid' => $productId,
        'uid' => $userId,
        'email' => $email,
    ]);

    jsonResponse([
        'success' => true,
        'message' => '¡Anotado! Te enviaremos un email automático en cuanto repongamos stock.',
    ], 201);

} elseif ($method === 'GET') {
    // Si es administrador, puede consultar cuántas personas están esperando
    startUserSession();
    $productId = filter_var($_GET['product_id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    if (!$productId) {
        apiError('Identificador de producto no válido.', 400);
    }

    $stmt = $db->prepare('SELECT COUNT(*) FROM stock_alerts WHERE product_id = :pid AND status = "pending"');
    $stmt->execute(['pid' => $productId]);
    $count = (int) $stmt->fetchColumn();

    jsonResponse([
        'success' => true,
        'product_id' => $productId,
        'waiting_count' => $count,
    ]);
} else {
    apiError('Método no permitido.', 405);
}
