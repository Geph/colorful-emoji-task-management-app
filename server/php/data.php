<?php
/**
 * Dreamhost MySQL storage API for the task management app.
 * Upload this folder to: public_html/task/api/
 */

declare(strict_types=1);

require_once __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: ' . ALLOWED_ORIGIN);
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-API-Key, Accept');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if (!verifyApiKey()) {
    respond(401, ['error' => 'Invalid or missing API key']);
}

try {
    $pdo = db();
} catch (Throwable $e) {
    respond(500, ['error' => 'Database connection failed', 'detail' => $e->getMessage()]);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['health'])) {
        respond(200, ['ok' => true, 'message' => 'Storage API is reachable']);
    }

    $stmt = $pdo->query('SELECT data_json, updated_at FROM app_data WHERE id = 1 LIMIT 1');
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        respond(404, ['error' => 'No saved data found']);
    }

    respond(200, [
        'data' => json_decode($row['data_json'], true),
        'updated_at' => $row['updated_at'],
    ]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = file_get_contents('php://input');
    $payload = json_decode($raw, true);

    if (!is_array($payload) || !isset($payload['data']) || !is_array($payload['data'])) {
        respond(400, ['error' => 'Expected JSON body with a data object']);
    }

    $json = json_encode($payload['data'], JSON_UNESCAPED_UNICODE);
    if ($json === false) {
        respond(400, ['error' => 'Could not encode data as JSON']);
    }

    $stmt = $pdo->prepare(
        'INSERT INTO app_data (id, data_json) VALUES (1, :data_json)
         ON DUPLICATE KEY UPDATE data_json = VALUES(data_json), updated_at = CURRENT_TIMESTAMP'
    );
    $stmt->execute([':data_json' => $json]);

    respond(200, ['ok' => true, 'message' => 'Data saved']);
}

respond(405, ['error' => 'Method not allowed']);

function verifyApiKey(): bool
{
    if (API_KEY === '') {
        return true;
    }

    $provided = $_SERVER['HTTP_X_API_KEY'] ?? '';
    return hash_equals(API_KEY, $provided);
}

function db(): PDO
{
    $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', DB_HOST, DB_PORT, DB_NAME);
    return new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
}

function respond(int $status, array $payload): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}
