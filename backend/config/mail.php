<?php
declare(strict_types=1);

require_once __DIR__ . '/database.php';

loadEnvironment(dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . '.env');

function mailConfig(): array
{
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $defaultAppUrl = $protocol . '://' . $host . '/RUNX';

    $smtpEnabled = getenv('SMTP_ENABLED');
    $isEnabled = $smtpEnabled !== false
        ? filter_var($smtpEnabled, FILTER_VALIDATE_BOOLEAN)
        : (getenv('SMTP_USER') !== false && getenv('SMTP_USER') !== '');

        $rawPass = getenv('SMTP_PASSWORD') ?: '';
        $cleanPass = (strlen(str_replace(' ', '', $rawPass)) === 16) ? str_replace(' ', '', $rawPass) : $rawPass;

        return [
            'smtp_enabled' => $isEnabled,
            'smtp_host' => getenv('SMTP_HOST') ?: 'localhost',
            'smtp_port' => (int) (getenv('SMTP_PORT') ?: 587),
            'smtp_user' => getenv('SMTP_USER') ?: '',
            'smtp_password' => $cleanPass,
            'smtp_secure' => getenv('SMTP_SECURE') ?: '', // 'tls', 'ssl', or ''
        'from_address' => getenv('MAIL_FROM_ADDRESS') ?: 'no-reply@runx.test',
        'from_name' => getenv('MAIL_FROM_NAME') ?: 'BRAND NAME',
        'admin_email' => getenv('ADMIN_EMAIL') ?: 'admin@runx.test',
        'app_url' => rtrim(getenv('APP_URL') ?: $defaultAppUrl, '/'),
    ];
}
