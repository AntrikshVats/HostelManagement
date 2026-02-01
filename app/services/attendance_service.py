from datetime import datetime, timedelta, date
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc
from app.models import Attendance, AttendanceType, Student, Violation, ViolationType, ViolationSeverity
from app.schemas import AttendanceStats
from app.config import get_settings

settings = get_settings()


def get_last_attendance(db: Session, student_id: int) -> Optional[Attendance]:
    """Get the most recent attendance record for a student."""
    return db.query(Attendance).filter(
        Attendance.student_id == student_id
    ).order_by(desc(Attendance.timestamp)).first()


def auto_detect_attendance_type(db: Session, student_id: int) -> AttendanceType:
    """
    Automatically determine if attendance should be IN or OUT.
    Logic: If last status was IN (or no record), next should be OUT.
           If last status was OUT, next should be IN.
    """
    last_attendance = get_last_attendance(db, student_id)
    
    if not last_attendance:
        return AttendanceType.IN
    
    return AttendanceType.OUT if last_attendance.type == AttendanceType.IN else AttendanceType.IN


def check_duplicate_scan(db: Session, student_id: int, cooldown_minutes: int = 5) -> bool:
    """
    Check if student has scanned within the cooldown period.
    Returns True if duplicate, False if allowed.
    """
    cooldown_time = datetime.utcnow() - timedelta(minutes=cooldown_minutes)
    recent_scan = db.query(Attendance).filter(
        and_(
            Attendance.student_id == student_id,
            Attendance.timestamp > cooldown_time
        )
    ).first()
    
    return recent_scan is not None


def mark_attendance(
    db: Session,
    student_id: int,
    attendance_type: AttendanceType,
    location: str = "Main Gate",
    remarks: Optional[str] = None,
    verified_by: Optional[str] = None
) -> Attendance:
    """Create a new attendance record."""
    attendance = Attendance(
        student_id=student_id,
        type=attendance_type,
        location=location,
        remarks=remarks,
        verified_by=verified_by
    )
    db.add(attendance)
    db.commit()
    db.refresh(attendance)
    
    # Check for curfew violation
    check_curfew_violation(db, attendance)
    
    return attendance




def check_curfew_violation(db: Session, attendance: Attendance):
    """
    Check for curfew violation when student goes IN after curfew.
    This means they were OUT past curfew and are just returning.
    """
    if attendance.type != AttendanceType.IN:
        return
    
    # Parse curfew time (e.g., "22:00")
    curfew_hour = int(settings.CURFEW_TIME.split(":")[0])
    curfew_minute = int(settings.CURFEW_TIME.split(":")[1])
    
    # Check if they're checking IN after curfew (meaning they were out past curfew)
    if attendance.timestamp.hour > curfew_hour or \
       (attendance.timestamp.hour == curfew_hour and attendance.timestamp.minute >= curfew_minute):
        
        # Create violation record
        violation = Violation(
            student_id=attendance.student_id,
            violation_type=ViolationType.CURFEW,
            violation_date=attendance.timestamp.date(),
            description=f"Returned after curfew at {attendance.timestamp.strftime('%H:%M')}",
            severity=ViolationSeverity.HIGH
        )
        db.add(violation)
        db.commit()


def detect_students_out_past_curfew(db: Session) -> List[dict]:
    """
    Detect students who are currently OUT and it's past curfew time.
    This should be run periodically (e.g., at 22:00 daily).
    Returns list of students with violation details.
    """
    # Parse curfew time
    curfew_hour = int(settings.CURFEW_TIME.split(":")[0])
    current_time = datetime.now()
    
    # Only check if it's currently past curfew or early morning (before 6 AM)
    # This handles the window from 22:00 to 06:00
    is_night_time = current_time.hour >= curfew_hour or current_time.hour < 6
    if not is_night_time:
        return []
    
    # Get all students whose last attendance is OUT
    subquery = db.query(
        Attendance.student_id,
        func.max(Attendance.attendance_id).label('max_id')
    ).group_by(Attendance.student_id).subquery()
    
    # Find students who are currently OUT
    students_out = db.query(
        Student,
        Attendance
    ).join(
        Attendance,
        Student.student_id == Attendance.student_id
    ).join(
        subquery,
        and_(
            Attendance.student_id == subquery.c.student_id,
            Attendance.attendance_id == subquery.c.max_id,
            Attendance.type == AttendanceType.OUT
        )
    ).all()
    
    violations = []
    today = current_time.date()
    
    for student, last_out in students_out:
        # Check if violation already exists for today
        existing = db.query(Violation).filter(
            and_(
                Violation.student_id == student.student_id,
                Violation.violation_type == ViolationType.CURFEW,
                Violation.violation_date == today,
                Violation.resolved == False
            )
        ).first()
        
        if not existing:
            # Create new violation
            hours_out = (current_time - last_out.timestamp).total_seconds() / 3600
            violation = Violation(
                student_id=student.student_id,
                violation_type=ViolationType.CURFEW,
                violation_date=today,
                description=f"Student out since {last_out.timestamp.strftime('%H:%M')}, hasn't returned by curfew ({settings.CURFEW_TIME})",
                severity=ViolationSeverity.HIGH
            )
            db.add(violation)
            violations.append({
                'student_id': student.student_id,
                'student_name': f"{student.first_name} {student.last_name}",
                'last_out': last_out.timestamp,
                'hours_out': round(hours_out, 1)
            })
    
    if violations:
        db.commit()
    
    return violations



