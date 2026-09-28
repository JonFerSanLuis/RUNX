<?php
declare(strict_types=1);

require_once __DIR__ . '/PHPMailer/Exception.php';
require_once __DIR__ . '/PHPMailer/PHPMailer.php';
require_once __DIR__ . '/PHPMailer/SMTP.php';
require_once __DIR__ . '/../config/mail.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

/**
 * Registra un correo en el log local de almacenamiento para depuración y trazabilidad.
 */
function logEmail(string $toEmail, string $toName, string $subject, string $htmlContent, string $status = 'LOGGED'): void
{
    $storageDir = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'storage';
    if (!is_dir($storageDir)) {
        @mkdir($storageDir, 0755, true);
    }
    $logFile = $storageDir . DIRECTORY_SEPARATOR . 'mail.log';
    $entry = sprintf(
        "[%s] [%s] TO: %s <%s> | SUBJECT: %s\nBODY:\n%s\n%s\n\n",
        date('Y-m-d H:i:s'),
        $status,
        $toName,
        $toEmail,
        $subject,
        strip_tags(str_replace(['<br>', '<br/>', '</p>', '</tr>', '</div>'], "\n", $htmlContent)),
        str_repeat('-', 70)
    );
    @file_put_contents($logFile, $entry, FILE_APPEND | LOCK_EX);
}

/**
 * Envío de correo electrónico vía PHPMailer (con soporte SMTP y fallback a log local).
 */
function sendEmail(string $toEmail, string $toName, string $subject, string $htmlContent, string $textContent = ''): bool
{
    $config = mailConfig();

    $mail = new PHPMailer(true);
    try {
        $mail->CharSet = 'UTF-8';
        $mail->setFrom($config['from_address'], $config['from_name']);
        $mail->addAddress($toEmail, $toName);
        $mail->Subject = $subject;
        $mail->isHTML(true);
        $mail->Body = $htmlContent;
        $mail->AltBody = $textContent !== ''
            ? $textContent
            : strip_tags(str_replace(['<br>', '<br/>', '</p>', '</tr>', '</div>'], "\n", $htmlContent));

        if ($config['smtp_enabled'] && !empty($config['smtp_host'])) {
            $mail->isSMTP();
            $mail->Host = $config['smtp_host'];
            $mail->Port = $config['smtp_port'];
            $mail->SMTPAutoTLS = true;

            if (!empty($config['smtp_user'])) {
                $mail->SMTPAuth = true;
                $mail->Username = $config['smtp_user'];
                $mail->Password = $config['smtp_password'];
            }

            if ($config['smtp_secure'] === 'tls') {
                $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            } elseif ($config['smtp_secure'] === 'ssl') {
                $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
            }

            $mail->send();
            logEmail($toEmail, $toName, $subject, $htmlContent, 'SENT_SMTP');
            return true;
        }

        // Si SMTP no está habilitado, simulamos el envío de forma segura registrándolo en el log
        logEmail($toEmail, $toName, $subject, $htmlContent, 'SIMULATED_LOCAL');
        return true;
    } catch (Throwable $exception) {
        error_log("Error enviando email a {$toEmail} con asunto '{$subject}': " . $exception->getMessage());
        logEmail($toEmail, $toName, $subject, $htmlContent, 'FAILED: ' . $exception->getMessage());
        // En entorno de desarrollo no rompemos la experiencia del usuario si falla el servidor de correo
        return false;
    }
}

/**
 * Plantilla base HTML para correos transaccionales.
 */
