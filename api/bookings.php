<?php
// ============================================================
// api/bookings.php
// GET  /api/bookings.php          → daftar booking user login
// GET  /api/bookings.php?id=1     → detail booking
// GET  /api/bookings.php?all=1    → semua booking (admin)
// POST /api/bookings.php          → buat booking baru
// PUT  /api/bookings.php?id=1     → update status (admin)
// ============================================================
require_once '../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) ? (int)$_GET['id'] : null;
$conn   = getConnection();
$auth   = getAuthUser();

// ─── GET: Detail booking ──────────────────────────────────────
if ($method === 'GET' && $id) {
    $sql = "
        SELECT
            b.*,
            u.nama_lengkap, u.email, u.nomor_handphone,
            p.payment_id, p.payment_method, p.payment_date,
            p.amount, p.status AS payment_status
        FROM booking b
        JOIN users u ON u.user_id = b.user_id
        LEFT JOIN payment p ON p.booking_id = b.booking_id
        WHERE b.booking_id = ?
    ";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $booking = $stmt->get_result()->fetch_assoc();
    if (!$booking) jsonResponse(['success' => false, 'message' => 'Booking tidak ditemukan'], 404);

    // Detail lapangan per booking
    $stmt2 = $conn->prepare("
        SELECT bc.*, cs.day_name, c.nama_lapangan, t.start_time, t.end_time
        FROM booking_courts bc
        JOIN court_schedule cs ON cs.schedule_id = bc.schedule_id
        JOIN courts    c ON c.court_id    = cs.court_id
        JOIN timeslots t ON t.timeslot_id = cs.timeslot_id
        WHERE bc.booking_id = ?
    ");
    $stmt2->bind_param('i', $id);
    $stmt2->execute();
    $booking['items'] = $stmt2->get_result()->fetch_all(MYSQLI_ASSOC);

    jsonResponse(['success' => true, 'data' => $booking]);
}

// ─── GET: Semua booking (admin) atau booking user ─────────────
if ($method === 'GET') {
    if (isset($_GET['all'])) {
        $sql = "
            SELECT b.*, u.nama_lengkap, u.email,
            p.status AS payment_status, p.payment_method
            FROM booking b
            JOIN users u ON u.user_id = b.user_id
            LEFT JOIN payment p ON p.booking_id = b.booking_id
            ORDER BY b.created_at DESC
        ";
        $result = $conn->query($sql);
    } else {
        $stmt = $conn->prepare("
            SELECT b.*, p.status AS payment_status, p.payment_method
            FROM booking b
            LEFT JOIN payment p ON p.booking_id = b.booking_id
            WHERE b.user_id = ?
            ORDER BY b.created_at DESC
        ");
        $stmt->bind_param('i', $auth['user_id']);
        $stmt->execute();
        $result = $stmt->get_result();
    }
    $data = $result->fetch_all(MYSQLI_ASSOC);
    jsonResponse(['success' => true, 'data' => $data, 'total' => count($data)]);
}

// ─── POST: Buat booking baru ──────────────────────────────────
if ($method === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    /*
    Body yang diharapkan:
    {
        "items": [
        { "schedule_id": 12, "play_date": "2026-06-10" },
        { "schedule_id": 13, "play_date": "2026-06-10" }
        ],
        "payment_method": "transfer"
    }
    */
    if (empty($body['items']) || !is_array($body['items'])) {
        jsonResponse(['success' => false, 'message' => 'Items booking tidak boleh kosong'], 400);
    }

    // Hanya QRIS yang diizinkan
    $body['payment_method'] = 'qris';

    $conn->begin_transaction();
    try {
        $totalPrice = 0;
        $itemDetails = [];

        foreach ($body['items'] as $item) {
            if (empty($item['schedule_id']) || empty($item['play_date'])) {
                throw new Exception('schedule_id dan play_date wajib diisi untuk setiap item');
            }

            // Cek jadwal ada dan aktif
            $stmt = $conn->prepare("SELECT cs.price FROM court_schedule cs WHERE cs.schedule_id = ? AND cs.is_active = TRUE");
            $stmt->bind_param('i', $item['schedule_id']);
            $stmt->execute();
            $schedule = $stmt->get_result()->fetch_assoc();
            if (!$schedule) throw new Exception("Jadwal ID {$item['schedule_id']} tidak tersedia");

            // Cek apakah sudah dipesan
            $stmt2 = $conn->prepare("
                SELECT bc.bookingcourts_id FROM booking_courts bc
                JOIN booking b ON b.booking_id = bc.booking_id
                WHERE bc.schedule_id = ? AND bc.play_date = ? AND b.status NOT IN ('cancelled')
            ");
            $stmt2->bind_param('is', $item['schedule_id'], $item['play_date']);
            $stmt2->execute();
            if ($stmt2->get_result()->num_rows > 0) {
                throw new Exception("Jadwal pada {$item['play_date']} sudah dipesan orang lain");
            }

            $totalPrice += $schedule['price'];
            $itemDetails[] = ['schedule_id' => $item['schedule_id'], 'play_date' => $item['play_date'], 'price' => $schedule['price']];
        }

        // Insert booking — status langsung 'confirmed' karena QRIS real-time
        $today     = date('Y-m-d');
        $firstDate = $itemDetails[0]['play_date'];
        $stmt = $conn->prepare(
            "INSERT INTO booking (user_id, booking_date, total_price, status, created_at) VALUES (?, ?, ?, 'confirmed', ?)"
        );
        $stmt->bind_param('isis', $auth['user_id'], $firstDate, $totalPrice, $today);
        $stmt->execute();
        $bookingId = $conn->insert_id;

        // Insert booking_courts
        foreach ($itemDetails as $item) {
            $stmt = $conn->prepare("INSERT INTO booking_courts (booking_id, schedule_id, play_date, price) VALUES (?, ?, ?, ?)");
            $stmt->bind_param('iisi', $bookingId, $item['schedule_id'], $item['play_date'], $item['price']);
            $stmt->execute();
        }

        // Insert payment — status langsung 'verified' karena QRIS dikonfirmasi di frontend
        $paymentDate = date('Y-m-d H:i:s');
        $stmt = $conn->prepare(
            "INSERT INTO payment (booking_id, payment_method, payment_date, amount, status) VALUES (?, 'qris', ?, ?, 'verified')"
        );
        $stmt->bind_param('isi', $bookingId, $paymentDate, $totalPrice);
        $stmt->execute();

        $conn->commit();
        jsonResponse([
            'success'    => true,
            'message'    => 'Pembayaran QRIS berhasil dikonfirmasi. Booking telah dikonfirmasi!',
            'booking_id' => $bookingId,
            'total_price'=> $totalPrice,
            'status'     => 'confirmed',
            'payment_status' => 'verified'
        ], 201);

    } catch (Exception $e) {
        $conn->rollback();
        jsonResponse(['success' => false, 'message' => $e->getMessage()], 400);
    }
}

// ─── PUT: Update status booking ──────────────────────────────
if ($method === 'PUT') {
    if (!$id) jsonResponse(['success' => false, 'message' => 'ID booking diperlukan'], 400);
    $body   = json_decode(file_get_contents('php://input'), true) ?? [];
    $status = $body['status'] ?? null;
    $allowed = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!in_array($status, $allowed)) {
        jsonResponse(['success' => false, 'message' => 'Status tidak valid'], 400);
    }
    $stmt = $conn->prepare("UPDATE booking SET status = ? WHERE booking_id = ?");
    $stmt->bind_param('si', $status, $id);
    $stmt->execute();
    jsonResponse(['success' => true, 'message' => 'Status booking berhasil diupdate']);
}

jsonResponse(['success' => false, 'message' => 'Method tidak diizinkan'], 405);