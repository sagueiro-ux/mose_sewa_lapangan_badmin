<?php
// ============================================================
// api/courts.php
// GET    /api/courts.php           → list semua lapangan aktif
// GET    /api/courts.php?id=1      → detail lapangan
// POST   /api/courts.php           → tambah lapangan (admin)
// PUT    /api/courts.php?id=1      → update lapangan (admin)
// DELETE /api/courts.php?id=1      → hapus lapangan (admin)
// ============================================================
require_once '../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) ? (int)$_GET['id'] : null;
$conn   = getConnection();

// ─── GET ──────────────────────────────────────────────────────
if ($method === 'GET') {
    if ($id) {
        $stmt = $conn->prepare("SELECT * FROM courts WHERE court_id = ?");
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $court = $stmt->get_result()->fetch_assoc();
        if (!$court) jsonResponse(['success' => false, 'message' => 'Lapangan tidak ditemukan'], 404);
        jsonResponse(['success' => true, 'data' => $court]);
    }

    $result = $conn->query("SELECT * FROM courts WHERE is_active = TRUE ORDER BY court_id");
    $data   = $result->fetch_all(MYSQLI_ASSOC);
    jsonResponse(['success' => true, 'data' => $data, 'total' => count($data)]);
}

// ─── POST ─────────────────────────────────────────────────────
if ($method === 'POST') {
    getAuthUser();
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    if (empty($body['nama_lapangan'])) {
        jsonResponse(['success' => false, 'message' => 'nama_lapangan wajib diisi'], 400);
    }
    $stmt = $conn->prepare("INSERT INTO courts (nama_lapangan) VALUES (?)");
    $stmt->bind_param('s', $body['nama_lapangan']);
    $stmt->execute();
    jsonResponse(['success' => true, 'message' => 'Lapangan berhasil ditambahkan', 'court_id' => $conn->insert_id], 201);
}

// ─── PUT ──────────────────────────────────────────────────────
if ($method === 'PUT') {
    getAuthUser();
    if (!$id) jsonResponse(['success' => false, 'message' => 'ID lapangan diperlukan'], 400);
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $stmt = $conn->prepare("UPDATE courts SET nama_lapangan = ?, is_active = ? WHERE court_id = ?");
    $active = isset($body['is_active']) ? (int)$body['is_active'] : 1;
    $stmt->bind_param('sii', $body['nama_lapangan'], $active, $id);
    $stmt->execute();
    jsonResponse(['success' => true, 'message' => 'Lapangan berhasil diupdate']);
}

// ─── DELETE ───────────────────────────────────────────────────
if ($method === 'DELETE') {
    getAuthUser();
    if (!$id) jsonResponse(['success' => false, 'message' => 'ID lapangan diperlukan'], 400);
    $stmt = $conn->prepare("UPDATE courts SET is_active = FALSE WHERE court_id = ?");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    jsonResponse(['success' => true, 'message' => 'Lapangan berhasil dinonaktifkan']);
}

jsonResponse(['success' => false, 'message' => 'Method tidak diizinkan'], 405);