function emailLayout(string $title, string $headerSubtitle, string $bodyContent): string
{
    $config = mailConfig();
    $year = date('Y');
    $brandName = htmlspecialchars($config['from_name'], ENT_QUOTES, 'UTF-8');
    $appUrl = htmlspecialchars($config['app_url'], ENT_QUOTES, 'UTF-8');

    return <<<HTML
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{$title}</title>
  <style>
    body { margin:0; padding:0; background-color:#f5f6f8; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#1a1d20; line-height:1.6; }
    .wrapper { width:100%; max-width:600px; margin:0 auto; background:#ffffff; border-radius:6px; overflow:hidden; margin-top:24px; margin-bottom:24px; box-shadow:0 2px 8px rgba(0,0,0,0.06); }
    .header { background:#121518; padding:28px 32px; color:#ffffff; }
    .brand-mark { display:inline-block; width:22px; height:22px; background:#ffffff; color:#121518; text-align:center; font-weight:800; font-size:12px; line-height:22px; margin-right:8px; }
    .header h1 { margin:0; font-size:18px; font-weight:800; letter-spacing:-0.02em; }
    .header p { margin:6px 0 0 0; color:#b0b7c0; font-size:13px; }
    .body { padding:32px; }
    .footer { background:#fafbfc; padding:24px 32px; text-align:center; font-size:12px; color:#78828d; border-top:1px solid #ebeef2; }
    .footer a { color:#235ee7; text-decoration:none; }
    .btn { display:inline-block; padding:12px 24px; background:#235ee7; color:#ffffff !important; text-decoration:none; border-radius:4px; font-weight:700; font-size:14px; margin:20px 0; text-align:center; }
    .btn:hover { background:#1848ba; }
    .order-table { width:100%; border-collapse:collapse; margin:20px 0; font-size:14px; }
    .order-table th { text-align:left; padding:10px 8px; border-bottom:2px solid #e6e8ea; font-size:12px; text-transform:uppercase; color:#697078; letter-spacing:0.05em; }
    .order-table td { padding:12px 8px; border-bottom:1px solid #e6e8ea; vertical-align:top; }
    .order-totals { margin-top:16px; margin-left:auto; width:260px; font-size:14px; }
    .order-totals div { display:flex; justify-content:space-between; padding:4px 0; }
    .order-totals .total { font-weight:800; font-size:16px; border-top:2px solid #1a1d20; padding-top:8px; margin-top:4px; }
    .badge { display:inline-block; padding:3px 8px; font-size:11px; font-weight:700; background:#f0f2f5; border-radius:3px; color:#495057; }
    .info-card { background:#f8f9fa; border:1px solid #e9ecef; border-radius:4px; padding:16px; margin:20px 0; font-size:13px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div style="display:flex; align-items:center;">
        <span class="brand-mark">B</span>
        <span style="font-weight:800; font-size:16px; letter-spacing:-0.04em;">{$brandName}</span>
      </div>
      <p>{$headerSubtitle}</p>
    </div>
    <div class="body">
      {$bodyContent}
    </div>
    <div class="footer">
      <p style="margin:0 0 6px 0;">&copy; {$year} {$brandName}. Equipamiento técnico de running.</p>
      <p style="margin:0;"><a href="{$appUrl}/tienda.html">Tienda</a> &middot; <a href="{$appUrl}/cuenta.html">Mi cuenta</a> &middot; <a href="{$appUrl}/contacto.html">Contacto</a></p>
    </div>
  </div>
</body>
</html>
HTML;
}

/**
 * Envía email de bienvenida tras registrarse.
 */
function sendWelcomeEmail(string $userEmail, string $userName): bool
{
    $config = mailConfig();
    $name = htmlspecialchars($userName, ENT_QUOTES, 'UTF-8');
    $appUrl = $config['app_url'];

    $content = <<<HTML
<h2 style="margin-top:0; font-size:20px; font-weight:800;">¡Hola, {$name}! Te damos la bienvenida.</h2>
<p>Tu cuenta se ha creado correctamente. Ya puedes acceder para realizar pedidos, seguir tus envíos y guardar tus direcciones habituales de entrega.</p>

<div class="info-card">
  <strong style="display:block; margin-bottom:6px;">Ventajas de tu cuenta:</strong>
  <ul style="margin:0; padding-left:20px; color:#495057;">
    <li>Proceso de compra más rápido con dirección autocompletada.</li>
    <li>Historial completo y seguimiento de tus pedidos.</li>
    <li>Acceso prioritario a novedades técnicas en material y calcetines de running.</li>
  </ul>
</div>

<p style="text-align:center;">
  <a href="{$appUrl}/tienda.html" class="btn">Explorar la tienda</a>
</p>

<p style="font-size:13px; color:#697078; margin-top:28px;">Si tienes cualquier duda con tu equipamiento o tu pedido, puedes responder directamente a este correo o escribirnos a través del formulario de contacto.</p>
HTML;

    $subject = "¡Bienvenido/a a {$config['from_name']}!";
    $html = emailLayout($subject, 'Tu cuenta está lista para rodar', $content);
    return sendEmail($userEmail, $userName, $subject, $html);
}

/**
 * Envía email con token de restablecimiento de contraseña.
 */
function sendPasswordResetEmail(string $userEmail, string $userName, string $token): bool
{
    $config = mailConfig();
    $name = htmlspecialchars($userName, ENT_QUOTES, 'UTF-8');
    $resetLink = $config['app_url'] . '/restablecer-password.html?token=' . urlencode($token) . '&email=' . urlencode($userEmail);

    $content = <<<HTML
<h2 style="margin-top:0; font-size:20px; font-weight:800;">Recuperación de contraseña</h2>
<p>Hola, {$name}. Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.</p>
<p>Haz clic en el siguiente botón para elegir una nueva contraseña:</p>

<p style="text-align:center;">
  <a href="{$resetLink}" class="btn">Restablecer mi contraseña</a>
</p>

<div class="info-card">
  <p style="margin:0;"><strong>Importante:</strong> Este enlace caducará en <strong>1 hora</strong> por motivos de seguridad.</p>
  <p style="margin:8px 0 0 0; font-size:12px; color:#6c757d; word-break:break-all;">Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:<br><a href="{$resetLink}">{$resetLink}</a></p>
</div>

<p style="font-size:13px; color:#697078; margin-top:24px;">Si tú no has solicitado este cambio, puedes ignorar este mensaje; tu contraseña actual continuará siendo segura.</p>
HTML;

    $subject = "Restablece tu contraseña - {$config['from_name']}";
    $html = emailLayout($subject, 'Solicitud de restablecimiento de acceso', $content);
    return sendEmail($userEmail, $userName, $subject, $html);
}

/**
 * Envía email de confirmación de pedido al cliente.
 */
function sendOrderConfirmationEmail(array $order, array $items, string $customerEmail, string $customerName): bool
{
    $config = mailConfig();
    $orderId = (int) $order['id'];
    $orderUrl = $config['app_url'] . '/pedido.html?id=' . $orderId;
    $name = htmlspecialchars($customerName, ENT_QUOTES, 'UTF-8');

    $itemsHtml = '';
    foreach ($items as $item) {
        $pName = htmlspecialchars((string) $item['product_name'], ENT_QUOTES, 'UTF-8');
        $size = !empty($item['size']) ? htmlspecialchars((string) $item['size'], ENT_QUOTES, 'UTF-8') : null;
        $color = !empty($item['color']) ? htmlspecialchars((string) $item['color'], ENT_QUOTES, 'UTF-8') : null;
        $qty = (int) $item['quantity'];
        $unitPrice = htmlspecialchars((string) $item['unit_price'], ENT_QUOTES, 'UTF-8');
        $subtotal = htmlspecialchars((string) $item['subtotal'], ENT_QUOTES, 'UTF-8');

        $variant = implode(' &middot; ', array_filter([$color, $size]));

        $itemsHtml .= "<tr>
          <td>
            <strong>{$pName}</strong>" . ($variant ? "<div style='font-size:12px; color:#697078;'>{$variant}</div>" : '') . "
          </td>
          <td style='text-align:center;'>{$qty}</td>
          <td style='text-align:right;'>{$unitPrice} €</td>
          <td style='text-align:right;'><strong>{$subtotal} €</strong></td>
        </tr>";
    }

    $shippingCost = (float) $order['shipping_cost'];
    $shippingLabel = $shippingCost > 0 ? number_format($shippingCost, 2, ',', '.') . ' €' : 'Gratis';
    $totalLabel = number_format((float) $order['total'], 2, ',', '.') . ' €';

    $shippingAddress = htmlspecialchars((string) ($order['shipping_address'] ?? ''), ENT_QUOTES, 'UTF-8');
    $shippingCity = htmlspecialchars((string) ($order['shipping_city'] ?? ''), ENT_QUOTES, 'UTF-8');
    $shippingPostal = htmlspecialchars((string) ($order['shipping_postal_code'] ?? ''), ENT_QUOTES, 'UTF-8');
    $shippingProvince = htmlspecialchars((string) ($order['shipping_province'] ?? ''), ENT_QUOTES, 'UTF-8');
    $shippingPhone = htmlspecialchars((string) ($order['shipping_phone'] ?? ''), ENT_QUOTES, 'UTF-8');
    $shippingNotes = !empty($order['notes']) ? htmlspecialchars((string) $order['notes'], ENT_QUOTES, 'UTF-8') : null;
    $notesBlock = $shippingNotes ? "<div style='margin-top:6px; font-style:italic;'>Nota: {$shippingNotes}</div>" : '';

    $content = <<<HTML
<h2 style="margin-top:0; font-size:20px; font-weight:800;">¡Gracias por tu compra, {$name}!</h2>
<p>Hemos recibido tu pedido correctamente y lo estamos preparando. Aquí tienes el resumen completo:</p>

<table class="order-table">
  <thead>
    <tr>
      <th>Producto</th>
      <th style="text-align:center;">Cant.</th>
      <th style="text-align:right;">Precio</th>
      <th style="text-align:right;">Subtotal</th>
    </tr>
  </thead>
  <tbody>
    {$itemsHtml}
  </tbody>
</table>

<table style="width:100%; margin-top:16px;">
  <tr>
    <td style="width:50%; vertical-align:top; font-size:13px;">
      <div class="info-card" style="margin:0;">
        <strong style="display:block; margin-bottom:6px; color:#1a1d20;">Dirección de envío:</strong>
        <div>{$name}</div>
        <div>{$shippingAddress}</div>
        <div>{$shippingPostal} {$shippingCity} ({$shippingProvince})</div>
        <div>Tel: {$shippingPhone}</div>
        {$notesBlock}
      </div>
    </td>
    <td style="width:50%; vertical-align:top; text-align:right; font-size:14px; padding-left:16px;">
      <div style="margin-bottom:6px;">Subtotal: <strong>{$order['subtotal']} €</strong></div>
      <div style="margin-bottom:6px;">Envío: <strong>{$shippingLabel}</strong></div>
      <div style="font-size:18px; font-weight:800; border-top:2px solid #1a1d20; padding-top:8px; margin-top:8px;">
        Total: {$totalLabel}
      </div>
    </td>
  </tr>
</table>

<p style="text-align:center; margin-top:32px;">
  <a href="{$orderUrl}" class="btn">Ver estado de mi pedido</a>
</p>
HTML;

    $subject = "Confirmación de tu pedido #{$orderId} - {$config['from_name']}";
    $html = emailLayout($subject, "Pedido #{$orderId} confirmado", $content);
    return sendEmail($customerEmail, $customerName, $subject, $html);
}

/**
 * Notificación al administrador sobre un nuevo pedido entrante.
 */
function sendAdminNewOrderNotification(array $order, array $items, string $customerEmail, string $customerName): bool
{
    $config = mailConfig();
    $adminEmail = $config['admin_email'];
    $orderId = (int) $order['id'];
    $totalLabel = number_format((float) $order['total'], 2, ',', '.') . ' €';
    $name = htmlspecialchars($customerName, ENT_QUOTES, 'UTF-8');
    $email = htmlspecialchars($customerEmail, ENT_QUOTES, 'UTF-8');
    $phone = htmlspecialchars((string) ($order['shipping_phone'] ?? ''), ENT_QUOTES, 'UTF-8');
    $address = htmlspecialchars((string) ($order['shipping_address'] ?? ''), ENT_QUOTES, 'UTF-8');
    $city = htmlspecialchars((string) ($order['shipping_city'] ?? ''), ENT_QUOTES, 'UTF-8');

    $itemsList = '';
    foreach ($items as $item) {
        $pName = htmlspecialchars((string) $item['product_name'], ENT_QUOTES, 'UTF-8');
        $variant = implode(' - ', array_filter([$item['color'] ?? '', $item['size'] ?? '']));
        $qty = (int) $item['quantity'];
        $itemsList .= "<li><strong>{$qty}x</strong> {$pName}" . ($variant ? " ({$variant})" : '') . "</li>";
    }

    $content = <<<HTML
<h2 style="margin-top:0; font-size:20px; font-weight:800; color:#1848ba;">🔔 Nuevo pedido recibido #{$orderId}</h2>
<p>Se ha registrado una nueva compra en la tienda.</p>

<div class="info-card">
  <p style="margin:0 0 6px 0;"><strong>Cliente:</strong> {$name} (&lt;{$email}&gt;)</p>
  <p style="margin:0 0 6px 0;"><strong>Teléfono:</strong> {$phone}</p>
  <p style="margin:0 0 6px 0;"><strong>Destino:</strong> {$address}, {$city}</p>
  <p style="margin:0;"><strong>Importe total:</strong> <span style="font-size:16px; font-weight:800; color:#121518;">{$totalLabel}</span></p>
</div>

<h3 style="font-size:15px; margin:20px 0 10px 0;">Productos solicitados:</h3>
<ul style="margin:0; padding-left:20px;">
  {$itemsList}
</ul>

<p style="font-size:13px; color:#697078; margin-top:24px;">Revisa el panel de administración o la base de datos para preparar el paquete.</p>
HTML;

    $subject = "🔔 [ADMIN] Nuevo pedido #{$orderId} recibido - {$totalLabel}";
    $html = emailLayout($subject, "Aviso de venta en tienda", $content);
    return sendEmail($adminEmail, 'Administrador', $subject, $html);
}

/**
 * Notificación al administrador de un mensaje enviado desde el formulario de contacto.
 */
function sendContactNotification(string $senderName, string $senderEmail, string $subjectText, string $messageText): bool
{
    $config = mailConfig();
    $adminEmail = $config['admin_email'];
    $name = htmlspecialchars($senderName, ENT_QUOTES, 'UTF-8');
    $email = htmlspecialchars($senderEmail, ENT_QUOTES, 'UTF-8');
    $subjectClean = htmlspecialchars($subjectText, ENT_QUOTES, 'UTF-8');
    $messageClean = nl2br(htmlspecialchars($messageText, ENT_QUOTES, 'UTF-8'));

    $content = <<<HTML
<h2 style="margin-top:0; font-size:20px; font-weight:800;">📩 Nueva consulta de contacto</h2>
<div class="info-card">
  <p style="margin:0 0 6px 0;"><strong>Remitente:</strong> {$name}</p>
  <p style="margin:0 0 6px 0;"><strong>Email:</strong> <a href="mailto:{$email}">{$email}</a></p>
  <p style="margin:0;"><strong>Asunto:</strong> {$subjectClean}</p>
</div>

<div style="background:#ffffff; border:1px solid #e6e8ea; border-radius:4px; padding:16px; margin:16px 0;">
  <strong style="display:block; margin-bottom:8px; color:#697078; font-size:12px; text-transform:uppercase;">Mensaje:</strong>
  <div style="font-size:14px; line-height:1.6; color:#1a1d20;">{$messageClean}</div>
</div>

<p style="margin-top:20px;">
  <a href="mailto:{$email}?subject=Re:%20{$subjectClean}" class="btn">Responder al cliente</a>
</p>
HTML;

    $emailSubject = "📩 [Contacto] {$subjectClean} - {$name}";
    $html = emailLayout($emailSubject, "Nuevo mensaje de cliente", $content);
    return sendEmail($adminEmail, 'Administrador', $emailSubject, $html);
}
