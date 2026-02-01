from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime, date
from typing import List
from app.database import get_db
from app.models import MealTime
from app.schemas import (
    PeakHoursData, DailyTrendData, MonthlyStats, LateOutStudent,
    MealUtilization, OccupancyData, AnomalyData
)
from app.auth import get_current_user
from app.services.analytics_service import (
    get_peak_hours, get_daily_trends, get_monthly_stats,
    get_late_out_students, get_meal_utilization, get_occupancy_by_block,
    detect_anomalies
)

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/peak-hours", response_model=List[PeakHoursData])
def get_peak_hours_analysis(
    days: int = Query(7, ge=1, le=90),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get peak IN/OUT hours analysis.
    Returns hourly distribution of attendance over the last N days.
    """
    return get_peak_hours(db, days)


@router.get("/daily-trends", response_model=List[DailyTrendData])
def get_daily_trends_analysis(
    days: int = Query(30, ge=1, le=90),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get daily attendance trends.
    Shows IN/OUT counts and unique students per day.
    """
    return get_daily_trends(db, days)


@router.get("/monthly/{year}/{month}", response_model=MonthlyStats)
def get_monthly_statistics(
    year: int,
    month: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get monthly attendance statistics.
    Includes average daily attendance and percentage.
    """
    if month < 1 or month > 12:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Month must be between 1 and 12"
        )
    
    return get_monthly_stats(db, year, month)


@router.get("/late-outs", response_model=List[LateOutStudent])
def get_late_out_analysis(
    days: int = Query(30, ge=1, le=90),
    min_count: int = Query(3, ge=1, le=20),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get students with frequent late-night exits (after curfew).
    Returns students who violated curfew at least min_count times.
    """
    return get_late_out_students(db, days, min_count)


@router.get("/meal-utilization", response_model=List[MealUtilization])
def get_meal_utilization_analysis(
    days: int = Query(30, ge=1, le=90),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get meal utilization statistics.
    Shows average attendance and opt-out percentage per meal.
    """
    return get_meal_utilization(db, days)


@router.get("/occupancy", response_model=List[OccupancyData])
def get_occupancy_analysis(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get real-time hostel occupancy by block.
    Shows room utilization and capacity.
    """
    return get_occupancy_by_block(db)


@router.get("/anomalies", response_model=List[AnomalyData])
def get_anomaly_detection(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Detect unusual attendance patterns (INNOVATIVE FEATURE).
    Includes:
    - Students OUT for 24+ hours
    - Students with no attendance in 7+ days
    - Other anomalies
    """
    return detect_anomalies(db)


@router.get("/export/csv")
def export_analytics_csv(
    start_date: date = Query(...),
    end_date: date = Query(...),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Export attendance analytics as CSV.
    Useful for external analysis and reporting.
    """
    from app.models import Attendance
    from sqlalchemy import func
    import csv
    from io import StringIO
    
    # Get attendance data
    records = db.query(Attendance).filter(
        func.date(Attendance.timestamp).between(start_date, end_date)
    ).order_by(Attendance.timestamp).all()
    
    # Create CSV
    output = StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow(['Date', 'Time', 'Student ID', 'Roll Number', 'Type', 'Location'])
    
    # Write data
    for r in records:
        writer.writerow([
            r.timestamp.date(),
            r.timestamp.time(),
            r.student_id,
            r.student.roll_number,
            r.type.value,
            r.location
        ])
    
    from fastapi.responses import StreamingResponse
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=attendance_{start_date}_to_{end_date}.csv"}
    )
