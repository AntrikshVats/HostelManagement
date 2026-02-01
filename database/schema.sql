-- SmartHostel Database Schema
-- MySQL Database for Intelligent Attendance and Mess Management System

DROP DATABASE IF EXISTS smarthostel;
CREATE DATABASE smarthostel;
USE smarthostel;

-- =====================================================
-- STUDENTS TABLE
-- =====================================================
CREATE TABLE STUDENTS (
    student_id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(50) NOT NULL,
    middle_name VARCHAR(50),
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    roll_number VARCHAR(20) UNIQUE NOT NULL,
    department VARCHAR(100),
    year INT CHECK (year BETWEEN 1 AND 4),
    dietary_preference ENUM('Veg', 'Non-Veg', 'Protein', 'Jain') DEFAULT 'Veg',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_student_email (email),
    INDEX idx_student_roll (roll_number)
) ENGINE=InnoDB;

-- PHONE_NUMBERS TABLE (Multivalued attribute for STUDENTS)
CREATE TABLE PHONE_NUMBERS (
    phone_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    phone_number VARCHAR(15) NOT NULL,
    phone_type ENUM('Mobile', 'Home', 'Emergency') DEFAULT 'Mobile',
    FOREIGN KEY (student_id) REFERENCES STUDENTS(student_id) ON DELETE CASCADE,
    INDEX idx_phone_student (student_id)
) ENGINE=InnoDB;

-- =====================================================
-- EMPLOYEES TABLE
-- =====================================================
CREATE TABLE EMPLOYEES (
    ssn VARCHAR(11) PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    middle_name VARCHAR(50),
    last_name VARCHAR(50) NOT NULL,
    role ENUM('Admin', 'Warden', 'MessManager', 'Security') NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone_number VARCHAR(15),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_employee_email (email),
    INDEX idx_employee_role (role)
) ENGINE=InnoDB;

-- =====================================================
-- ROOMS TABLE
-- =====================================================
CREATE TABLE ROOMS (
    room_no VARCHAR(10) PRIMARY KEY,
    block VARCHAR(10) NOT NULL,
    floor INT NOT NULL,
    capacity INT NOT NULL DEFAULT 2,
    room_type ENUM('Single', 'Double', 'Triple', 'Quad') DEFAULT 'Double',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_room_block (block)
) ENGINE=InnoDB;

-- ROOM_ASSIGNMENTS TABLE (Many-to-Many between STUDENTS and ROOMS)
CREATE TABLE ROOM_ASSIGNMENTS (
    assignment_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    room_no VARCHAR(10) NOT NULL,
    assigned_date DATE NOT NULL,
    vacated_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (student_id) REFERENCES STUDENTS(student_id) ON DELETE CASCADE,
    FOREIGN KEY (room_no) REFERENCES ROOMS(room_no) ON DELETE CASCADE,
    INDEX idx_assignment_student (student_id),
    INDEX idx_assignment_room (room_no),
    INDEX idx_assignment_active (is_active)
) ENGINE=InnoDB;

