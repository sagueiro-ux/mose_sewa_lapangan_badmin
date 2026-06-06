<?php
// ============================================================
// api/auth.php  →  POST /api/auth.php?action=register|login
// ============================================================
require_once '../config/database.php';

$action = $_GET['action'] ?? '';
$body   = json_decode(file_get_contents('php://input'), true) ?? [];

// ─── REGISTER ────────────────────────────────────────────────
if ($action === 'register') {
    $required = ['nama_lengkap', 'nomor_handphone', 'email', 'password'];
    foreach ($required as $f) {
        if (empty($body[$f])) jsonResponse(['success' => false, 'message' => "Field $f wajib diisi"], 400);
    }

    $conn = getConnection();

    // Cek email duplikat
    $stmt = $conn->prepare("SELECT user_id FROM users WHERE email = ?");
    $stmt->bind_param('s', $body['email']);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) {
        jsonResponse(['success' => false, 'message' => 'Email sudah terdaftar'], 409);
    }

    $hash = password_hash($body['password'], PASSWORD_BCRYPT);
    $stmt = $conn->prepare(
        "INSERT INTO users (nama_lengkap, nomor_handphone, email, password) VALUES (?, ?, ?, ?)"
    );
    $stmt->bind_param('ssss', $body['nama_lengkap'], $body['nomor_handphone'], $body['email'], $hash);
    $stmt->execute();

    jsonResponse(['success' => true, 'message' => 'Registrasi berhasil', 'user_id' => $conn->insert_id], 201);
}

// ─── LOGIN ────────────────────────────────────────────────────
if ($action === 'login') {
    if (empty($body['email']) || empty($body['password'])) {
        jsonResponse(['success' => false, 'message' => 'Email dan password wajib diisi'], 400);
    }

    $conn = getConnection();
    $stmt = $conn->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->bind_param('s', $body['email']);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();

    if (!$user || !password_verify($body['password'], $user['password'])) {
        jsonResponse(['success' => false, 'message' => 'Email atau password salah'], 401);
    }

    $token = generateToken([
        'user_id' => $user['user_id'],
        'email'   => $user['email'],
        'exp'     => time() + 86400 // 24 jam
    ]);

    unset($user['password']);
    jsonResponse(['success' => true, 'message' => 'Login berhasil', 'token' => $token, 'user' => $user]);
}

jsonResponse(['success' => false, 'message' => 'Action tidak dikenal'], 400);
