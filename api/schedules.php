<?php

// api/schedules.php
// GET /api/schedules.php?court_id=1&date=2026-06-10
//     → jadwal + status tersedia/terbooked untuk tanggal tsb
// GET /api/schedules.php?all=1
//     → semua jadwal (admin)
// POST/PUT/DELETE → kelola jadwal (admin)

require_once '../config/database.php';

$method   = $_SERVER['REQUEST_METHOD'];
$conn     = getConnection();
$court_id = isset($_GET['court_id']) ? (int)$_GET['court_id'] : null;
$date     = $_GET['date'] ?? null;
$id       = isset($_GET['id']) ? (int)$_GET['id'] : null;

//     GET: Ketersediaan lapangan pada tanggal tertentu 
if ($method === 'GET' && $court_id && $date) {
    // Dapatkan nama hari dari tanggal
    $dayNames = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
    $dayIndex = (int)date('w', strtotime($date));
    $dayName  = $dayNames[$dayIndex];

    $sql = "
        SELECT
            cs.schedule_id,
            c.court_id,
            c.nama_lapangan,
            t.timeslot_id,
            t.start_time,
            t.end_time,
            t.duration,
            cs.day_name,
            cs.price,
            CASE
                WHEN bc.bookingcourts_id IS NOT NULL
                AND b.status NOT IN ('cancelled') THEN 'booked'
                ELSE 'available'
            END AS availability
        FROM court_schedule cs
        JOIN courts    c ON c.court_id    = cs.court_id
        JOIN timeslots t ON t.timeslot_id = cs.timeslot_id
        LEFT JOIN booking_courts bc ON bc.schedule_id = cs.schedule_id
                                    AND bc.play_date   = ?
        LEFT JOIN booking b ON b.booking_id = bc.booking_id
        WHERE cs.court_id  = ?
        AND cs.day_name  = ?
        AND cs.is_active = TRUE
        AND c.is_active  = TRUE
        AND t.is_active  = TRUE
        ORDER BY t.start_time
    ";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('sis', $date, $court_id, $dayName);
    $stmt->execute();
    $data = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    jsonResponse(['success' => true, 'date' => $date, 'day' => $dayName, 'data' => $data]);
}

//     GET: Semua jadwal (admin) 
if ($method === 'GET' && isset($_GET['all'])) {
    getAuthUser();
    $sql = "
        SELECT cs.*, c.nama_lapangan, t.start_time, t.end_time
        FROM court_schedule cs
        JOIN courts    c ON c.court_id    = cs.court_id
        JOIN timeslots t ON t.timeslot_id = cs.timeslot_id
        ORDER BY c.court_id, FIELD(cs.day_name,'Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'), t.start_time
    ";
    $result = $conn->query($sql);
    $data   = $result->fetch_all(MYSQLI_ASSOC);
    jsonResponse(['success' => true, 'data' => $data]);
}

//     POST: Tambah jadwal 
if ($method === 'POST') {
    getAuthUser();
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $required = ['court_id', 'timeslot_id', 'day_name', 'price'];
    foreach ($required as $f) {
        if (empty($body[$f])) jsonResponse(['success' => false, 'message' => "Field $f wajib diisi"], 400);
    }
    $stmt = $conn->prepare(
        "INSERT INTO court_schedule (court_id, timeslot_id, day_name, price) VALUES (?, ?, ?, ?)"
    );
    $stmt->bind_param('iisi', $body['court_id'], $body['timeslot_id'], $body['day_name'], $body['price']);
    $stmt->execute();
    jsonResponse(['success' => true, 'message' => 'Jadwal berhasil ditambahkan', 'schedule_id' => $conn->insert_id], 201);
}

//     PUT: Update jadwal 
if ($method === 'PUT') {
    getAuthUser();
    if (!$id) jsonResponse(['success' => false, 'message' => 'ID jadwal diperlukan'], 400);
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $stmt = $conn->prepare(
        "UPDATE court_schedule SET price = ?, is_active = ? WHERE schedule_id = ?"
    );
    $active = isset($body['is_active']) ? (int)$body['is_active'] : 1;
    $stmt->bind_param('iii', $body['price'], $active, $id);
    $stmt->execute();
    jsonResponse(['success' => true, 'message' => 'Jadwal berhasil diupdate']);
}

jsonResponse(['success' => false, 'message' => 'Parameter tidak lengkap atau method tidak diizinkan'], 400);
