<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/_response.php';
require_once __DIR__ . '/_auth.php';

requirePost();
$payload = requestPayload();
$email = mb_strtolower(inputString($payload, 'email'));
$password = is_string($payload['password'] ?? null) ? $payload['password'] : '';

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $password === '') {
    apiError('Email o contraseña no válidos.', 422);
}

try {
    $statement = database()->prepare('SELECT id, password FROM users WHERE email = :email LIMIT 1');
    $statement->execute(['email' => $email]);
    $user = $statement->fetch();
    if (!$user || !password_verify($password, $user['password'])) {
        apiError('El email o la contraseña no son correctos.', 401);
    }

    startUserSession();
    session_regenerate_id(true);
    $_SESSION['user_id'] = (int) $user['id'];
    jsonResponse(['success' => true, 'message' => 'Sesión iniciada correctamente.']);
} catch (Throwable $exception) {
    error_log($exception->getMessage());
    apiError('No hemos podido iniciar sesión. Inténtalo de nuevo.', 500);
}
