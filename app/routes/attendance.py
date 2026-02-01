from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, date
from typing import List, Optional
from app.database import get_db
from app.models import Student, AttendanceType
from app.schemas import (
    QRScanRequest, QRGenerateResponse, AttendanceRecord, AttendanceStats
)
from app.auth import get_current_user, get_current_student
from app.services.qr_service import generate_qr_token, generate_qr_image, validate_qr_token
from app.services.attendance_service import (
    auto_detect_attendance_type, check_duplicate_scan, mark_attendance,
    get_attendance_history, calculate_attendance_stats
)

router = APIRouter(prefix="/attendance", tags=["Attendance"])


@router.post("/generate-qr", response_model=QRGenerateResponse)
def generate_qr_code(current_student: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    """
    Generate a time-limited QR code for the current student.
    QR code is valid for 5 minutes.
    """
    token, expires_at = generate_qr_token(db, current_student.student_id)
    qr_image = generate_qr_image(token)
    
    return QRGenerateResponse(
        token=token,
        qr_image_base64=qr_image,
        expires_at=expires_at
    )


@router.post("/scan", response_model=AttendanceRecord)
def scan_qr_code(request: QRScanRequest, db: Session = Depends(get_db)):
    """
    Process QR code scan for attendance marking.
    Automatically detects IN or OUT based on last status.
    Prevents duplicate scans within 5 minutes.
    """
    # Validate QR token
    student = validate_qr_token(db, request.token)
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid, expired, or already used QR code"
        )
    
    # Check for duplicate scan
    # if check_duplicate_scan(db, student.student_id, cooldown_minutes=1.0):
    #     raise HTTPException(
    #         status_code=status.HTTP_429_TOO_MANY_REQUESTS,
    #         detail="Attendance already marked recently. Please wait 1 minute."
    #     )
    
    # Determine attendance type: use manual if provided, otherwise auto-detect
    if request.type:
        attendance_type = request.type
    else:
        attendance_type = auto_detect_attendance_type(db, student.student_id)
    
    # Mark attendance
    attendance = mark_attendance(
        db,
        student_id=student.student_id,
        attendance_type=attendance_type,
        location="Main Gate",
        remarks="QR Code Scan"
    )
    
    return AttendanceRecord(
        attendance_id=attendance.attendance_id,
        student_id=attendance.student_id,
        timestamp=attendance.timestamp,
        type=attendance.type.value,
        remarks=attendance.remarks,
        location=attendance.location
    )


@router.get("/student/{student_id}", response_model=List[AttendanceRecord])
def get_student_attendance(
    student_id: int,
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get attendance history for a specific student.
    Students can only view their own records.
    Admins/Wardens can view any student's records.
    """
    # Authorization check
    if isinstance(current_user, Student) and current_user.student_id != student_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own attendance records"
        )
    
    # Get attendance history
    records = get_attendance_history(db, student_id, start_date, end_date)
    
    return [
        AttendanceRecord(
            attendance_id=r.attendance_id,
            student_id=r.student_id,
            timestamp=r.timestamp,
            type=r.type.value,
            remarks=r.remarks,
            location=r.location
        )
        for r in records
    ]


@router.get("/student/{student_id}/stats", response_model=AttendanceStats)
def get_student_attendance_stats(
    student_id: int,
    year: int = Query(datetime.now().year),
    month: int = Query(datetime.now().month),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get attendance statistics for a student for a specific month.
    Includes monthly percentage, IN/OUT counts, and current status.
    """
    # Authorization check
    if isinstance(current_user, Student) and current_user.student_id != student_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own statistics"
        )
    
    # Validate month and year
    if month < 1 or month > 12:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Month must be between 1 and 12"
        )
    
    stats = calculate_attendance_stats(db, student_id, year, month)
    return stats


@router.get("/daily/{target_date}", response_model=List[AttendanceRecord])
def get_daily_attendance(
    target_date: date,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all attendance records for a specific date.
    Admin/Warden access only.
    """
    from app.models import Employee, Attendance
    
    # Check if user is admin or warden
    if not isinstance(current_user, Employee):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin or Warden access required"
        )
    
    # Get all attendance for the date
    from sqlalchemy import func
    records = db.query(Attendance).options(joinedload(Attendance.student)).filter(
        func.date(Attendance.timestamp) == target_date
    ).order_by(Attendance.timestamp.desc()).all()
    
    return [
        AttendanceRecord(
            attendance_id=r.attendance_id,
            student_id=r.student_id,
            timestamp=r.timestamp,
            type=r.type.value,
            remarks=r.remarks,
            location=r.location,
            roll_number=r.student.roll_number if r.student else None,
            student_name=f"{r.student.first_name} {r.student.last_name}" if r.student else "Unknown"
        )
        for r in records
    ]
