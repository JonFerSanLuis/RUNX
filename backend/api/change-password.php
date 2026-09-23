<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/_response.php';
require_once __DIR__ . '/_auth.php';

requirePost();
$userId = authenticatedUserId();
$payload = requestPayload();
$currentPassword = is_string($payload['current_password'] ?? null) ? $payload['current_password'] : '';
$newPassword = is_string($payload['new_password'] ?? null) ? $payload['new_password'] : '';
$passwordConfirmation = is_string($payload['password_confirmation'] ?? null) ? $payload['password_confirmation'] : '';

if ($currentPassword === '') {
    apiError('Introduce tu contraseña actual.', 422);
}
if (mb_strlen($newPassword) < 8) {
    apiError('La nueva contraseña debe tener al menos 8 caracteres.', 422);
}
if (!hash_equals($newPassword, $passwordConfirmation)) {
    apiError('Las nuevas contraseñas no coinciden.', 422);
}

try {
    $db = database();
    $statement = $db->prepare('SELECT password FROM users WHERE id = :id LIMIT 1');
    $statement->execute(['id' => $userId]);
    $user = $statement->fetch();
    if (!$user || !password_verify($currentPassword, $user['password'])) {
        apiError('La contraseña actual no es correcta.', 401);
    }

    $update = $db->prepare('UPDATE users SET password = :password WHERE id = :id');
    $update->execute(['password' => password_hash($newPassword, PASSWORD_DEFAULT), 'id' => $userId]);
    jsonResponse(['success' => true, 'message' => 'Contraseña actualizada correctamente.']);
} catch (Throwable $exception) {
    error_log($exception->getMessage());
    apiError('No hemos podido actualizar la contraseña. Inténtalo de nuevo.', 500);
}
