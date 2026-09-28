<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/_response.php';
require_once __DIR__ . '/_auth.php';

requirePost();
$userId = authenticatedUserId();
$payload = requestPayload();

$name = inputString($payload, 'name');
$phone = inputString($payload, 'phone');
$address = inputString($payload, 'address');
$city = inputString($payload, 'city');
$postalCode = inputString($payload, 'postal_code');
$province = inputString($payload, 'province');

if ($name === '' || mb_strlen($name) > 120) {
    apiError('Introduce un nombre válido (máx. 120 caracteres).', 422);
}
if (mb_strlen($phone) > 30) {
    apiError('El teléfono no puede superar los 30 caracteres.', 422);
}
if (mb_strlen($address) > 255) {
    apiError('La dirección no puede superar los 255 caracteres.', 422);
}
if (mb_strlen($city) > 100) {
    apiError('La ciudad no puede superar los 100 caracteres.', 422);
}
if (mb_strlen($postalCode) > 20) {
    apiError('El código postal no puede superar los 20 caracteres.', 422);
}
if (mb_strlen($province) > 100) {
    apiError('La provincia no puede superar los 100 caracteres.', 422);
}

try {
    $statement = database()->prepare(
        'UPDATE users SET name = :name, phone = :phone, address = :address, ' .
        'city = :city, postal_code = :postal_code, province = :province WHERE id = :id'
    );
    $statement->execute([
        'name' => $name,
        'phone' => $phone !== '' ? $phone : null,
        'address' => $address !== '' ? $address : null,
        'city' => $city !== '' ? $city : null,
        'postal_code' => $postalCode !== '' ? $postalCode : null,
        'province' => $province !== '' ? $province : null,
        'id' => $userId,
    ]);

    jsonResponse([
        'success' => true,
        'message' => 'Perfil actualizado correctamente.',
        'user' => [
            'id' => $userId,
            'name' => $name,
            'phone' => $phone,
            'address' => $address,
            'city' => $city,
            'postal_code' => $postalCode,
            'province' => $province,
        ],
    ]);
} catch (Throwable $exception) {
    error_log($exception->getMessage());
    apiError('No hemos podido actualizar el perfil. Inténtalo de nuevo.', 500);
}
