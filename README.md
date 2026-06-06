# 🏸 Backend API - Sistem Sewa Lapangan Badminton

## Struktur Folder

```
badminton/              ← taruh di htdocs/badminton/
├── config/
│   └── database.php   ← konfigurasi DB + JWT helper
├── api/
│   ├── auth.php       ← register & login
│   ├── users.php      ← profil user
│   ├── courts.php     ← kelola lapangan
│   ├── timeslots.php  ← kelola slot waktu
│   ├── schedules.php  ← jadwal & ketersediaan
│   ├── bookings.php   ← pemesanan lapangan
│   └── payments.php   ← pembayaran
├── .htaccess
└── database.sql       ← import ke PHPMyAdmin
```

---

## ⚙️ Setup XAMPP

1. Buka **XAMPP Control Panel**, start **Apache** dan **MySQL**
2. Buka **PHPMyAdmin** → `http://localhost/phpmyadmin`
3. Klik **Import** → pilih file `database.sql` → klik **Go**
4. Copy folder `badminton/` ke `C:\xampp\htdocs\badminton\`
5. Test: buka `http://localhost/badminton/api/courts.php`

---

## 🔐 Autentikasi

Semua endpoint kecuali `GET courts`, `GET timeslots`, `GET schedules`, dan `auth` memerlukan header:

```
Authorization: Bearer <token>
```

Token didapat dari endpoint **login**.

---

## 📡 Dokumentasi API

### AUTH

| Method | URL | Deskripsi |
|--------|-----|-----------|
| POST | `/api/auth.php?action=register` | Daftar akun baru |
| POST | `/api/auth.php?action=login` | Login, dapat token |

**Register body:**
```json
{
  "nama_lengkap": "Budi Santoso",
  "nomor_handphone": "08123456789",
  "email": "budi@email.com",
  "password": "password123"
}
```

**Login body:**
```json
{
  "email": "budi@email.com",
  "password": "password123"
}
```

---

### COURTS (Lapangan)

| Method | URL | Deskripsi |
|--------|-----|-----------|
| GET | `/api/courts.php` | Semua lapangan aktif |
| GET | `/api/courts.php?id=1` | Detail lapangan |
| POST | `/api/courts.php` | Tambah lapangan 🔒 |
| PUT | `/api/courts.php?id=1` | Update lapangan 🔒 |
| DELETE | `/api/courts.php?id=1` | Nonaktifkan lapangan 🔒 |

---

### TIMESLOTS

| Method | URL | Deskripsi |
|--------|-----|-----------|
| GET | `/api/timeslots.php` | Semua timeslot aktif |
| POST | `/api/timeslots.php` | Tambah timeslot 🔒 |
| PUT | `/api/timeslots.php?id=1` | Update timeslot 🔒 |

---

### SCHEDULES (Jadwal & Ketersediaan)

| Method | URL | Deskripsi |
|--------|-----|-----------|
| GET | `/api/schedules.php?court_id=1&date=2026-06-10` | Cek jadwal + status |
| GET | `/api/schedules.php?all=1` | Semua jadwal 🔒 |
| POST | `/api/schedules.php` | Tambah jadwal 🔒 |
| PUT | `/api/schedules.php?id=1` | Update jadwal 🔒 |

**Response ketersediaan:**
```json
{
  "success": true,
  "date": "2026-06-10",
  "day": "Rabu",
  "data": [
    {
      "schedule_id": 1,
      "nama_lapangan": "Lapangan A",
      "start_time": "06:00:00",
      "end_time": "07:00:00",
      "price": 50000,
      "availability": "available"
    }
  ]
}
```

---

### BOOKINGS (Pemesanan)

| Method | URL | Deskripsi |
|--------|-----|-----------|
| GET | `/api/bookings.php` | Riwayat booking user 🔒 |
| GET | `/api/bookings.php?id=1` | Detail booking 🔒 |
| GET | `/api/bookings.php?all=1` | Semua booking (admin) 🔒 |
| POST | `/api/bookings.php` | Buat booking baru 🔒 |
| PUT | `/api/bookings.php?id=1` | Update status 🔒 |

**Buat booking body:**
```json
{
  "items": [
    { "schedule_id": 12, "play_date": "2026-06-10" },
    { "schedule_id": 13, "play_date": "2026-06-10" }
  ],
  "payment_method": "transfer"
}
```

**Status booking:** `pending` → `confirmed` → `completed` / `cancelled`

---

### PAYMENTS

| Method | URL | Deskripsi |
|--------|-----|-----------|
| GET | `/api/payments.php?booking_id=1` | Cek status bayar 🔒 |
| PUT | `/api/payments.php?id=1` | Verifikasi pembayaran 🔒 |

**Verifikasi body:**
```json
{ "status": "verified" }
```
Status: `pending` / `verified` / `failed`

---

### USERS (Profil)

| Method | URL | Deskripsi |
|--------|-----|-----------|
| GET | `/api/users.php` | Lihat profil 🔒 |
| PUT | `/api/users.php` | Update profil 🔒 |
| PUT | `/api/users.php?action=password` | Ganti password 🔒 |

---

## 🧪 Akun Dummy (untuk testing)

| Email | Password |
|-------|----------|
| budi@email.com | password123 |
| siti@email.com | password123 |
| ahmad@email.com | password123 |
| dewi@email.com | password123 |
| reza@email.com | password123 |

---
