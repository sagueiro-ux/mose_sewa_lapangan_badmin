<?php
// ============================================================
// api/payments.php
// GET  /api/payments.php?booking_id=1 → cek status bayar
// PUT  /api/payments.php?id=1         → verifikasi/update status pembayaran (admin)
// ============================================================
require_once '../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];
$conn   = getConnection();
$auth   = getAuthUser();

// ─── GET: Status pembayaran ───────────────────────────────────
if ($method === 'GET') {
    $bookingId = isset($_GET['booking_id']) ? (int)$_GET['booking_id'] : null;
    if (!$bookingId) jsonResponse(['success' => false, 'message' => 'booking_id diperlukan'], 400);

    $stmt = $conn->prepare("
        SELECT p.*, b.total_price, b.status AS booking_status, u.nama_lengkap
        FROM payment p
        JOIN booking b ON b.booking_id = p.booking_id
        JOIN users   u ON u.user_id    = b.user_id
        WHERE p.booking_id = ?
    ");
    $stmt->bind_param('i', $bookingId);
    $stmt->execute();
    $payment = $stmt->get_result()->fetch_assoc();
    if (!$payment) jsonResponse(['success' => false, 'message' => 'Data pembayaran tidak ditemukan'], 404);
    jsonResponse(['success' => true, 'data' => $payment]);
}

// ─── PUT: Admin verifikasi/override pembayaran ────────────────
// Catatan: Pembayaran QRIS sudah otomatis 'verified' saat booking dibuat.
// Endpoint ini hanya digunakan admin untuk override manual jika diperlukan.
if ($method === 'PUT') {
    $id   = isset($_GET['id']) ? (int)$_GET['id'] : null;
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    if (!$id) jsonResponse(['success' => false, 'message' => 'ID payment diperlukan'], 400);

    $status  = $body['status'] ?? null;
    $allowed = ['pending', 'verified', 'failed'];
    if (!in_array($status, $allowed)) {
        jsonResponse(['success' => false, 'message' => 'Status pembayaran tidak valid'], 400);
    }

    $conn->begin_transaction();
    try {
        // Update status payment
        $stmt = $conn->prepare("UPDATE payment SET status = ? WHERE payment_id = ?");
        $stmt->bind_param('si', $status, $id);
        $stmt->execute();

        // Jika verified → konfirmasi booking; jika failed → cancel booking
        if ($status === 'verified') {
            $bookingStatus = 'confirmed';
        } elseif ($status === 'failed') {
            $bookingStatus = 'cancelled';
        } else {
            $bookingStatus = 'pending';
        }

        $stmt2 = $conn->prepare("
            UPDATE booking b
            JOIN payment p ON p.booking_id = b.booking_id
            SET b.status = ?
            WHERE p.payment_id = ?
        ");
        $stmt2->bind_param('si', $bookingStatus, $id);
        $stmt2->execute();

        $conn->commit();
        jsonResponse(['success' => true, 'message' => 'Status pembayaran berhasil diupdate']);
    } catch (Exception $e) {
        $conn->rollback();
        jsonResponse(['success' => false, 'message' => $e->getMessage()], 500);
    }
}

jsonResponse(['success' => false, 'message' => 'Method tidak diizinkan'], 405);