-- =====================================================
-- ATTENDANCE TABLE
-- =====================================================
CREATE TABLE ATTENDANCE (
    attendance_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    type ENUM('IN', 'OUT') NOT NULL,
    remarks VARCHAR(255),
    location VARCHAR(50) DEFAULT 'Main Gate',
    verified_by VARCHAR(11),
    FOREIGN KEY (student_id) REFERENCES STUDENTS(student_id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES EMPLOYEES(ssn) ON DELETE SET NULL,
    INDEX idx_attendance_student (student_id),
    INDEX idx_attendance_timestamp (timestamp),
    INDEX idx_attendance_type (type),
    INDEX idx_attendance_student_time (student_id, timestamp)
) ENGINE=InnoDB;

-- =====================================================
-- MENU POOLS TABLE
-- =====================================================
CREATE TABLE MENU_POOLS (
    pool_id INT PRIMARY KEY AUTO_INCREMENT,
    day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
    meal_time ENUM('Breakfast', 'Lunch', 'Dinner', 'Snacks') NOT NULL,
    meal_category ENUM('Veg', 'Non-Veg', 'Protein', 'Jain') DEFAULT 'Veg',
    effective_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_menu_day (day_of_week),
    INDEX idx_menu_meal (meal_time),
    UNIQUE KEY unique_menu (day_of_week, meal_time, meal_category)
) ENGINE=InnoDB;

-- MENU_ITEMS TABLE (Multivalued attribute for MENU_POOLS)
CREATE TABLE MENU_ITEMS (
    item_id INT PRIMARY KEY AUTO_INCREMENT,
    pool_id INT NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    item_description TEXT,
    calories INT,
    is_available BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (pool_id) REFERENCES MENU_POOLS(pool_id) ON DELETE CASCADE,
    INDEX idx_menu_item_pool (pool_id)
) ENGINE=InnoDB;

-- =====================================================
-- OPT_OUT TABLE
-- =====================================================
CREATE TABLE OPT_OUT (
    opt_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    date DATE NOT NULL,
    meal_time ENUM('Breakfast', 'Lunch', 'Dinner', 'Snacks') NOT NULL,
    opt ENUM('Y', 'N') NOT NULL DEFAULT 'N',
    reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES STUDENTS(student_id) ON DELETE CASCADE,
    INDEX idx_optout_student (student_id),
    INDEX idx_optout_date (date),
    INDEX idx_optout_meal (meal_time),
    INDEX idx_optout_student_date (student_id, date),
    UNIQUE KEY unique_optout (student_id, date, meal_time)
) ENGINE=InnoDB;

-- =====================================================
-- ANALYTICS CACHE TABLE (For Performance)
-- =====================================================
CREATE TABLE ANALYTICS_CACHE (
    cache_id INT PRIMARY KEY AUTO_INCREMENT,
    cache_key VARCHAR(100) UNIQUE NOT NULL,
    cache_data JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    INDEX idx_cache_key (cache_key),
    INDEX idx_cache_expires (expires_at)
) ENGINE=InnoDB;

-- =====================================================
-- QR TOKENS TABLE (For Time-Limited QR Codes)
-- =====================================================
CREATE TABLE QR_TOKENS (
    token_id INT PRIMARY KEY AUTO_INCREMENT,
    token_value VARCHAR(255) UNIQUE NOT NULL,
    student_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (student_id) REFERENCES STUDENTS(student_id) ON DELETE CASCADE,
    INDEX idx_qr_token (token_value),
    INDEX idx_qr_student (student_id),
    INDEX idx_qr_expires (expires_at)
) ENGINE=InnoDB;

-- =====================================================
-- VIOLATIONS TABLE (Track Curfew and Policy Violations)
-- =====================================================
CREATE TABLE VIOLATIONS (
    violation_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    violation_type ENUM('Curfew', 'Frequent_Absence', 'Multiple_OUT', 'Other') NOT NULL,
    violation_date DATE NOT NULL,
    description TEXT,
    severity ENUM('Low', 'Medium', 'High') DEFAULT 'Low',
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by VARCHAR(11),
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES STUDENTS(student_id) ON DELETE CASCADE,
    FOREIGN KEY (resolved_by) REFERENCES EMPLOYEES(ssn) ON DELETE SET NULL,
    INDEX idx_violation_student (student_id),
    INDEX idx_violation_date (violation_date),
    INDEX idx_violation_type (violation_type),
    INDEX idx_violation_resolved (resolved)
) ENGINE=InnoDB;

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View: Current Room Assignments
CREATE VIEW current_room_assignments AS
SELECT 
    ra.assignment_id,
    s.student_id,
    s.first_name,
    s.last_name,
    s.roll_number,
    r.room_no,
    r.block,
    r.floor,
    ra.assigned_date
FROM ROOM_ASSIGNMENTS ra
JOIN STUDENTS s ON ra.student_id = s.student_id
JOIN ROOMS r ON ra.room_no = r.room_no
WHERE ra.is_active = TRUE;

-- View: Latest Attendance Status
CREATE VIEW latest_attendance_status AS
SELECT 
    s.student_id,
    s.first_name,
    s.last_name,
    s.roll_number,
    a.type AS current_status,
    a.timestamp AS last_updated,
    a.location
FROM STUDENTS s
LEFT JOIN ATTENDANCE a ON s.student_id = a.student_id
WHERE a.attendance_id = (
    SELECT MAX(attendance_id) 
    FROM ATTENDANCE 
    WHERE student_id = s.student_id
);

-- View: Daily Mess Summary
CREATE VIEW daily_mess_summary AS
SELECT 
    date,
    meal_time,
    COUNT(*) AS total_students,
    SUM(CASE WHEN opt = 'Y' THEN 1 ELSE 0 END) AS opted_out,
    COUNT(*) - SUM(CASE WHEN opt = 'Y' THEN 1 ELSE 0 END) AS expected_count
FROM OPT_OUT
GROUP BY date, meal_time;

-- =====================================================
-- STORED PROCEDURES
-- =====================================================

DELIMITER //

-- Procedure: Mark Attendance
CREATE PROCEDURE mark_attendance(
    IN p_student_id INT,
    IN p_type ENUM('IN', 'OUT'),
    IN p_location VARCHAR(50),
    IN p_verified_by VARCHAR(11)
)
BEGIN
    INSERT INTO ATTENDANCE (student_id, type, location, verified_by)
    VALUES (p_student_id, p_type, p_location, p_verified_by);
END //

-- Procedure: Get Monthly Attendance Percentage
CREATE PROCEDURE get_monthly_attendance(
    IN p_student_id INT,
    IN p_year INT,
    IN p_month INT,
    OUT p_percentage DECIMAL(5,2)
)
BEGIN
    DECLARE total_days INT;
    DECLARE present_days INT;
    
    SET total_days = DAY(LAST_DAY(CONCAT(p_year, '-', p_month, '-01')));
    
    SELECT COUNT(DISTINCT DATE(timestamp))
    INTO present_days
    FROM ATTENDANCE
    WHERE student_id = p_student_id
    AND YEAR(timestamp) = p_year
    AND MONTH(timestamp) = p_month
    AND type = 'IN';
    
    SET p_percentage = (present_days / total_days) * 100;
END //

DELIMITER ;

-- =====================================================
-- TRIGGERS
-- =====================================================

DELIMITER //

-- Trigger: Clean expired QR tokens
CREATE TRIGGER clean_expired_qr_tokens
BEFORE INSERT ON QR_TOKENS
FOR EACH ROW
BEGIN
    DELETE FROM QR_TOKENS WHERE expires_at < NOW();
END //

DELIMITER ;

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert default admin account
INSERT INTO EMPLOYEES (ssn, first_name, last_name, role, email, password_hash, phone_number)
VALUES ('000-00-0000', 'System', 'Admin', 'Admin', 'admin@smarthostel.com', 
        '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzOBbXMXuK', '9999999999');
-- Password: admin123

-- Create sample rooms
INSERT INTO ROOMS (room_no, block, floor, capacity, room_type) VALUES
('A101', 'A', 1, 2, 'Double'),
('A102', 'A', 1, 2, 'Double'),
('A103', 'A', 1, 3, 'Triple'),
('A201', 'A', 2, 2, 'Double'),
('A202', 'A', 2, 2, 'Double'),
('B101', 'B', 1, 2, 'Double'),
('B102', 'B', 1, 2, 'Double'),
('B103', 'B', 1, 1, 'Single'),
('B201', 'B', 2, 4, 'Quad'),
('B202', 'B', 2, 2, 'Double');

-- Sample menu pools
INSERT INTO MENU_POOLS (day_of_week, meal_time, meal_category) VALUES
('Monday', 'Breakfast', 'Veg'),
('Monday', 'Lunch', 'Veg'),
('Monday', 'Lunch', 'Non-Veg'),
('Monday', 'Dinner', 'Veg'),
('Monday', 'Dinner', 'Non-Veg'),
('Tuesday', 'Breakfast', 'Veg'),
('Tuesday', 'Lunch', 'Veg'),
('Tuesday', 'Dinner', 'Veg'),
('Wednesday', 'Breakfast', 'Veg'),
('Wednesday', 'Lunch', 'Veg'),
('Wednesday', 'Dinner', 'Veg'),
('Thursday', 'Breakfast', 'Veg'),
('Thursday', 'Lunch', 'Veg'),
('Thursday', 'Dinner', 'Veg'),
('Friday', 'Breakfast', 'Veg'),
('Friday', 'Lunch', 'Veg'),
('Friday', 'Dinner', 'Veg');

-- Sample menu items
INSERT INTO MENU_ITEMS (pool_id, item_name, item_description, calories) VALUES
(1, 'Idli Sambar', 'Steamed rice cakes with lentil soup', 250),
(1, 'Coffee', 'Hot coffee', 50),
(2, 'Dal Rice', 'Yellow lentils with steamed rice', 400),
(2, 'Chapati', 'Whole wheat flatbread', 150),
(3, 'Chicken Curry', 'Spicy chicken curry with rice', 550),
(4, 'Paneer Butter Masala', 'Cottage cheese in tomato gravy', 450),
(4, 'Roti', 'Indian flatbread', 140),
(5, 'Fish Fry', 'Crispy fried fish', 350);

COMMIT;
