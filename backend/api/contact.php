<?php
declare(strict_types=1);

require_once __DIR__ . '/_response.php';
require_once __DIR__ . '/_auth.php';
require_once __DIR__ . '/../lib/mailer.php';

requirePost();
$payload = requestPayload();

$name = inputString($payload, 'name');
$email = mb_strtolower(inputString($payload, 'email'));
$subject = inputString($payload, 'subject');
$message = inputString($payload, 'message');

if ($name === '' || mb_strlen($name) > 120) {
    apiError('Por favor, indica tu nombre (máx. 120 caracteres).', 422);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 190) {
    apiError('Por favor, indica un correo electrónico válido.', 422);
}
if ($subject === '' || mb_strlen($subject) > 150) {
    apiError('Por favor, indica el asunto de tu consulta (máx. 150 caracteres).', 422);
}
if ($message === '' || mb_strlen($message) < 10 || mb_strlen($message) > 3000) {
    apiError('Por favor, introduce tu mensaje (entre 10 y 3000 caracteres).', 422);
}

try {
    $sent = sendContactNotification($name, $email, $subject, $message);
    if (!$sent) {
        error_log("Aviso: sendContactNotification devolvió false para {$email}");
    }

    jsonResponse([
        'success' => true,
        'message' => '¡Gracias por tu mensaje! Hemos recibido tu consulta y nos pondremos en contacto contigo lo antes posible.',
    ]);
} catch (Throwable $exception) {
    error_log('Error en contact.php: ' . $exception->getMessage());
    apiError('No hemos podido enviar tu mensaje en este momento. Por favor, inténtalo de nuevo más tarde.', 500);
}
