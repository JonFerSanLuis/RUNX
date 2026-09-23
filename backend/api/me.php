<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/_response.php';
require_once __DIR__ . '/_auth.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    apiError('Método no permitido.', 405);
}

startUserSession();
$userId = $_SESSION['user_id'] ?? null;
if (!is_int($userId) && !ctype_digit((string) $userId)) {
    jsonResponse(['authenticated' => false]);
}

try {
    $statement = database()->prepare('SELECT id, name, email FROM users WHERE id = :id LIMIT 1');
    $statement->execute(['id' => (int) $userId]);
    $user = $statement->fetch();
    if (!$user) {
        $_SESSION = [];
        session_destroy();
        jsonResponse(['authenticated' => false]);
    }
    jsonResponse(['authenticated' => true, 'user' => ['id' => (int) $user['id'], 'name' => $user['name'], 'email' => $user['email']]]);
} catch (Throwable $exception) {
    error_log($exception->getMessage());
    apiError('No hemos podido comprobar la sesión. Inténtalo de nuevo.', 500);
}