def get_attendance_history(
    db: Session,
    student_id: int,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
) -> List[Attendance]:
    """Get attendance history for a student within date range."""
    query = db.query(Attendance).filter(Attendance.student_id == student_id)
    
    if start_date:
        query = query.filter(func.date(Attendance.timestamp) >= start_date)
    if end_date:
        query = query.filter(func.date(Attendance.timestamp) <= end_date)
    
    return query.order_by(desc(Attendance.timestamp)).all()


def calculate_attendance_stats(db: Session, student_id: int, year: int, month: int) -> AttendanceStats:
    """Calculate attendance statistics for a student for a specific month."""
    # Get all attendance records for the month
    records = db.query(Attendance).filter(
        and_(
            Attendance.student_id == student_id,
            func.year(Attendance.timestamp) == year,
            func.month(Attendance.timestamp) == month
        )
    ).all()
    
    in_count = sum(1 for r in records if r.type == AttendanceType.IN)
    out_count = sum(1 for r in records if r.type == AttendanceType.OUT)
    
    # Get current status
    last_attendance = get_last_attendance(db, student_id)
    current_status = last_attendance.type.value if last_attendance else None
    last_updated = last_attendance.timestamp if last_attendance else None
    
    # Calculate monthly percentage (days present / total days in month)
    from calendar import monthrange
    total_days = monthrange(year, month)[1]
    
    # Count unique dates with IN records
    unique_dates = db.query(func.date(Attendance.timestamp)).distinct().filter(
        and_(
            Attendance.student_id == student_id,
            Attendance.type == AttendanceType.IN,
            func.year(Attendance.timestamp) == year,
            func.month(Attendance.timestamp) == month
        )
    ).count()
    
    monthly_percentage = (unique_dates / total_days) * 100
    
    return AttendanceStats(
        student_id=student_id,
        total_records=len(records),
        in_count=in_count,
        out_count=out_count,
        current_status=current_status,
        last_updated=last_updated,
        monthly_percentage=round(monthly_percentage, 2)
    )


def get_students_by_status(db: Session, status: AttendanceType) -> List[Student]:
    """Get all students currently with a specific status (IN or OUT)."""
    # Subquery to get latest attendance for each student
    subquery = db.query(
        Attendance.student_id,
        func.max(Attendance.attendance_id).label('max_id')
    ).group_by(Attendance.student_id).subquery()
    
    # Join to get students with the specified status
    # We join Student -> Subquery -> Attendance to ensure we get the latest record
    students = db.query(Student).join(
        subquery,
        Student.student_id == subquery.c.student_id
    ).join(
        Attendance,
        and_(
            Attendance.attendance_id == subquery.c.max_id,
            Attendance.type == status
        )
    ).all()
    
    return students


def detect_frequent_absence(db: Session, days: int = 30, threshold: int = 10) -> List[Student]:
    """
    Detect students with frequent absences.
    Returns students who have been OUT more than threshold days in the last N days.
    """
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    # Count days with OUT status
    students = db.query(Student).join(Attendance).filter(
        and_(
            Attendance.timestamp > cutoff_date,
            Attendance.type == AttendanceType.OUT
        )
    ).group_by(Student.student_id).having(
        func.count(func.distinct(func.date(Attendance.timestamp))) > threshold
    ).all()
    
    return students
