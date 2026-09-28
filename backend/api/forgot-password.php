<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/_response.php';
require_once __DIR__ . '/_auth.php';
require_once __DIR__ . '/../lib/mailer.php';

requirePost();
$payload = requestPayload();
$email = mb_strtolower(inputString($payload, 'email'));

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 190) {
    apiError('Introduce un correo electrónico válido.', 422);
}

try {
    $db = database();
    $userStatement = $db->prepare('SELECT id, name, email FROM users WHERE email = :email LIMIT 1');
    $userStatement->execute(['email' => $email]);
    $user = $userStatement->fetch();

    if ($user) {
        $token = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', time() + 3600); // 1 hora de validez

        // Eliminar tokens previos para este correo
        $deleteStatement = $db->prepare('DELETE FROM password_resets WHERE email = :email');
        $deleteStatement->execute(['email' => $email]);

        // Registrar el nuevo token
        $insertStatement = $db->prepare(
            'INSERT INTO password_resets (email, token, expires_at) VALUES (:email, :token, :expires_at)'
        );
        $insertStatement->execute([
            'email' => $email,
            'token' => $token,
            'expires_at' => $expiresAt,
        ]);

        // Enviar el correo con el enlace
        try {
            sendPasswordResetEmail($user['email'], $user['name'], $token);
        } catch (Throwable $mailException) {
            error_log('Error enviando email restablecimiento: ' . $mailException->getMessage());
        }
    }

    // Respuesta genérica por seguridad (evita enumeración de usuarios)
    jsonResponse([
        'success' => true,
        'message' => 'Si tu correo electrónico está registrado, recibirás un enlace de restablecimiento en tu bandeja de entrada en unos instantes.',
    ]);
} catch (Throwable $exception) {
    error_log('Error en forgot-password.php: ' . $exception->getMessage());
    apiError('No hemos podido procesar la solicitud. Por favor, inténtalo de nuevo.', 500);
}
