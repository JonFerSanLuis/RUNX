<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/_auth.php';
require_once __DIR__ . '/_orders.php';

startUserSession();
$userId = $_SESSION['user_id'] ?? null;
if (!is_int($userId) && !ctype_digit((string) $userId)) {
    $req = $_SERVER['REQUEST_URI'] ?? 'login.html';
    header('Location: ../../login.html?redirect=' . urlencode($req));
    exit;
}
$userId = (int) $userId;

$db = database();
$userStmt = $db->prepare('SELECT id, name, email, is_admin FROM users WHERE id = :id LIMIT 1');
$userStmt->execute(['id' => $userId]);
$currentUser = $userStmt->fetch();
$isAdmin = $currentUser && (int) ($currentUser['is_admin'] ?? 0) === 1;

$orderId = filter_input(INPUT_GET, 'order_id', FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
if (!$orderId) {
    http_response_code(400);
    die('Identificador de pedido no válido.');
}

$type = strtolower(trim((string) ($_GET['type'] ?? 'invoice')));
if (!in_array($type, ['invoice', 'packing_slip'], true)) {
    $type = 'invoice';
}

if ($type === 'packing_slip' && !$isAdmin) {
    http_response_code(403);
    die('Acceso denegado: el albarán de entrega solo está disponible para el personal de administración.');
}

if ($isAdmin) {
    $orderStmt = $db->prepare('SELECT o.*, u.email AS user_email, u.name AS user_name FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE o.id = :id LIMIT 1');
    $orderStmt->execute(['id' => $orderId]);
} else {
    $orderStmt = $db->prepare('SELECT o.*, u.email AS user_email, u.name AS user_name FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE o.id = :id AND o.user_id = :user_id LIMIT 1');
    $orderStmt->execute(['id' => $orderId, 'user_id' => $userId]);
}
$order = $orderStmt->fetch();
if (!$order) {
    http_response_code(404);
    die('Pedido no encontrado o no tienes permisos para acceder.');
}

// Obtener artículos del pedido
$itemsStmt = $db->prepare('SELECT * FROM order_items WHERE order_id = :id ORDER BY id ASC');
$itemsStmt->execute(['id' => $orderId]);
$items = $itemsStmt->fetchAll();

// Cálculos económicos
$subtotal = 0.0;
foreach ($items as $item) {
    $subtotal += (float) $item['subtotal'];
}
$shippingCost = (float) $order['shipping_cost'];
$total = (float) $order['total'];

// Desglose de IVA español estándar 21%
// Total = Base + IVA -> Base = Total / 1.21
$baseImponible = round($total / 1.21, 2);
$iva21 = round($total - $baseImponible, 2);

$createdTime = strtotime($order['created_at']);
$formattedDate = date('d/m/Y H:i', $createdTime);
$invoiceNumber = sprintf('FAC-%s-%05d', date('Y', $createdTime), (int) $order['id']);
$slipNumber = sprintf('ALB-%s-%05d', date('Y', $createdTime), (int) $order['id']);

$companyName = 'BRAND NAME';
$companyCif = 'B-88776655';
$companyAddress = 'Calle Gran Vía 42, 28013 Madrid (España)';
$companyEmail = getenv('ADMIN_EMAIL') ?: 'contacto@brandname.com';
$companyPhone = '+34 910 00 00 00';
?>
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><?= $type === 'packing_slip' ? 'Albarán de Envío ' . htmlspecialchars($slipNumber) : 'Factura ' . htmlspecialchars($invoiceNumber) ?> | <?= htmlspecialchars($companyName) ?></title>
  <style>
    :root {
      --primary: #111315;
      --accent: #235ee7;
      --border: #d0d7de;
      --bg-soft: #f6f8fa;
      --text: #24292f;
      --text-muted: #57606a;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: var(--text);
      background: #f0f2f5;
      line-height: 1.5;
      font-size: 13.5px;
    }
    /* Barra superior de herramientas (no se imprime) */
    .toolbar {
      background: #ffffff;
      border-bottom: 1px solid var(--border);
      padding: 12px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .toolbar-title {
      font-weight: 700;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .toolbar-actions {
      display: flex;
      gap: 10px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      font-size: 13px;
      font-weight: 600;
      border-radius: 6px;
      border: 1px solid var(--border);
      background: #ffffff;
      color: var(--text);
      cursor: pointer;
      text-decoration: none;
      transition: all 0.15s ease;
    }
    .btn:hover { background: #f6f8fa; }
    .btn-download {
      background: #0969da;
      color: #ffffff;
      border-color: #0969da;
    }
    .btn-download:hover { background: #0856b3; }
    .btn-primary {
      background: #1f2328;
      color: #ffffff;
      border-color: #1f2328;
    }
    .btn-primary:hover { background: #000000; }

    /* Contenedor del documento A4 */
    .document-page {
      max-width: 210mm;
      min-height: 297mm;
      margin: 24px auto;
      background: #ffffff;
      padding: 20mm;
      box-shadow: 0 4px 15px rgba(0,0,0,0.08);
      border-radius: 4px;
    }

    /* Cabecera del documento */
    .doc-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid var(--primary);
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .brand-box {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    .brand-mark {
      background: var(--primary);
      color: #ffffff;
      width: 28px;
      height: 28px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 13px;
      border-radius: 4px;
    }
    .brand-name {
      font-size: 19px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .company-details {
      color: var(--text-muted);
      font-size: 12px;
      line-height: 1.45;
    }
    .doc-meta {
      text-align: right;
    }
    .doc-badge {
      display: inline-block;
      padding: 4px 10px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      border-radius: 4px;
      margin-bottom: 8px;
      letter-spacing: 0.5px;
    }
    .badge-invoice { background: #e8f4ff; color: #0969da; border: 1px solid #b6e3ff; }
    .badge-slip { background: #fff8c5; color: #9a6700; border: 1px solid #f9e38e; }
    .doc-number {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin-bottom: 4px;
    }
    .doc-date {
      color: var(--text-muted);
      font-size: 12.5px;
    }

    /* Secciones informativas (cliente y envío) */
    .parties-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 28px;
    }
    .party-card {
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 14px 16px;
      background: var(--bg-soft);
    }
    .party-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--text-muted);
      letter-spacing: 0.5px;
      margin-bottom: 8px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 4px;
    }
    .party-name {
      font-size: 14px;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 4px;
    }
    .party-text {
      font-size: 12.5px;
      color: var(--text);
      line-height: 1.4;
    }

    /* Tabla de artículos */
    .table-wrap {
      margin-bottom: 24px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    th {
      background: #f6f8fa;
      border-bottom: 2px solid var(--border);
      padding: 10px 12px;
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
      color: var(--text-muted);
      letter-spacing: 0.5px;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #e1e4e8;
      vertical-align: middle;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .item-name { font-weight: 600; color: var(--text); }
    .item-variant { font-size: 11.5px; color: var(--text-muted); }

    /* Totales y desglose */
    .bottom-section {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 24px;
      margin-top: 10px;
    }
    .notes-box {
      border: 1px solid #e1e4e8;
      border-radius: 6px;
      padding: 12px 14px;
      background: #fafbfc;
      font-size: 12px;
    }
    .totals-box {
      background: #f6f8fa;
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 14px 16px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      padding: 4px 0;
    }
    .total-row.final {
      border-top: 2px solid var(--primary);
      margin-top: 8px;
      padding-top: 8px;
      font-size: 16px;
      font-weight: 800;
      color: var(--primary);
    }

    /* Elementos específicos del albarán */
    .picking-check {
      width: 22px;
      height: 22px;
      border: 2px solid var(--border);
      border-radius: 4px;
      display: inline-block;
    }
    .signature-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-top: 40px;
      padding-top: 20px;
    }
    .sig-box {
      border: 1px dashed var(--border);
      height: 90px;
      border-radius: 6px;
      display: flex;
      align-items: flex-end;
      padding: 8px 12px;
      font-size: 11px;
      color: var(--text-muted);
    }

    /* Footer del documento */
    .doc-footer {
      border-top: 1px solid #e1e4e8;
      margin-top: 36px;
      padding-top: 16px;
      text-align: center;
      font-size: 11px;
      color: var(--text-muted);
      line-height: 1.5;
    }

    /* ESTILOS DE IMPRESIÓN OFICIAL (A4) */
    @media print {
      body {
        background: #ffffff;
        font-size: 12px;
      }
      .toolbar { display: none !important; }
      .document-page {
        box-shadow: none;
        margin: 0;
        padding: 0;
        max-width: 100%;
        border-radius: 0;
      }
      @page {
        size: A4 portrait;
        margin: 14mm 15mm;
      }
    }
  </style>
</head>
<body>

  <!-- Barra de acciones en navegador -->
  <div class="toolbar">
    <div class="toolbar-title">
      <span><?= $type === 'packing_slip' ? '📦 Albarán de Entrega y Picking' : '📄 Factura Oficial' ?></span>
      <span style="color: var(--text-muted); font-weight: 400;">(Pedido #<?= (int) $order['id'] ?>)</span>
    </div>
    <div class="toolbar-actions">
      <?php if ($isAdmin): ?>
        <?php if ($type === 'invoice'): ?>
          <a href="invoice.php?order_id=<?= (int) $order['id'] ?>&type=packing_slip" class="btn">📦 Ver Albarán</a>
        <?php else: ?>
          <a href="invoice.php?order_id=<?= (int) $order['id'] ?>&type=invoice" class="btn">📄 Ver Factura</a>
        <?php endif; ?>
      <?php endif; ?>
      <button id="btn-download-pdf" onclick="downloadPdfFile()" class="btn btn-download">⬇️ Descargar PDF</button>
      <button onclick="window.print()" class="btn">🖨️ Imprimir</button>
      <button onclick="window.close(); if(history.length > 1) history.back();" class="btn">Cerrar</button>
    </div>
  </div>

  <div class="document-page">

    <!-- CABECERA -->
    <div class="doc-header">
      <div>
        <div class="brand-box">
          <span class="brand-mark">B</span>
          <span class="brand-name"><?= htmlspecialchars($companyName) ?></span>
        </div>
        <div class="company-details">
          <div><strong>CIF:</strong> <?= htmlspecialchars($companyCif) ?></div>
          <div><?= htmlspecialchars($companyAddress) ?></div>
          <div><strong>Email:</strong> <?= htmlspecialchars($companyEmail) ?> · <strong>Tel:</strong> <?= htmlspecialchars($companyPhone) ?></div>
        </div>
      </div>
      <div class="doc-meta">
        <?php if ($type === 'packing_slip'): ?>
          <span class="doc-badge badge-slip">Albarán de Preparación y Envío</span>
          <div class="doc-number"><?= htmlspecialchars($slipNumber) ?></div>
        <?php else: ?>
          <span class="doc-badge badge-invoice">Factura Oficial</span>
          <div class="doc-number"><?= htmlspecialchars($invoiceNumber) ?></div>
        <?php endif; ?>
        <div class="doc-date"><strong>Fecha de emisión:</strong> <?= htmlspecialchars($formattedDate) ?></div>
        <div class="doc-date"><strong>Ref. Pedido:</strong> #<?= (int) $order['id'] ?></div>
      </div>
    </div>

    <!-- SECCIÓN DATOS CLIENTE Y ENVÍO -->
    <div class="parties-grid">
      <div class="party-card">
        <div class="party-title">Datos del Cliente</div>
        <div class="party-name"><?= htmlspecialchars($order['shipping_name'] ?: ($order['user_name'] ?? 'Cliente')) ?></div>
        <div class="party-text">
          <div><strong>Email:</strong> <?= htmlspecialchars($order['user_email'] ?? '') ?></div>
          <div><strong>Teléfono:</strong> <?= htmlspecialchars($order['shipping_phone'] ?? 'No indicado') ?></div>
          <?php if (!empty($order['payment_method'])): ?>
            <div style="margin-top: 4px;"><strong>Método de pago:</strong> <?= htmlspecialchars(paymentMethodLabel($order['payment_method'])) ?></div>
          <?php endif; ?>
          <div><strong>Estado de pago:</strong> <?= $order['payment_status'] === 'paid' ? '<span style="color:#0969da;font-weight:700;">✓ Pagado</span>' : 'Pendiente' ?></div>
        </div>
      </div>

      <div class="party-card">
        <div class="party-title">Dirección de Entrega</div>
        <div class="party-name"><?= htmlspecialchars($order['shipping_name']) ?></div>
        <div class="party-text">
          <div><?= htmlspecialchars($order['shipping_address']) ?></div>
          <div><?= htmlspecialchars($order['shipping_postal_code']) ?> <?= htmlspecialchars($order['shipping_city']) ?> (<?= htmlspecialchars($order['shipping_province']) ?>)</div>
          <?php if (!empty($order['tracking_carrier']) || !empty($order['tracking_number'])): ?>
            <div style="margin-top: 6px; padding-top: 6px; border-top: 1px dashed var(--border);">
              <div><strong>Transportista:</strong> <?= htmlspecialchars($order['tracking_carrier'] ?: 'Mensajería') ?></div>
              <div><strong>Nº Seguimiento:</strong> <span style="font-family: monospace; font-weight:700;"><?= htmlspecialchars($order['tracking_number'] ?: 'En trámite') ?></span></div>
            </div>
          <?php endif; ?>
        </div>
      </div>
    </div>

    <!-- TABLA DE LÍNEAS / ARTÍCULOS -->
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <?php if ($type === 'packing_slip'): ?>
              <th style="width: 40px;" class="text-center">OK</th>
            <?php endif; ?>
            <th>Descripción del Producto</th>
            <th class="text-center" style="width: 80px;">Cant.</th>
            <?php if ($type === 'invoice'): ?>
              <th class="text-right" style="width: 110px;">Precio Unit.</th>
              <th class="text-right" style="width: 90px;">IVA</th>
              <th class="text-right" style="width: 110px;">Subtotal</th>
            <?php else: ?>
              <th style="width: 180px;">Variante / Referencia</th>
              <th class="text-right" style="width: 120px;">Comprobado</th>
            <?php endif; ?>
          </tr>
        </thead>
        <tbody>
          <?php foreach ($items as $item): ?>
            <?php
              $variantParts = array_filter([$item['color'] ?? '', $item['size'] ?? '']);
              $variantText = count($variantParts) ? implode(' · ', $variantParts) : 'Estándar';
              $unitPrice = (float) $item['unit_price'];
              $lineTotal = (float) $item['subtotal'];
            ?>
            <tr>
              <?php if ($type === 'packing_slip'): ?>
                <td class="text-center"><span class="picking-check"></span></td>
              <?php endif; ?>
              <td>
                <div class="item-name"><?= htmlspecialchars($item['product_name']) ?></div>
                <div class="item-variant"><?= htmlspecialchars($variantText) ?></div>
              </td>
              <td class="text-center"><strong><?= (int) $item['quantity'] ?></strong></td>
              <?php if ($type === 'invoice'): ?>
                <td class="text-right"><?= number_format($unitPrice, 2, ',', '.') ?> €</td>
                <td class="text-right">21%</td>
                <td class="text-right fw-bold"><strong><?= number_format($lineTotal, 2, ',', '.') ?> €</strong></td>
              <?php else: ?>
                <td><?= htmlspecialchars($variantText) ?></td>
                <td class="text-right" style="color: var(--text-muted); font-size: 11px;">[ &nbsp; ] Verificado</td>
              <?php endif; ?>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>

    <!-- SECCIÓN INFERIOR -->
    <?php if ($type === 'invoice'): ?>
      <div class="bottom-section">
        <div class="notes-box">
          <div style="font-weight: 700; margin-bottom: 4px;">Información Legal y Fiscal</div>
          <div>Operación sujeta a la Ley del Impuesto sobre el Valor Añadido (IVA 21%).</div>
          <div>Factura emitida electrónicamente y registrada en el sistema de facturación de <?= htmlspecialchars($companyName) ?>.</div>
          <?php if (!empty($order['notes'])): ?>
            <div style="margin-top: 8px; border-top: 1px solid #e1e4e8; padding-top: 6px;">
              <strong>Instrucciones del pedido:</strong> <?= htmlspecialchars($order['notes']) ?>
            </div>
          <?php endif; ?>
        </div>

        <div class="totals-box">
          <div class="total-row">
            <span>Base Imponible:</span>
            <strong><?= number_format($baseImponible, 2, ',', '.') ?> €</strong>
          </div>
          <div class="total-row">
            <span>IVA (21%):</span>
            <strong><?= number_format($iva21, 2, ',', '.') ?> €</strong>
          </div>
          <div class="total-row">
            <span>Gastos de Envío:</span>
            <strong><?= $shippingCost > 0 ? number_format($shippingCost, 2, ',', '.') . ' €' : 'Gratis (0,00 €)' ?></strong>
          </div>
          <div class="total-row final">
            <span>Total Factura:</span>
            <span><?= number_format($total, 2, ',', '.') ?> €</span>
          </div>
        </div>
      </div>
    <?php else: ?>
      <!-- Formato Albarán de Preparación y Entrega -->
      <div class="bottom-section">
        <div class="notes-box">
          <div style="font-weight: 700; margin-bottom: 4px;">Instrucciones para el Repartidor / Almacén</div>
          <div>Por favor, compruebe que el paquete se encuentra sellado y en perfecto estado.</div>
          <?php if (!empty($order['notes'])): ?>
            <div style="margin-top: 6px; padding: 6px; background: #fff8c5; border: 1px solid #f9e38e; border-radius: 4px;">
              <strong>Nota del Cliente:</strong> <?= htmlspecialchars($order['notes']) ?>
            </div>
          <?php endif; ?>
        </div>

        <div class="totals-box">
          <div class="total-row">
            <span>Total bultos / artículos:</span>
            <strong><?= count($items) ?> ref. (<?= array_sum(array_column($items, 'quantity')) ?> uds.)</strong>
          </div>
          <div class="total-row">
            <span>Transporte asignado:</span>
            <strong><?= htmlspecialchars($order['tracking_carrier'] ?: 'Correos Express / Estándar') ?></strong>
          </div>
          <div class="total-row">
            <span>Código de envío:</span>
            <strong style="font-family: monospace;"><?= htmlspecialchars($order['tracking_number'] ?: 'PENDIENTE') ?></strong>
          </div>
        </div>
      </div>

      <div class="signature-grid">
        <div class="sig-box">
          Firma y fecha del operario de preparación de pedido
        </div>
        <div class="sig-box">
          Firma y DNI del destinatario / conformidad de recepción
        </div>
      </div>
    <?php endif; ?>

    <!-- PIE DE PÁGINA -->
    <div class="doc-footer">
      <div><?= htmlspecialchars($companyName) ?> · NIF <?= htmlspecialchars($companyCif) ?> · <?= htmlspecialchars($companyAddress) ?></div>
      <div>Para cualquier consulta sobre este documento contacte con <?= htmlspecialchars($companyEmail) ?> indicando la referencia de pedido #<?= (int) $order['id'] ?>.</div>
    </div>

  </div>

  <script src="../../js/html2pdf.bundle.min.js"></script>
  <script>
    if (typeof html2pdf === 'undefined') {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      document.head.appendChild(s);
    }

    async function downloadPdfFile() {
      const btn = document.getElementById('btn-download-pdf');
      const originalText = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '⏳ Generando PDF…';

      const element = document.querySelector('.document-page');
      const filename = '<?= $type === 'packing_slip' ? 'Albaran_' . $slipNumber : 'Factura_' . $invoiceNumber ?>.pdf';

      const opt = {
        margin: [6, 6, 6, 6],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      try {
        if (typeof html2pdf !== 'undefined') {
          await html2pdf().set(opt).from(element).save();
        } else {
          window.print();
        }
      } catch (err) {
        console.warn('html2pdf fallback to print:', err);
        window.print();
      } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    }

    if (new URLSearchParams(window.location.search).get('download') === '1') {
      window.addEventListener('DOMContentLoaded', () => {
        setTimeout(downloadPdfFile, 600);
      });
    }
  </script>
</body>
</html>
