<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/_response.php';
require_once __DIR__ . '/_auth.php';

requirePost();
$payload = requestPayload();

$token = inputString($payload, 'token');
$email = mb_strtolower(inputString($payload, 'email'));
$password = is_string($payload['password'] ?? null) ? $payload['password'] : '';
$passwordConfirmation = is_string($payload['password_confirmation'] ?? null) ? $payload['password_confirmation'] : '';

if (!preg_match('/^[a-f0-9]{64}$/i', $token)) {
    apiError('El token de restablecimiento no es válido.', 422);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    apiError('El correo electrónico no es válido.', 422);
}
if (mb_strlen($password) < 8) {
    apiError('La nueva contraseña debe tener al menos 8 caracteres.', 422);
}
if (!hash_equals($password, $passwordConfirmation)) {
    apiError('Las contraseñas no coinciden.', 422);
}

try {
    $db = database();
    $statement = $db->prepare(
        'SELECT id, expires_at FROM password_resets WHERE token = :token AND email = :email LIMIT 1'
    );
    $statement->execute(['token' => $token, 'email' => $email]);
    $reset = $statement->fetch();

    if (!$reset) {
        apiError('El enlace no es válido o ya ha sido utilizado.', 422);
    }

    if (strtotime($reset['expires_at']) < time()) {
        $cleanup = $db->prepare('DELETE FROM password_resets WHERE id = :id');
        $cleanup->execute(['id' => $reset['id']]);
        apiError('El enlace de recuperación ha caducado. Por favor, solicita uno nuevo.', 422);
    }

    // Actualizar contraseña del usuario
    $updateStatement = $db->prepare('UPDATE users SET password = :password WHERE email = :email');
    $updateStatement->execute([
        'password' => password_hash($password, PASSWORD_DEFAULT),
        'email' => $email,
    ]);

    // Eliminar todos los tokens pendientes de este email
    $deleteStatement = $db->prepare('DELETE FROM password_resets WHERE email = :email');
    $deleteStatement->execute(['email' => $email]);

    jsonResponse([
        'success' => true,
        'message' => 'Tu contraseña se ha restablecido correctamente. Ya puedes iniciar sesión.',
    ]);
} catch (Throwable $exception) {
    error_log('Error en reset-password.php: ' . $exception->getMessage());
    apiError('No hemos podido actualizar la contraseña. Inténtalo de nuevo.', 500);
}
