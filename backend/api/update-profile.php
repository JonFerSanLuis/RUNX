<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/_response.php';
require_once __DIR__ . '/_auth.php';

requirePost();
$userId = authenticatedUserId();
$name = inputString(requestPayload(), 'name');

if ($name === '' || mb_strlen($name) > 120) {
    apiError('Introduce un nombre válido.', 422);
}

try {
    $statement = database()->prepare('UPDATE users SET name = :name WHERE id = :id');
    $statement->execute(['name' => $name, 'id' => $userId]);
    jsonResponse(['success' => true, 'message' => 'Perfil actualizado correctamente.', 'user' => ['id' => $userId, 'name' => $name]]);
} catch (Throwable $exception) {
    error_log($exception->getMessage());
    apiError('No hemos podido actualizar el perfil. Inténtalo de nuevo.', 500);
}
