<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/_response.php';

try {
    $statement = database()->query(
        'SELECT id, name, slug, description FROM categories ORDER BY name ASC'
    );
    jsonResponse(['data' => $statement->fetchAll()]);
} catch (Throwable $exception) {
    error_log($exception->getMessage());
    apiError('No hemos podido cargar las categorías.', 500);
}
