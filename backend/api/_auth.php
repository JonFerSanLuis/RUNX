<?php
declare(strict_types=1);

function startUserSession(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    $sessionName = 'RUNX_SESSID';
    session_name($sessionName);

    if (isset($_COOKIE[$sessionName]) && !preg_match('/^[a-zA-Z0-9,-]{16,128}$/', (string) $_COOKIE[$sessionName])) {
        unset($_COOKIE[$sessionName]);
    }

    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
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

function requireAdmin(): int
{
    $userId = authenticatedUserId();
    require_once __DIR__ . '/../config/database.php';
    $stmt = database()->prepare('SELECT is_admin FROM users WHERE id = :id LIMIT 1');
    $stmt->execute(['id' => $userId]);
    $isAdmin = (int) $stmt->fetchColumn();
    if ($isAdmin !== 1) {
        apiError('Acceso denegado: se requieren permisos de administrador.', 403);
    }

    return $userId;
}

