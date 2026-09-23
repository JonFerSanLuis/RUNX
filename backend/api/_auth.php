<?php
declare(strict_types=1);

function startUserSession(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    $applicationPath = dirname(dirname(dirname($_SERVER['SCRIPT_NAME'] ?? '/')));
    $applicationPath = $applicationPath === '/' || $applicationPath === '\\' ? '/' : rtrim($applicationPath, '/') . '/';
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => $applicationPath,
        'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

function requirePost(): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
        apiError('Método no permitido.', 405);
    }
}

function requestPayload(): array
{
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    if (str_contains($contentType, 'application/json')) {
        $payload = json_decode((string) file_get_contents('php://input'), true);
        if (!is_array($payload)) {
            apiError('El cuerpo de la petición no es válido.', 400);
        }
        return $payload;
    }

    return $_POST;
}

function inputString(array $payload, string $key): string
{
    return is_string($payload[$key] ?? null) ? trim($payload[$key]) : '';
}

function authenticatedUserId(): int
{
    startUserSession();
    $userId = $_SESSION['user_id'] ?? null;
    if (!is_int($userId) && !ctype_digit((string) $userId)) {
        apiError('Debes iniciar sesión para realizar esta acción.', 401);
    }

    return (int) $userId;
}
