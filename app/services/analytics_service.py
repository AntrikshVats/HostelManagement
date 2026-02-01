from datetime import datetime, date, timedelta
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, case, extract, text
from app.models import (
    Attendance, AttendanceType, OptOut, Student, RoomAssignment, 
    Room, Violation, MealTime
)
from app.schemas import (
    PeakHoursData, DailyTrendData, MonthlyStats, LateOutStudent,
    MealUtilization, OccupancyData, AnomalyData, DemandForecast
)
from app.config import get_settings

settings = get_settings()


# =====================================================
# ATTENDANCE ANALYTICS
# =====================================================

def get_peak_hours(db: Session, days: int = 7) -> List[PeakHoursData]:
    """
    Analyze peak IN/OUT hours over the last N days.
    Returns hourly distribution of attendance.
    """
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    # Query to count IN and OUT by hour
    results = db.query(
        extract('hour', Attendance.timestamp).label('hour'),
        func.sum(case((Attendance.type == AttendanceType.IN, 1), else_=0)).label('in_count'),
        func.sum(case((Attendance.type == AttendanceType.OUT, 1), else_=0)).label('out_count')
    ).filter(Attendance.timestamp > cutoff_date).group_by('hour').order_by('hour').all()
    
    return [
        PeakHoursData(hour=int(r.hour), in_count=int(r.in_count), out_count=int(r.out_count))
        for r in results
    ]


def get_daily_trends(db: Session, days: int = 30) -> List[DailyTrendData]:
    """Get daily attendance trends for the last N days."""
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    results = db.query(
        func.date(Attendance.timestamp).label('date'),
        func.sum(case((Attendance.type == AttendanceType.IN, 1), else_=0)).label('in_count'),
        func.sum(case((Attendance.type == AttendanceType.OUT, 1), else_=0)).label('out_count'),
        func.count(func.distinct(Attendance.student_id)).label('unique_students')
    ).filter(Attendance.timestamp > cutoff_date).group_by('date').order_by('date').all()
    
    return [
        DailyTrendData(
            date=r.date,
            in_count=int(r.in_count),
            out_count=int(r.out_count),
            unique_students=int(r.unique_students)
        )
        for r in results
    ]


def get_monthly_stats(db: Session, year: int, month: int) -> MonthlyStats:
    """Get attendance statistics for a specific month."""
    total_students = db.query(Student).count()
    
    # Get daily unique student count
    daily_attendance = db.query(
        func.date(Attendance.timestamp).label('date'),
        func.count(func.distinct(Attendance.student_id)).label('count')
    ).filter(
        and_(
            func.year(Attendance.timestamp) == year,
            func.month(Attendance.timestamp) == month,
            Attendance.type == AttendanceType.IN
        )
    ).group_by('date').all()
    
    avg_daily_attendance = sum(r.count for r in daily_attendance) / len(daily_attendance) if daily_attendance else 0
    avg_percentage = (avg_daily_attendance / total_students * 100) if total_students > 0 else 0
    
    return MonthlyStats(
        year=year,
        month=month,
        total_students=total_students,
        avg_daily_attendance=round(avg_daily_attendance, 2),
        avg_attendance_percentage=round(avg_percentage, 2)
    )


def get_late_out_students(db: Session, days: int = 30, min_count: int = 3) -> List[LateOutStudent]:
    """
    Get students who frequently exit late (after curfew).
    Returns students with at least min_count late exits in the last N days.
    """
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    curfew_hour = int(settings.CURFEW_TIME.split(":")[0])
    
    results = db.query(
        Student.student_id,
        func.concat(Student.first_name, ' ', Student.last_name).label('student_name'),
        func.count(Attendance.attendance_id).label('late_count'),
        func.max(Attendance.timestamp).label('last_late_time')
    ).join(Attendance).filter(
        and_(
            Attendance.timestamp > cutoff_date,
            Attendance.type == AttendanceType.OUT,
            extract('hour', Attendance.timestamp) >= curfew_hour
        )
    ).group_by(Student.student_id, 'student_name').having(
        func.count(Attendance.attendance_id) >= min_count
    ).order_by(func.count(Attendance.attendance_id).desc()).all()
    
    return [
        LateOutStudent(
            student_id=r.student_id,
            student_name=r.student_name,
            late_count=r.late_count,
            last_late_time=r.last_late_time
        )
        for r in results
    ]


# =====================================================
# MESS ANALYTICS
# =====================================================

