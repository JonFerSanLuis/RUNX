<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/stripe.php';
require_once __DIR__ . '/_response.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    apiError('Método no permitido.', 405);
}

$config = stripeConfig();

jsonResponse([
    'success' => true,
    'enabled' => $config['enabled'],
    'ready' => $config['ready'],
    'public_key' => $config['public_key'],
    'currency' => $config['currency'],
    'is_mock' => !$config['ready'],
]);
