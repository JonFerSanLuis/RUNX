<?php
declare(strict_types=1);

require_once __DIR__ . '/database.php';

loadEnvironment(dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . '.env');

function stripeConfig(): array
{
    $stripeEnabled = getenv('STRIPE_ENABLED');
    $publicKey = trim((string) (getenv('STRIPE_PUBLIC_KEY') ?: ''));
    $secretKey = trim((string) (getenv('STRIPE_SECRET_KEY') ?: ''));
    $webhookSecret = trim((string) (getenv('STRIPE_WEBHOOK_SECRET') ?: ''));
    $currency = strtolower(trim((string) (getenv('STRIPE_CURRENCY') ?: 'eur')));

    // Limpieza de comillas que el usuario pudiera haber pegado accidentalmente
    $publicKey = trim($publicKey, '"\'');
    $secretKey = trim($secretKey, '"\'');
    $webhookSecret = trim($webhookSecret, '"\'');

    $isEnabled = $stripeEnabled !== false
        ? filter_var($stripeEnabled, FILTER_VALIDATE_BOOLEAN)
        : ($publicKey !== '' && $secretKey !== '');

    // Para estar completamente operativo con Stripe real, se requieren ambas claves
    $isReady = $isEnabled && $publicKey !== '' && $secretKey !== '';

    return [
        'enabled' => $isEnabled,
        'ready' => $isReady,
        'public_key' => $publicKey !== '' ? $publicKey : null,
        'secret_key' => $secretKey !== '' ? $secretKey : null,
        'webhook_secret' => $webhookSecret !== '' ? $webhookSecret : null,
        'currency' => $currency,
    ];
}

function isStripeEnabled(): bool
{
    return stripeConfig()['ready'];
}
