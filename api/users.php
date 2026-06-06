<?php
// ============================================================
// api/users.php
// GET  /api/users.php                  → profil user login
// PUT  /api/users.php                  → update nama lengkap saja
// PUT  /api/users.php?action=password  → ganti password
// POST /api/users.php?action=avatar    → upload foto profil
// ============================================================
// Handle OPTIONS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    http_response_code(200);
    exit;
}

// Paksa baca Authorization dari semua kemungkinan sumber
if (!isset($_SERVER['HTTP_AUTHORIZATION'])) {
    $allHeaders = getallheaders();
    foreach ($allHeaders as $key => $val) {
        if (strtolower($key) === 'authorization') {
            $_SERVER['HTTP_AUTHORIZATION'] = $val;
            break;
        }
    }
}

require_once '../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];
$conn   = getConnection();
$auth   = getAuthUser();

// ─── GET: Profil ──────────────────────────────────────────────
if ($method === 'GET') {
    $stmt = $conn->prepare(
        "SELECT user_id, nama_lengkap, nomor_handphone, email, foto_profil
         FROM users WHERE user_id = ?"
    );
    $stmt->bind_param('i', $auth['user_id']);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();
    if (!$user) jsonResponse(['success' => false, 'message' => 'User tidak ditemukan'], 404);
    jsonResponse(['success' => true, 'data' => $user]);
}

// ─── POST: Upload Foto Profil ─────────────────────────────────
if ($method === 'POST') {
    $action = $_GET['action'] ?? '';

    if ($action === 'avatar') {
        if (empty($_FILES['foto'])) {
            jsonResponse(['success' => false, 'message' => 'File foto tidak ditemukan'], 400);
        }

        $file     = $_FILES['foto'];
        $allowed  = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        $maxSize  = 2 * 1024 * 1024; // 2 MB

        if (!in_array($file['type'], $allowed)) {
            jsonResponse(['success' => false, 'message' => 'Format file harus JPG, PNG, WebP, atau GIF'], 400);
        }
        if ($file['size'] > $maxSize) {
            jsonResponse(['success' => false, 'message' => 'Ukuran file maksimal 2 MB'], 400);
        }

        // Buat folder uploads/avatars jika belum ada
        $uploadDir = __DIR__ . '/../uploads/avatars/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        // Hapus foto lama jika bukan default
        $stmtOld = $conn->prepare("SELECT foto_profil FROM users WHERE user_id = ?");
        $stmtOld->bind_param('i', $auth['user_id']);
        $stmtOld->execute();
        $oldRow = $stmtOld->get_result()->fetch_assoc();
        if (!empty($oldRow['foto_profil'])) {
            $oldPath = __DIR__ . '/../' . $oldRow['foto_profil'];
            if (file_exists($oldPath)) @unlink($oldPath);
        }

        // Simpan dengan nama unik
        $ext      = pathinfo($file['name'], PATHINFO_EXTENSION) ?: 'jpg';
        $filename = 'avatar_' . $auth['user_id'] . '_' . time() . '.' . $ext;
        $destPath = $uploadDir . $filename;

        if (!move_uploaded_file($file['tmp_name'], $destPath)) {
            jsonResponse(['success' => false, 'message' => 'Gagal menyimpan file'], 500);
        }

        $relativePath = 'uploads/avatars/' . $filename;
        $stmt = $conn->prepare("UPDATE users SET foto_profil = ? WHERE user_id = ?");
        $stmt->bind_param('si', $relativePath, $auth['user_id']);
        $stmt->execute();

        jsonResponse([
            'success'    => true,
            'message'    => 'Foto profil berhasil diperbarui',
            'foto_profil'=> $relativePath
        ]);
    }

    jsonResponse(['success' => false, 'message' => 'Action tidak dikenal'], 400);
}

// ─── PUT: Update profil / ganti password ──────────────────────
if ($method === 'PUT') {
    $body   = json_decode(file_get_contents('php://input'), true) ?? [];
    $action = $_GET['action'] ?? 'profile';

    // ── Ganti Password ────────────────────────────────────────
    if ($action === 'password') {
        if (empty($body['old_password']) || empty($body['new_password'])) {
            jsonResponse(['success' => false, 'message' => 'old_password dan new_password wajib diisi'], 400);
        }
        if (strlen($body['new_password']) < 6) {
            jsonResponse(['success' => false, 'message' => 'Password baru minimal 6 karakter'], 400);
        }

        $stmt = $conn->prepare("SELECT password FROM users WHERE user_id = ?");
        $stmt->bind_param('i', $auth['user_id']);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();

        if (!password_verify($body['old_password'], $row['password'])) {
            jsonResponse(['success' => false, 'message' => 'Password lama tidak sesuai'], 400);
        }

        $hash = password_hash($body['new_password'], PASSWORD_BCRYPT);
        $stmt = $conn->prepare("UPDATE users SET password = ? WHERE user_id = ?");
        $stmt->bind_param('si', $hash, $auth['user_id']);
        $stmt->execute();
        jsonResponse(['success' => true, 'message' => 'Password berhasil diubah']);
    }

    // ── Update Profil (hanya nama_lengkap) ────────────────────
    // Nomor handphone dan email TIDAK bisa diubah oleh user
    if (empty($body['nama_lengkap']) || strlen(trim($body['nama_lengkap'])) < 2) {
        jsonResponse(['success' => false, 'message' => 'Nama lengkap minimal 2 karakter'], 400);
    }

    $nama = trim($body['nama_lengkap']);
    $stmt = $conn->prepare("UPDATE users SET nama_lengkap = ? WHERE user_id = ?");
    $stmt->bind_param('si', $nama, $auth['user_id']);
    $stmt->execute();

    // Kembalikan data terbaru
    $stmt2 = $conn->prepare(
        "SELECT user_id, nama_lengkap, nomor_handphone, email, foto_profil FROM users WHERE user_id = ?"
    );
    $stmt2->bind_param('i', $auth['user_id']);
    $stmt2->execute();
    $updated = $stmt2->get_result()->fetch_assoc();

    jsonResponse(['success' => true, 'message' => 'Profil berhasil diperbarui', 'data' => $updated]);
}

jsonResponse(['success' => false, 'message' => 'Method tidak diizinkan'], 405);