def get_meal_utilization(db: Session, days: int = 30) -> List[MealUtilization]:
    """Analyze meal utilization patterns over the last N days."""
    cutoff_date = date.today() - timedelta(days=days)
    total_students = db.query(Student).count()
    
    results = db.query(
        OptOut.meal_time,
        func.count(OptOut.opt_id).label('total_records'),
        func.sum(case((OptOut.opt == 'Y', 1), else_=0)).label('optout_count')
    ).filter(OptOut.date >= cutoff_date).group_by(OptOut.meal_time).all()
    
    utilization_data = []
    for r in results:
        # Calculate average optout percentage
        avg_optout = (r.optout_count / r.total_records * 100) if r.total_records > 0 else 0
        avg_attendance = total_students * (1 - avg_optout / 100)
        
        utilization_data.append(
            MealUtilization(
                meal_time=r.meal_time.value,
                avg_attendance=round(avg_attendance, 2),
                avg_optout_percentage=round(avg_optout, 2)
            )
        )
    
    return utilization_data


def predict_meal_demand(db: Session, target_date: date, meal_time: MealTime) -> DemandForecast:
    """
    Predict meal demand using historical opt-out patterns.
    Simple prediction based on same day of week average.
    """
    total_students = db.query(Student).count()
    
    # Get historical data for same day of week
    target_weekday = target_date.weekday()
    past_30_days = date.today() - timedelta(days=30)
    
    # Query opt-outs for same weekday and meal time
    optout_count = db.query(func.avg(
        func.sum(case((OptOut.opt == 'Y', 1), else_=0))
    )).filter(
        and_(
            OptOut.date >= past_30_days,
            OptOut.meal_time == meal_time,
            extract('dow', OptOut.date) == target_weekday
        )
    ).group_by(OptOut.date).scalar() or 0
    
    predicted_count = total_students - int(optout_count)
    confidence = 0.75  # Simple model has moderate confidence
    
    return DemandForecast(
        date=target_date,
        meal_time=meal_time.value,
        predicted_count=max(predicted_count, 0),
        confidence=confidence
    )


# =====================================================
# OCCUPANCY ANALYTICS
# =====================================================

def get_occupancy_by_block(db: Session) -> List[OccupancyData]:
    """Get current hostel occupancy by block."""
    results = db.query(
        Room.block,
        func.count(Room.room_no).label('total_rooms'),
        func.count(func.distinct(RoomAssignment.room_no)).label('occupied_rooms'),
        func.sum(Room.capacity).label('total_capacity'),
        func.count(RoomAssignment.student_id).label('current_occupancy')
    ).outerjoin(
        RoomAssignment,
        and_(Room.room_no == RoomAssignment.room_no, RoomAssignment.is_active == True)
    ).group_by(Room.block).all()
    
    return [
        OccupancyData(
            block=r.block,
            total_rooms=r.total_rooms,
            occupied_rooms=r.occupied_rooms or 0,
            total_capacity=r.total_capacity,
            current_occupancy=r.current_occupancy or 0,
            occupancy_percentage=round((r.current_occupancy or 0) / r.total_capacity * 100, 2) if r.total_capacity > 0 else 0
        )
        for r in results
    ]


# =====================================================
# ANOMALY DETECTION
# =====================================================

def detect_anomalies(db: Session) -> List[AnomalyData]:
    """
    Detect unusual attendance patterns.
    Includes: 
    - Students who haven't returned in 24+ hours
    - Students with no attendance records in 7+ days
    - Multiple OUT records without IN
    """
    anomalies = []
    now = datetime.utcnow()
    
    # Anomaly 1: Students currently OUT for more than 24 hours
    cutoff_24h = now - timedelta(hours=24)
    long_out_students = db.query(
        Student.student_id,
        func.concat(Student.first_name, ' ', Student.last_name).label('name'),
        Attendance.timestamp
    ).join(Attendance).filter(
        and_(
            Attendance.type == AttendanceType.OUT,
            Attendance.timestamp < cutoff_24h,
            Attendance.attendance_id.in_(
                db.query(func.max(Attendance.attendance_id)).group_by(Attendance.student_id)
            )
        )
    ).all()
    
    for student in long_out_students:
        anomalies.append(
            AnomalyData(
                student_id=student.student_id,
                student_name=student.name,
                anomaly_type="Extended Absence",
                description=f"Student has been OUT since {student.timestamp.strftime('%Y-%m-%d %H:%M')}",
                detected_at=now,
                severity="High"
            )
        )
    
    # Anomaly 2: Students with no attendance in past 7 days
    cutoff_7d = now - timedelta(days=7)
    absent_students = db.query(
        Student.student_id,
        func.concat(Student.first_name, ' ', Student.last_name).label('name')
    ).outerjoin(Attendance).group_by(Student.student_id, 'name').having(
        or_(
            func.max(Attendance.timestamp) < cutoff_7d,
            func.max(Attendance.timestamp).is_(None)
        )
    ).all()
    
    for student in absent_students[:10]:  # Limit to 10 for performance
        anomalies.append(
            AnomalyData(
                student_id=student.student_id,
                student_name=student.name,
                anomaly_type="No Recent Attendance",
                description="No attendance records in the past 7 days",
                detected_at=now,
                severity="Medium"
            )
        )
    
    return anomalies
