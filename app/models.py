from sqlalchemy import (
    Column, Integer, String, Boolean, Date, DateTime,
    ForeignKey, Enum, Text, Float, JSON, LargeBinary, and_
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


# =====================================================
# ENUMS
# =====================================================

class UserRole(str, enum.Enum):
    STUDENT = "Student"
    ADMIN = "Admin"
    WARDEN = "Warden"
    MESS_MANAGER = "MessManager"
    SECURITY = "Security"


class AttendanceType(str, enum.Enum):
    IN = "IN"
    OUT = "OUT"


class MealTime(str, enum.Enum):
    BREAKFAST = "Breakfast"
    LUNCH = "Lunch"
    DINNER = "Dinner"
    SNACKS = "Snacks"


class DietaryPreference(str, enum.Enum):
    VEG = "Veg"
    NON_VEG = "Non-Veg"
    PROTEIN = "Protein"
    JAIN = "Jain"


class DayOfWeek(str, enum.Enum):
    MONDAY = "Monday"
    TUESDAY = "Tuesday"
    WEDNESDAY = "Wednesday"
    THURSDAY = "Thursday"
    FRIDAY = "Friday"
    SATURDAY = "Saturday"
    SUNDAY = "Sunday"


class RoomType(str, enum.Enum):
    SINGLE = "Single"
    DOUBLE = "Double"
    TRIPLE = "Triple"
    QUAD = "Quad"


class ViolationType(str, enum.Enum):
    CURFEW = "Curfew"
    FREQUENT_ABSENCE = "Frequent_Absence"
    MULTIPLE_OUT = "Multiple_OUT"
    OTHER = "Other"


class ViolationSeverity(str, enum.Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"


# =====================================================
# MODELS
# =====================================================

class Student(Base):
    __tablename__ = "STUDENTS"
    
    student_id = Column(Integer, primary_key=True, autoincrement=True)
    first_name = Column(String(50), nullable=False)
    middle_name = Column(String(50))
    last_name = Column(String(50), nullable=False)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    roll_number = Column(String(20), unique=True, nullable=False, index=True)
    department = Column(String(100))
    year = Column(Integer)
    dietary_preference = Column(Enum(DietaryPreference), default=DietaryPreference.VEG)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    phone_numbers = relationship("PhoneNumber", back_populates="student", cascade="all, delete-orphan")
    attendance_records = relationship("Attendance", back_populates="student", cascade="all, delete-orphan")
    room_assignments = relationship("RoomAssignment", back_populates="student", cascade="all, delete-orphan")
    opt_outs = relationship("OptOut", back_populates="student", cascade="all, delete-orphan")
    qr_tokens = relationship("QRToken", back_populates="student", cascade="all, delete-orphan")
    violations = relationship("Violation", back_populates="student", cascade="all, delete-orphan")


class PhoneNumber(Base):
    __tablename__ = "PHONE_NUMBERS"
    
    phone_id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("STUDENTS.student_id", ondelete="CASCADE"), nullable=False, index=True)
    phone_number = Column(String(15), nullable=False)
    phone_type = Column(Enum("Mobile", "Home", "Emergency", name="phone_type_enum"), default="Mobile")
    
    # Relationships
    student = relationship("Student", back_populates="phone_numbers")


class Employee(Base):
    __tablename__ = "EMPLOYEES"
    
    ssn = Column(String(11), primary_key=True)
    first_name = Column(String(50), nullable=False)
    middle_name = Column(String(50))
    last_name = Column(String(50), nullable=False)
    role = Column(Enum(UserRole), nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    phone_number = Column(String(15))
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    verified_attendance = relationship("Attendance", back_populates="verifier")
    resolved_violations = relationship("Violation", back_populates="resolver")


class Room(Base):
    __tablename__ = "ROOMS"
    
    room_no = Column(String(10), primary_key=True)
    block = Column(String(10), nullable=False, index=True)
    floor = Column(Integer, nullable=False)
    capacity = Column(Integer, nullable=False, default=2)
    room_type = Column(Enum(RoomType), default=RoomType.DOUBLE)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    assignments = relationship("RoomAssignment", back_populates="room", cascade="all, delete-orphan")


class RoomAssignment(Base):
    __tablename__ = "ROOM_ASSIGNMENTS"
    
    assignment_id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("STUDENTS.student_id", ondelete="CASCADE"), nullable=False, index=True)
    room_no = Column(String(10), ForeignKey("ROOMS.room_no", ondelete="CASCADE"), nullable=False, index=True)
    assigned_date = Column(Date, nullable=False)
    vacated_date = Column(Date)
    is_active = Column(Boolean, default=True, index=True)
    
    # Relationships
    student = relationship("Student", back_populates="room_assignments")
    room = relationship("Room", back_populates="assignments")


class Attendance(Base):
    __tablename__ = "ATTENDANCE"
    
    attendance_id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("STUDENTS.student_id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, server_default=func.now(), index=True)
    type = Column(Enum(AttendanceType), nullable=False, index=True)
    remarks = Column(String(255))
    location = Column(String(50), default="Main Gate")
    verified_by = Column(String(11), ForeignKey("EMPLOYEES.ssn", ondelete="SET NULL"))
    
    # Relationships
    student = relationship("Student", back_populates="attendance_records")
    verifier = relationship("Employee", back_populates="verified_attendance")


class MenuPool(Base):
    __tablename__ = "MENU_POOLS"
    
    pool_id = Column(Integer, primary_key=True, autoincrement=True)
    day_of_week = Column(Enum(DayOfWeek), nullable=False, index=True)
    meal_time = Column(Enum(MealTime), nullable=False, index=True)
    meal_category = Column(Enum(DietaryPreference), default=DietaryPreference.VEG)
    effective_date = Column(Date)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    menu_items = relationship("MenuItem", back_populates="menu_pool", cascade="all, delete-orphan")


class MenuItem(Base):
    __tablename__ = "MENU_ITEMS"
    
    item_id = Column(Integer, primary_key=True, autoincrement=True)
    pool_id = Column(Integer, ForeignKey("MENU_POOLS.pool_id", ondelete="CASCADE"), nullable=False, index=True)
    item_name = Column(String(100), nullable=False)
    item_description = Column(Text)
    calories = Column(Integer)
    is_available = Column(Boolean, default=True)
    
    # Relationships
    menu_pool = relationship("MenuPool", back_populates="menu_items")


class OptOut(Base):
    __tablename__ = "OPT_OUT"
    
    opt_id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("STUDENTS.student_id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    meal_time = Column(Enum(MealTime), nullable=False, index=True)
    opt = Column(Enum("Y", "N", name="opt_enum"), nullable=False, default="N")
    reason = Column(String(255))
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    student = relationship("Student", back_populates="opt_outs")


class AnalyticsCache(Base):
    __tablename__ = "ANALYTICS_CACHE"
    
    cache_id = Column(Integer, primary_key=True, autoincrement=True)
    cache_key = Column(String(100), unique=True, nullable=False, index=True)
    cache_data = Column(JSON, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    expires_at = Column(DateTime, nullable=False, index=True)


class QRToken(Base):
    __tablename__ = "QR_TOKENS"
    
    token_id = Column(Integer, primary_key=True, autoincrement=True)
    token_value = Column(String(255), unique=True, nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("STUDENTS.student_id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, server_default=func.now())
    expires_at = Column(DateTime, nullable=False, index=True)
    is_used = Column(Boolean, default=False)
    
    # Relationships
    student = relationship("Student", back_populates="qr_tokens")


class Violation(Base):
    __tablename__ = "VIOLATIONS"
    
    violation_id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("STUDENTS.student_id", ondelete="CASCADE"), nullable=False, index=True)
    violation_type = Column(Enum(ViolationType), nullable=False, index=True)
    violation_date = Column(Date, nullable=False, index=True)
    description = Column(Text)
    severity = Column(Enum(ViolationSeverity), default=ViolationSeverity.LOW)
    resolved = Column(Boolean, default=False, index=True)
    resolved_by = Column(String(11), ForeignKey("EMPLOYEES.ssn", ondelete="SET NULL"))
    resolved_at = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    student = relationship("Student", back_populates="violations")
    resolver = relationship("Employee", back_populates="resolved_violations")


class StudentFace(Base):
    __tablename__ = "STUDENT_FACES"
    
    face_id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("STUDENTS.student_id", ondelete="CASCADE"), nullable=False, index=True)
    image_data = Column(LargeBinary(length=(2**24)-1), nullable=False) # MediumBlob equivalent
    encoding = Column(JSON, nullable=True) # To store face encoding vector if we use a library
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    student = relationship("Student", backref="faces")
