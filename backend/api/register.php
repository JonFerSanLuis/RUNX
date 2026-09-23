<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/_response.php';
require_once __DIR__ . '/_auth.php';

requirePost();
$payload = requestPayload();
$name = inputString($payload, 'name');
$email = mb_strtolower(inputString($payload, 'email'));
$password = is_string($payload['password'] ?? null) ? $payload['password'] : '';
$passwordConfirmation = is_string($payload['password_confirmation'] ?? null) ? $payload['password_confirmation'] : '';

if ($name === '' || mb_strlen($name) > 120) {
    apiError('Introduce un nombre válido.', 422);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 190) {
    apiError('Introduce un email válido.', 422);
}
if (mb_strlen($password) < 8) {
    apiError('La contraseña debe tener al menos 8 caracteres.', 422);
}
if (!hash_equals($password, $passwordConfirmation)) {
    apiError('Las contraseñas no coinciden.', 422);
}

try {
    $db = database();
    $exists = $db->prepare('SELECT id FROM users WHERE email = :email LIMIT 1');
    $exists->execute(['email' => $email]);
    if ($exists->fetch()) {
        apiError('El email ya está registrado.', 409);
    }

    $statement = $db->prepare('INSERT INTO users (name, email, password) VALUES (:name, :email, :password)');
    $statement->execute([
        'name' => $name,
        'email' => $email,
        'password' => password_hash($password, PASSWORD_DEFAULT),
    ]);
    jsonResponse(['success' => true, 'message' => 'Usuario registrado correctamente. Ya puedes iniciar sesión.'], 201);
} catch (PDOException $exception) {
    if ($exception->getCode() === '23000') {
        apiError('El email ya está registrado.', 409);
    }
    error_log($exception->getMessage());
    apiError('No hemos podido registrar el usuario. Inténtalo de nuevo.', 500);
} catch (Throwable $exception) {
    error_log($exception->getMessage());
    apiError('No hemos podido registrar el usuario. Inténtalo de nuevo.', 500);
}
