<?php
declare(strict_types=1);

require_once __DIR__ . '/_response.php';
require_once __DIR__ . '/_auth.php';

requirePost();
startUserSession();
$_SESSION = [];
if (ini_get('session.use_cookies')) {
    $parameters = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000, $parameters['path'], $parameters['domain'], $parameters['secure'], $parameters['httponly']);
}
session_destroy();
jsonResponse(['success' => true, 'message' => 'Sesión cerrada correctamente.']);
