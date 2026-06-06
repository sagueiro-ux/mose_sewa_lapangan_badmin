<?php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');            // Kosongkan, default XAMPP memang kosong
define('DB_NAME', 'badminton_db');
define('JWT_SECRET', 'rahasia_acak_123_ganti_ini');

function getConnection() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    if ($conn->connect_error) {
        jsonResponse(['success' => false, 'message' => 'Koneksi DB gagal'], 500);
    }
    $conn->set_charset('utf8mb4');
    return $conn;
}

function jsonResponse($data, $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    echo json_encode($data);
    exit;
}

function generateToken($payload) {
    $header  = base64_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $payload = base64_encode(json_encode($payload));
    $sig     = base64_encode(hash_hmac('sha256', "$header.$payload", JWT_SECRET, true));
    return "$header.$payload.$sig";
}

function getAuthUser() {
    $token = '';

    // Cara 1: Dari query string ?token=xxx
    if (!empty($_GET['token'])) {
        $token = $_GET['token'];
    }
    // Cara 2: Dari body JSON
    elseif (!empty(file_get_contents('php://input'))) {
        $body = json_decode(file_get_contents('php://input'), true);
        if (!empty($body['token'])) {
            $token = $body['token'];
        }
    }
    // Cara 3: Dari header (kalau XAMPP support)
    else {
        $auth = '';
        if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
            $auth = $_SERVER['HTTP_AUTHORIZATION'];
        } elseif (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $auth = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        } elseif (function_exists('getallheaders')) {
            $headers = getallheaders();
            foreach ($headers as $key => $val) {
                if (strtolower($key) === 'authorization') {
                    $auth = $val;
                    break;
                }
            }
        }
        if (!empty($auth) && str_starts_with($auth, 'Bearer ')) {
            $token = substr($auth, 7);
        }
    }

    if (empty($token)) {
        jsonResponse(['success' => false, 'message' => 'Token tidak ditemukan'], 401);
    }

    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        jsonResponse(['success' => false, 'message' => 'Token tidak valid'], 401);
    }

    $payload = json_decode(base64_decode($parts[1]), true);
    if (!$payload || $payload['exp'] < time()) {
        jsonResponse(['success' => false, 'message' => 'Token kadaluarsa'], 401);
    }

    return $payload;
}