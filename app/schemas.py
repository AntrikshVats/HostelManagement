from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, date
from app.models import UserRole, AttendanceType, MealTime, DietaryPreference, ViolationType, ViolationSeverity


# =====================================================
# AUTH SCHEMAS
# =====================================================

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    middle_name: Optional[str] = None
    last_name: str
    roll_number: Optional[str] = None
    department: Optional[str] = None
    year: Optional[int] = Field(None, ge=1, le=4)
    role: UserRole = UserRole.STUDENT
    ssn: Optional[str] = None  # For employees


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    role: str


class UserResponse(BaseModel):
    id: int
    email: str
    first_name: str
    last_name: str
    role: str
    
    class Config:
        from_attributes = True


# =====================================================
# STUDENT SCHEMAS
# =====================================================

class PhoneNumberCreate(BaseModel):
    phone_number: str
    phone_type: str = "Mobile"


class PhoneNumberResponse(BaseModel):
    phone_id: int
    phone_number: str
    phone_type: str
    
    class Config:
        from_attributes = True


class StudentCreate(BaseModel):
    first_name: str
    middle_name: Optional[str] = None
    last_name: str
    email: EmailStr
    password: str
    roll_number: str
    department: Optional[str] = None
    year: Optional[int] = Field(None, ge=1, le=4)
    dietary_preference: DietaryPreference = DietaryPreference.VEG
    phone_numbers: List[PhoneNumberCreate] = []


class StudentRegistrationRequest(StudentCreate):
    room_no: str


class StudentResponse(BaseModel):
    student_id: int
    first_name: str
    middle_name: Optional[str]
    last_name: str
    email: str
    roll_number: str
    department: Optional[str]
    year: Optional[int]
    dietary_preference: str
    room_no: Optional[str] = None
    block: Optional[str] = None
    phone_numbers: List[PhoneNumberResponse] = []
    
    class Config:
        from_attributes = True


class StudentUpdate(BaseModel):
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    last_name: Optional[str] = None
    department: Optional[str] = None
    year: Optional[int] = None
    dietary_preference: Optional[DietaryPreference] = None


# =====================================================
# ATTENDANCE SCHEMAS
# =====================================================

class AttendanceCreate(BaseModel):
    student_id: int
    type: AttendanceType
    remarks: Optional[str] = None
    location: str = "Main Gate"


class AttendanceRecord(BaseModel):
    attendance_id: int
    student_id: int
    timestamp: datetime
    type: str
    remarks: Optional[str]
    location: str
    roll_number: Optional[str] = None
    student_name: Optional[str] = None
    
    class Config:
        from_attributes = True


class AttendanceStats(BaseModel):
    student_id: int
    total_records: int
    in_count: int
    out_count: int
    current_status: Optional[str]
    last_updated: Optional[datetime]
    monthly_percentage: float


class QRScanRequest(BaseModel):
    token: str
    type: Optional[AttendanceType] = None


class QRGenerateResponse(BaseModel):
    token: str
    qr_image_base64: str
    expires_at: datetime


# =====================================================
# ROOM SCHEMAS
# =====================================================

class RoomCreate(BaseModel):
    room_no: str
    block: str
    floor: int
    capacity: int = 2
    room_type: str = "Double"


class RoomResponse(BaseModel):
    room_no: str
    block: str
    floor: int
    capacity: int
    room_type: str
    
    class Config:
        from_attributes = True


class AvailableRoom(BaseModel):
    room_no: str
    block: str
    floor: int
    room_type: str
    capacity: int
    occupied: int
    available: int


class RoomAssignmentCreate(BaseModel):
    student_id: int
    room_no: str
    assigned_date: date


class RoomAssignmentResponse(BaseModel):
    assignment_id: int
    student_id: int
    room_no: str
    assigned_date: date
    vacated_date: Optional[date]
    is_active: bool
    
    class Config:
        from_attributes = True


# =====================================================
# MESS SCHEMAS
# =====================================================

class OptOutCreate(BaseModel):
    date: date
    meal_time: MealTime
    opt: str = "Y"
    reason: Optional[str] = None


class OptOutResponse(BaseModel):
    opt_id: int
    student_id: int
    date: date
    meal_time: str
    opt: str
    reason: Optional[str]
    
    class Config:
        from_attributes = True


class MenuItemResponse(BaseModel):
    item_id: int
    item_name: str
    item_description: Optional[str]
    calories: Optional[int]
    is_available: bool
    
    class Config:
        from_attributes = True


class MenuPoolResponse(BaseModel):
    pool_id: int
    day_of_week: str
    meal_time: str
    meal_category: str
    menu_items: List[MenuItemResponse] = []
    
    class Config:
        from_attributes = True


class DailySummary(BaseModel):
    date: date
    meal_time: str
    total_students: int
    opted_out: int
    expected_count: int


class DemandForecast(BaseModel):
    date: date
    meal_time: str
    predicted_count: int
    confidence: float


# =====================================================
# VIOLATION SCHEMAS
# =====================================================

class ViolationResponse(BaseModel):
    violation_id: int
    student_id: int
    student_name: str
    violation_type: str
    violation_date: date
    description: Optional[str]
    severity: str
    resolved: bool
    
    class Config:
        from_attributes = True


# =====================================================
# ANALYTICS SCHEMAS
# =====================================================

class PeakHoursData(BaseModel):
    hour: int
    in_count: int
    out_count: int


class DailyTrendData(BaseModel):
    date: date
    in_count: int
    out_count: int
    unique_students: int


class MonthlyStats(BaseModel):
    year: int
    month: int
    total_students: int
    avg_daily_attendance: float
    avg_attendance_percentage: float


class LateOutStudent(BaseModel):
    student_id: int
    student_name: str
    late_count: int
    last_late_time: datetime


class MealUtilization(BaseModel):
    meal_time: str
    avg_attendance: float
    avg_optout_percentage: float


class OccupancyData(BaseModel):
    block: str
    total_rooms: int
    occupied_rooms: int
    total_capacity: int
    current_occupancy: int
    occupancy_percentage: float


class AnomalyData(BaseModel):
    student_id: int
    student_name: str
    anomaly_type: str
    description: str
    detected_at: datetime
    severity: str


class DashboardSummary(BaseModel):
    total_students: int
    present_students: int
    out_students: int
    total_rooms: int
    occupied_rooms: int
    pending_violations: int
    today_meal_attendance: dict
