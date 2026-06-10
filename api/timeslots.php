<?php

// api/timeslots.php
// GET  /api/timeslots.php       → semua timeslot aktif
// POST /api/timeslots.php       → tambah timeslot (admin)
// PUT  /api/timeslots.php?id=1  → update timeslot (admin)

require_once '../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];
$conn   = getConnection();

if ($method === 'GET') {
    $result = $conn->query("SELECT * FROM timeslots WHERE is_active = TRUE ORDER BY start_time");
    $data   = $result->fetch_all(MYSQLI_ASSOC);
    jsonResponse(['success' => true, 'data' => $data]);
}

if ($method === 'POST') {
    getAuthUser();
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    foreach (['start_time','end_time','duration'] as $f) {
        if (empty($body[$f])) jsonResponse(['success' => false, 'message' => "Field $f wajib diisi"], 400);
    }
    $stmt = $conn->prepare("INSERT INTO timeslots (start_time, end_time, duration) VALUES (?, ?, ?)");
    $stmt->bind_param('ssi', $body['start_time'], $body['end_time'], $body['duration']);
    $stmt->execute();
    jsonResponse(['success' => true, 'message' => 'Timeslot berhasil ditambahkan', 'timeslot_id' => $conn->insert_id], 201);
}

if ($method === 'PUT') {
    getAuthUser();
    $id   = isset($_GET['id']) ? (int)$_GET['id'] : null;
    if (!$id) jsonResponse(['success' => false, 'message' => 'ID timeslot diperlukan'], 400);
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $active = isset($body['is_active']) ? (int)$body['is_active'] : 1;
    $stmt = $conn->prepare("UPDATE timeslots SET start_time=?, end_time=?, duration=?, is_active=? WHERE timeslot_id=?");
    $stmt->bind_param('ssiii', $body['start_time'], $body['end_time'], $body['duration'], $active, $id);
    $stmt->execute();
    jsonResponse(['success' => true, 'message' => 'Timeslot berhasil diupdate']);
}

jsonResponse(['success' => false, 'message' => 'Method tidak diizinkan'], 405);
