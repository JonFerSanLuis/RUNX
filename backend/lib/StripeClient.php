<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/stripe.php';

final class StripeClient
{
    private const API_BASE = 'https://api.stripe.com/v1';
    private string $secretKey;

    public function __construct(?string $secretKey = null)
    {
        $config = stripeConfig();
        $this->secretKey = $secretKey ?? ($config['secret_key'] ?? '');

        if ($this->secretKey === '') {
            throw new RuntimeException('Clave secreta de Stripe (STRIPE_SECRET_KEY) no configurada en .env.');
        }
    }

    /**
     * Crea un PaymentIntent en Stripe para procesar un cobro con tarjeta o métodos automáticos.
     */
    public function createPaymentIntent(int $amountCents, string $currency = 'eur', array $params = []): array
    {
        $payload = array_merge([
            'amount' => $amountCents,
            'currency' => strtolower($currency),
            'automatic_payment_methods' => ['enabled' => 'true'],
        ], $params);

        return $this->request('POST', '/payment_intents', $payload);
    }

    /**
     * Consulta el estado de un PaymentIntent en Stripe.
     */
    public function getPaymentIntent(string $paymentIntentId): array
    {
        return $this->request('GET', '/payment_intents/' . urlencode($paymentIntentId));
    }

    /**
     * Cancela un PaymentIntent si el cliente cancela la compra.
     */
    public function cancelPaymentIntent(string $paymentIntentId): array
    {
        return $this->request('POST', '/payment_intents/' . urlencode($paymentIntentId) . '/cancel');
    }

    /**
     * Verifica la firma del Webhook de Stripe para asegurar que la notificación proviene realmente de Stripe.
     */
    public static function verifyWebhookSignature(string $payload, string $sigHeader, string $secret, int $tolerance = 300): bool
    {
        if ($secret === '' || $sigHeader === '') {
            return false;
        }

        $timestamp = -1;
        $signatures = [];

        $items = explode(',', $sigHeader);
        foreach ($items as $item) {
            $parts = explode('=', trim($item), 2);
            if (count($parts) === 2) {
                if ($parts[0] === 't') {
                    $timestamp = (int) $parts[1];
                } elseif ($parts[0] === 'v1') {
                    $signatures[] = $parts[1];
                }
            }
        }

        if ($timestamp <= 0 || empty($signatures)) {
            return false;
        }

        // Comprobar tolerancia de tiempo (evita ataques de repetición)
        if ($tolerance > 0 && abs(time() - $timestamp) > $tolerance) {
            return false;
        }

        $signedPayload = "{$timestamp}.{$payload}";
        $expectedSignature = hash_hmac('sha256', $signedPayload, $secret);

        foreach ($signatures as $sig) {
            if (hash_equals($expectedSignature, $sig)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Ejecuta una petición HTTP a la API REST de Stripe mediante cURL nativo.
     */
    private function request(string $method, string $path, array $data = []): array
    {
        $url = self::API_BASE . $path;
        $ch = curl_init();

        $headers = [
            'Authorization: Bearer ' . $this->secretKey,
            'Content-Type: application/x-www-form-urlencoded',
            'Stripe-Version: 2023-10-16',
        ];

        $curlOptions = [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_TIMEOUT => 25,
            CURLOPT_CONNECTTIMEOUT => 10,
        ];

        // Compatibilidad con entornos Windows / XAMPP donde puede faltar el bundle CA
        $isLocalHost = in_array($_SERVER['HTTP_HOST'] ?? 'localhost', ['localhost', '127.0.0.1'], true);
        if ($isLocalHost) {
            $curlOptions[CURLOPT_SSL_VERIFYPEER] = false;
            $curlOptions[CURLOPT_SSL_VERIFYHOST] = 0;
        }

        if (strtoupper($method) === 'POST') {
            $curlOptions[CURLOPT_POST] = true;
            $curlOptions[CURLOPT_POSTFIELDS] = http_build_query($data);
        } elseif (strtoupper($method) === 'GET' && !empty($data)) {
            $curlOptions[CURLOPT_URL] .= '?' . http_build_query($data);
        }

        curl_setopt_array($ch, $curlOptions);

        $responseBody = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        $curlErrno = curl_errno($ch);
        curl_close($ch);

        if ($responseBody === false || $curlErrno !== 0) {
            throw new RuntimeException('Error de conexión con la pasarela Stripe: ' . $curlError);
        }

        $decoded = json_decode((string) $responseBody, true);
        if (!is_array($decoded)) {
            throw new RuntimeException('Respuesta no válida de Stripe (HTTP ' . $httpCode . ').');
        }

        if ($httpCode >= 400 || isset($decoded['error'])) {
            $errorMessage = $decoded['error']['message'] ?? ('Error en Stripe con código HTTP ' . $httpCode);
            throw new RuntimeException($errorMessage);
        }

        return $decoded;
    }
}
