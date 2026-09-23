<?php
declare(strict_types=1);

const SHIPPING_CENTS = 495;
const FREE_SHIPPING_THRESHOLD_CENTS = 5000;

final class OrderValidationException extends RuntimeException
{
}

function moneyToCents(string $amount): int
{
    if (!preg_match('/^(\d+)(?:\.(\d{1,2}))?$/', $amount, $matches)) {
        throw new OrderValidationException('Importe de producto no válido.');
    }

    return ((int) $matches[1] * 100) + (int) str_pad($matches[2] ?? '', 2, '0');
}

function centsToMoney(int $cents): string
{
    return number_format($cents / 100, 2, '.', '');
}

function shippingCents(int $subtotalCents): int
{
    return $subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : SHIPPING_CENTS;
}

function orderStatusLabel(string $status): string
{
    return [
        'pending' => 'Pendiente',
        'confirmed' => 'Confirmado',
        'shipped' => 'Enviado',
        'delivered' => 'Entregado',
        'cancelled' => 'Cancelado',
    ][$status] ?? $status;
}
