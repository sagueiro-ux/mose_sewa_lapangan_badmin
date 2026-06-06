-- ============================================================
-- DATABASE: Badminton Court Rental System
-- Compatible with: PHPMyAdmin + XAMPP (MySQL)
-- ============================================================

CREATE DATABASE IF NOT EXISTS badminton_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE badminton_db;
CREATE TABLE `booking` (
  `booking_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `booking_date` date NOT NULL,
  `total_price` int(11) NOT NULL,
  `status` varchar(25) NOT NULL DEFAULT 'pending' COMMENT 'pending, confirmed, cancelled, completed',
  `created_at` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `booking`
--

INSERT INTO `booking` (`booking_id`, `user_id`, `booking_date`, `total_price`, `status`, `created_at`) VALUES
(1, 1, '2026-06-01', 100000, 'confirmed', '2026-06-01'),
(2, 2, '2026-06-01', 50000, 'confirmed', '2026-06-01'),
(3, 3, '2026-06-01', 50000, 'confirmed', '2026-06-01'),
(4, 4, '2026-06-02', 100000, 'confirmed', '2026-06-02'),
(5, 5, '2026-06-02', 100000, 'confirmed', '2026-06-02'),
(6, 1, '2026-06-07', 100000, 'confirmed', '2026-06-02'),
(7, 2, '2026-06-08', 50000, 'confirmed', '2026-06-02'),
(8, 2, '2026-06-06', 100000, 'confirmed', '2026-06-05');

-- --------------------------------------------------------

--
-- Table structure for table `booking_courts`
--

CREATE TABLE `booking_courts` (
  `bookingcourts_id` int(11) NOT NULL,
  `booking_id` int(11) NOT NULL,
  `schedule_id` int(11) NOT NULL,
  `play_date` date NOT NULL,
  `price` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `booking_courts`
--

INSERT INTO `booking_courts` (`bookingcourts_id`, `booking_id`, `schedule_id`, `play_date`, `price`) VALUES
(1, 1, 12, '2026-06-01', 50000),
(2, 1, 13, '2026-06-01', 50000),
(3, 2, 1, '2026-06-02', 50000),
(4, 3, 34, '2026-06-03', 50000),
(5, 4, 16, '2026-06-04', 50000),
(6, 4, 17, '2026-06-04', 50000),
(7, 5, 41, '2026-06-05', 50000),
(8, 6, 12, '2026-06-07', 50000),
(9, 6, 13, '2026-06-07', 80000),
(10, 7, 34, '2026-06-08', 50000),
(11, 8, 32, '2026-06-06', 50000),
(12, 8, 33, '2026-06-06', 50000);

-- --------------------------------------------------------

--
-- Table structure for table `courts`
--

CREATE TABLE `courts` (
  `court_id` int(11) NOT NULL,
  `nama_lapangan` varchar(100) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `courts`
--

INSERT INTO `courts` (`court_id`, `nama_lapangan`, `is_active`) VALUES
(1, 'Lapangan A', 1),
(2, 'Lapangan B', 1),
(3, 'Lapangan C', 1),
(4, 'Lapangan D', 1);

-- --------------------------------------------------------

--
-- Table structure for table `court_schedule`
--

CREATE TABLE `court_schedule` (
  `schedule_id` int(11) NOT NULL,
  `court_id` int(11) NOT NULL,
  `timeslot_id` int(11) NOT NULL,
  `day_name` varchar(30) NOT NULL,
  `price` int(11) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `court_schedule`
--

INSERT INTO `court_schedule` (`schedule_id`, `court_id`, `timeslot_id`, `day_name`, `price`, `is_active`) VALUES
(1, 1, 1, 'Senin', 50000, 1),
(2, 1, 2, 'Senin', 50000, 1),
(3, 1, 3, 'Senin', 50000, 1),
(4, 1, 4, 'Senin', 50000, 1),
(5, 1, 5, 'Senin', 50000, 1),
(6, 1, 6, 'Senin', 50000, 1),
(7, 1, 7, 'Senin', 50000, 1),
(8, 1, 8, 'Senin', 50000, 1),
(9, 1, 9, 'Senin', 50000, 1),
(10, 1, 10, 'Senin', 50000, 1),
(11, 1, 11, 'Senin', 50000, 1),
(12, 1, 12, 'Senin', 50000, 1),
(13, 1, 13, 'Senin', 50000, 1),
(14, 1, 14, 'Senin', 50000, 1),
(15, 1, 15, 'Senin', 50000, 1),
(16, 1, 1, 'Selasa', 50000, 1),
(17, 1, 2, 'Selasa', 50000, 1),
(18, 1, 3, 'Selasa', 50000, 1),
(19, 1, 12, 'Selasa', 50000, 1),
(20, 1, 13, 'Selasa', 50000, 1),
(21, 1, 14, 'Selasa', 50000, 1),
(22, 1, 1, 'Rabu', 50000, 1),
(23, 1, 2, 'Rabu', 50000, 1),
(24, 1, 12, 'Rabu', 50000, 1),
(25, 1, 1, 'Kamis', 50000, 1),
(26, 1, 12, 'Kamis', 50000, 1),
(27, 1, 13, 'Kamis', 50000, 1),
(28, 1, 1, 'Jumat', 50000, 1),
(29, 1, 12, 'Jumat', 50000, 1),
(30, 1, 13, 'Jumat', 50000, 1),
(31, 1, 1, 'Sabtu', 50000, 1),
(32, 1, 2, 'Sabtu', 50000, 1),
(33, 1, 3, 'Sabtu', 50000, 1),
(34, 1, 12, 'Sabtu', 50000, 1),
(35, 1, 13, 'Sabtu', 50000, 1),
(36, 1, 14, 'Sabtu', 50000, 1),
(37, 1, 1, 'Minggu', 50000, 1),
(38, 1, 2, 'Minggu', 50000, 1),
(39, 1, 12, 'Minggu', 50000, 1),
(40, 2, 1, 'Senin', 50000, 1),
(41, 2, 12, 'Senin', 50000, 1),
(42, 2, 13, 'Senin', 50000, 1),
(43, 2, 1, 'Selasa', 50000, 1),
(44, 2, 12, 'Selasa', 50000, 1),
(45, 2, 1, 'Sabtu', 50000, 1),
(46, 2, 12, 'Sabtu', 50000, 1),
(47, 2, 13, 'Sabtu', 50000, 1),
(48, 2, 1, 'Minggu', 50000, 1),
(49, 2, 12, 'Minggu', 50000, 1),
(50, 3, 1, 'Senin', 50000, 1),
(51, 3, 12, 'Senin', 50000, 1),
(52, 3, 1, 'Sabtu', 50000, 1),
(53, 3, 12, 'Sabtu', 50000, 1),
(54, 4, 1, 'Senin', 50000, 1),
(55, 4, 12, 'Senin', 50000, 1),
(56, 4, 1, 'Sabtu', 50000, 1),
(57, 4, 12, 'Sabtu', 50000, 1);

-- --------------------------------------------------------

--
-- Table structure for table `payment`
--

CREATE TABLE `payment` (
  `payment_id` int(11) NOT NULL,
  `booking_id` int(11) NOT NULL,
  `payment_method` varchar(30) NOT NULL COMMENT 'transfer, cash, qris',
  `payment_date` date NOT NULL,
  `amount` int(11) NOT NULL,
  `status` varchar(25) NOT NULL DEFAULT 'pending' COMMENT 'pending, verified, failed'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payment`
--

INSERT INTO `payment` (`payment_id`, `booking_id`, `payment_method`, `payment_date`, `amount`, `status`) VALUES
(1, 1, 'transfer', '2026-05-30', 100000, 'Verified'),
(2, 2, 'qris', '2026-05-31', 50000, 'Verified'),
(3, 3, 'transfer', '2026-06-01', 50000, 'Verified'),
(4, 4, 'cash', '2026-06-02', 100000, 'Verified'),
(5, 5, 'transfer', '2026-06-03', 100000, 'Pending'),
(6, 6, 'qris', '2026-06-05', 100000, 'Verified'),
(7, 7, 'transfer', '2026-06-06', 50000, 'Pending'),
(8, 8, 'transfer', '2026-06-05', 100000, 'Verified');

-- --------------------------------------------------------

--
-- Table structure for table `timeslots`
--

CREATE TABLE `timeslots` (
  `timeslot_id` int(11) NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `duration` int(11) NOT NULL COMMENT 'in minutes',
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `timeslots`
--

INSERT INTO `timeslots` (`timeslot_id`, `start_time`, `end_time`, `duration`, `is_active`) VALUES
(1, '06:00:00', '07:00:00', 60, 1),
(2, '07:00:00', '08:00:00', 60, 1),
(3, '08:00:00', '09:00:00', 60, 1),
(4, '09:00:00', '10:00:00', 60, 1),
(5, '10:00:00', '11:00:00', 60, 1),
(6, '11:00:00', '12:00:00', 60, 1),
(7, '13:00:00', '14:00:00', 60, 1),
(8, '14:00:00', '15:00:00', 60, 1),
(9, '15:00:00', '16:00:00', 60, 1),
(10, '16:00:00', '17:00:00', 60, 1),
(11, '17:00:00', '18:00:00', 60, 1),
(12, '18:00:00', '19:00:00', 60, 1),
(13, '19:00:00', '20:00:00', 60, 1),
(14, '20:00:00', '21:00:00', 60, 1),
(15, '21:00:00', '22:00:00', 60, 1);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `nama_lengkap` varchar(100) NOT NULL,
  `nomor_handphone` varchar(25) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(200) NOT NULL,
  `foto_profil` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `nama_lengkap`, `nomor_handphone`, `email`, `password`, `foto_profil`) VALUES
(1, 'Timothy Japira', '081234567890', 'timot123@gmail.com', '$2y$10$ZDYM8CB5VToQEVxEKrS9Cu2gh24Kz5WkXKBV1wCiDkDi49.mug5lO', NULL),
(2, 'Sean Agueiro', '08234567892', 'sean2007@gmail.com', '$2y$10$jiue/U4fR0NT71VrLWbUNu3UtBScr3CvPLdMlOnNL7Tt.kpdZebgC', NULL),
(3, 'Reynaldo Dendy', '081234567894', 'reyna@gmail.com', '$2y$10$RCnwouDkAKWjSKtlacjej.hFNM6v0QEMSlJyNdTXJUDleTazjnrPK', NULL),
(4, 'Daveniel Jesson', '081234567896', 'djesson@gmail.com', '$2y$10$1NXVijjoS4BWuHaq1bhH7uB5QMqAJ2aW/PgJ2Ihp0611STYpld1/m', NULL),
(5, 'Ken', '081234567896', 'keken08@gmail.com', '$2y$10$.D93SvcbGoo2oKTs0lOsQ.DWlb4qs7tdH0B6rNKCOQjYo1YCm2Huu', NULL),
(6, 'Budi Santoso', '085151214180', 'budi@email.com', '$2y$10$r5iBELAFzYBbbgO1/QbnKe50dNwANk8HoPQKZrYtnPwTPcHZLWHB.', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `booking`
--
ALTER TABLE `booking`
  ADD PRIMARY KEY (`booking_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `booking_courts`
--
ALTER TABLE `booking_courts`
  ADD PRIMARY KEY (`bookingcourts_id`),
  ADD KEY `booking_id` (`booking_id`),
  ADD KEY `schedule_id` (`schedule_id`);

--
-- Indexes for table `courts`
--
ALTER TABLE `courts`
  ADD PRIMARY KEY (`court_id`);

--
-- Indexes for table `court_schedule`
--
ALTER TABLE `court_schedule`
  ADD PRIMARY KEY (`schedule_id`),
  ADD KEY `court_id` (`court_id`),
  ADD KEY `timeslot_id` (`timeslot_id`);

--
-- Indexes for table `payment`
--
ALTER TABLE `payment`
  ADD PRIMARY KEY (`payment_id`),
  ADD KEY `booking_id` (`booking_id`);

--
-- Indexes for table `timeslots`
--
ALTER TABLE `timeslots`
  ADD PRIMARY KEY (`timeslot_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `booking`
--
ALTER TABLE `booking`
  MODIFY `booking_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `booking_courts`
--
ALTER TABLE `booking_courts`
  MODIFY `bookingcourts_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `courts`
--
ALTER TABLE `courts`
  MODIFY `court_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `court_schedule`
--
ALTER TABLE `court_schedule`
  MODIFY `schedule_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=58;

--
-- AUTO_INCREMENT for table `payment`
--
ALTER TABLE `payment`
  MODIFY `payment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `timeslots`
--
ALTER TABLE `timeslots`
  MODIFY `timeslot_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `booking`
--
ALTER TABLE `booking`
  ADD CONSTRAINT `booking_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `booking_courts`
--
ALTER TABLE `booking_courts`
  ADD CONSTRAINT `booking_courts_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `booking` (`booking_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `booking_courts_ibfk_2` FOREIGN KEY (`schedule_id`) REFERENCES `court_schedule` (`schedule_id`) ON DELETE CASCADE;

--
-- Constraints for table `court_schedule`
--
ALTER TABLE `court_schedule`
  ADD CONSTRAINT `court_schedule_ibfk_1` FOREIGN KEY (`court_id`) REFERENCES `courts` (`court_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `court_schedule_ibfk_2` FOREIGN KEY (`timeslot_id`) REFERENCES `timeslots` (`timeslot_id`) ON DELETE CASCADE;

--
-- Constraints for table `payment`
--
ALTER TABLE `payment`
  ADD CONSTRAINT `payment_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `booking` (`booking_id`) ON DELETE CASCADE;
COMMIT;
