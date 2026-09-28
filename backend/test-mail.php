<?php
declare(strict_types=1);

require_once __DIR__ . '/config/mail.php';
require_once __DIR__ . '/lib/mailer.php';

header('Content-Type: text/html; charset=utf-8');

$config = mailConfig();
$targetEmail = filter_input(INPUT_GET, 'to', FILTER_VALIDATE_EMAIL) ?: $config['admin_email'];

echo "<!DOCTYPE html><html lang='es'><head><meta charset='utf-8'><title>Prueba de correo</title>";
echo "<style>body{font-family:system-ui,-apple-system,sans-serif;max-width:680px;margin:40px auto;padding:0 20px;line-height:1.6;color:#212529} code{background:#eef1f4;padding:2px 6px;border-radius:3px;} .card{padding:16px;border-radius:6px;margin:16px 0;}</style></head><body>";
echo "<h2>Diagnóstico y Prueba de Correo (SMTP)</h2>";
echo "<p>Este asistente comprueba si las credenciales de tu archivo <code>.env</code> están listas para enviar emails reales a bandejas de entrada.</p>";

echo "<ul>";
echo "<li><strong>SMTP_ENABLED:</strong> " . ($config['smtp_enabled'] ? '<span style="color:green;font-weight:bold">true (Activado)</span>' : '<span style="color:#d9534f;font-weight:bold">false (Simulación)</span>') . "</li>";
echo "<li><strong>SMTP_HOST:</strong> " . htmlspecialchars($config['smtp_host']) . "</li>";
echo "<li><strong>SMTP_PORT:</strong> " . htmlspecialchars((string) $config['smtp_port']) . "</li>";
echo "<li><strong>SMTP_USER:</strong> " . htmlspecialchars($config['smtp_user'] !== '' ? $config['smtp_user'] : '(no configurado)') . "</li>";
echo "<li><strong>SMTP_SECURE:</strong> " . htmlspecialchars($config['smtp_secure'] !== '' ? $config['smtp_secure'] : '(ninguno)') . "</li>";
echo "<li><strong>Destinatario de prueba:</strong> " . htmlspecialchars($targetEmail) . "</li>";
echo "</ul>";

if (!$config['smtp_enabled'] || empty($config['smtp_user']) || empty($config['smtp_password'])) {
    echo "<div class='card' style='background:#fff3cd; color:#856404; border:1px solid #ffeeba;'>";
    echo "<strong>Modo Simulación Activo:</strong> Faltan credenciales SMTP en tu archivo <code>.env</code>.<br>";
    echo "Todos los correos de registro, pedidos y contacto se están guardando con su diseño completo en: <code>backend/storage/mail.log</code>.";
    echo "</div>";
    echo "<p>Para enviar a tu Gmail real, abre el archivo <code>.env</code> y configura <code>SMTP_ENABLED=true</code>, tu <code>SMTP_USER</code> y tu contraseña de aplicación de Google.</p>";
} else {
    echo "<p>Intentando conectar con <strong>" . htmlspecialchars($config['smtp_host']) . "</strong> para enviar un correo de prueba a <strong>" . htmlspecialchars($targetEmail) . "</strong>...</p>";
    try {
        $subject = "Prueba de correo SMTP - " . $config['from_name'];
        $body = emailLayout(
            $subject,
            "Prueba de configuración de correo",
            "<h2 style='margin-top:0;'>¡Enhorabuena!</h2><p>Si estás leyendo este mensaje en tu bandeja de entrada, significa que la configuración SMTP de tu tienda online está <strong>100% operativa</strong>.</p><p>A partir de ahora tus clientes recibirán los correos de bienvenida, confirmación de compra y recuperación de contraseña automáticamente.</p>"
        );
        $ok = sendEmail($targetEmail, 'Usuario de Prueba', $subject, $body);
        if ($ok) {
            echo "<div class='card' style='background:#d4edda; color:#155724; border:1px solid #c3e6cb;'>";
            echo "<strong>¡Correo enviado con éxito!</strong><br>Revisa la bandeja de entrada de <strong>" . htmlspecialchars($targetEmail) . "</strong> (y la carpeta de spam si es el primer envío).";
            echo "</div>";
        } else {
            echo "<div class='card' style='background:#f8d7da; color:#721c24; border:1px solid #f5c6cb;'>";
            echo "<strong>No se pudo enviar el correo.</strong><br>Revisa los detalles del fallo en <code>backend/storage/mail.log</code>.";
            echo "</div>";
        }
    } catch (Throwable $e) {
        echo "<div class='card' style='background:#f8d7da; color:#721c24; border:1px solid #f5c6cb;'>";
        echo "<strong>Excepción SMTP:</strong> " . htmlspecialchars($e->getMessage()) . "<br>Consulta <code>backend/storage/mail.log</code> para más detalles.";
        echo "</div>";
    }
}

echo "<hr><p style='font-size:13px;color:#6c757d;'>Puedes probar con otro destinatario añadiendo <code>?to=tu_otro_correo@gmail.com</code> a la URL.</p>";
echo "</body></html>";
