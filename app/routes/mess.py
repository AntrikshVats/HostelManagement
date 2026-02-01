from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import date, datetime
from typing import List
from app.database import get_db
from app.models import OptOut, MenuPool, MealTime, Student
from app.schemas import OptOutCreate, OptOutResponse, DailySummary, DemandForecast, MenuPoolResponse
from app.auth import get_current_student, get_current_user
from app.services.analytics_service import predict_meal_demand
from sqlalchemy import func, and_

router = APIRouter(prefix="/mess", tags=["Mess Management"])


@router.post("/opt-out", response_model=OptOutResponse)
def opt_out_meal(
    request: OptOutCreate,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """
    Opt-out of a specific meal.
    Students can opt-out for current or future dates only.
    """
    # Validate date (must be today or future)
    if request.date < date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot opt-out for past dates"
        )
    
    # Check if opt-out already exists
    existing = db.query(OptOut).filter(
        and_(
            OptOut.student_id == current_student.student_id,
            OptOut.date == request.date,
            OptOut.meal_time == request.meal_time
        )
    ).first()
    
    if existing:
        # Update existing opt-out
        existing.opt = request.opt
        existing.reason = request.reason
        db.commit()
        db.refresh(existing)
        opt_out = existing
    else:
        # Create new opt-out
        opt_out = OptOut(
            student_id=current_student.student_id,
            date=request.date,
            meal_time=request.meal_time,
            opt=request.opt,
            reason=request.reason
        )
        db.add(opt_out)
        db.commit()
        db.refresh(opt_out)
    
    return OptOutResponse(
        opt_id=opt_out.opt_id,
        student_id=opt_out.student_id,
        date=opt_out.date,
        meal_time=opt_out.meal_time.value,
        opt=opt_out.opt,
        reason=opt_out.reason
    )

@router.get("/history", response_model=List[OptOutResponse])
def get_opt_out_history(
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """
    Get history of all opt-outs made by the current student.
    Ordered by date descending.
    """
    opt_outs = db.query(OptOut).filter(
        OptOut.student_id == current_student.student_id
    ).order_by(OptOut.date.desc()).all()
    
    return [
        OptOutResponse(
            opt_id=o.opt_id,
            student_id=o.student_id,
            date=o.date,
            meal_time=o.meal_time.value,
            opt=o.opt,
            reason=o.reason
        )
        for o in opt_outs
    ]


@router.get("/daily-summary", response_model=List[DailySummary])
def get_daily_summary(
    target_date: date = Query(date.today()),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get daily mess summary showing meal attendance and opt-outs.
    Shows expected attendance for each meal.
    """
    total_students = db.query(Student).count()
    
    from sqlalchemy import case
    
    # Get opt-out counts for each meal
    # Only count opt='N' as opted out
    results = db.query(
        OptOut.meal_time,
        func.count(OptOut.opt_id).label('total_records'),
        func.sum(case((OptOut.opt == 'N', 1), else_=0)).label('opted_out')
    ).filter(OptOut.date == target_date).group_by(OptOut.meal_time).all()
    
    summaries = []
    meals = ['Breakfast', 'Lunch', 'Dinner', 'Snacks']
    
    for meal in meals:
        # Find matching result
        matching = next((r for r in results if r.meal_time.value == meal), None)
        
        if matching:
            opted_out = int(matching.opted_out) if matching.opted_out else 0
            expected = total_students - opted_out
        else:
            opted_out = 0
            expected = total_students
        
        summaries.append(
            DailySummary(
                date=target_date,
                meal_time=meal,
                total_students=total_students,
                opted_out=opted_out,
                expected_count=expected
            )
        )
    
    return summaries


@router.get("/menu/{target_date}", response_model=List[MenuPoolResponse])
def get_menu(
    target_date: date,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get menu for a specific date."""
    from app.models import MenuItem
    from datetime import datetime as dt
    
    # Get day of week
    day_name = target_date.strftime('%A')
    
    # Get menu pools for the day
    menu_pools = db.query(MenuPool).filter(
        MenuPool.day_of_week == day_name
    ).all()
    
    return [
        MenuPoolResponse(
            pool_id=mp.pool_id,
            day_of_week=mp.day_of_week.value,
            meal_time=mp.meal_time.value,
            meal_category=mp.meal_category.value,
            menu_items=[
                {
                    "item_id": item.item_id,
                    "item_name": item.item_name,
                    "item_description": item.item_description,
                    "calories": item.calories,
                    "is_available": item.is_available
                }
                for item in mp.menu_items
            ]
        )
        for mp in menu_pools
    ]


@router.put("/preference")
def update_dietary_preference(
    preference: str,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """Update student's dietary preference (Veg/Non-Veg/Protein/Jain)."""
    from app.models import DietaryPreference
    
    # Validate preference
    try:
        pref_enum = DietaryPreference(preference)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid dietary preference. Must be one of: {[e.value for e in DietaryPreference]}"
        )
    
    current_student.dietary_preference = pref_enum
    db.commit()
    
    return {
        "message": "Dietary preference updated successfully",
        "new_preference": preference
    }


@router.get("/demand-forecast", response_model=DemandForecast)
def get_demand_forecast(
    target_date: date = Query(...),
    meal_time: str = Query(...),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get predictive demand forecast for a specific meal.
    Uses historical opt-out patterns for prediction.
    Admin/Warden access recommended.
    """
    # Validate meal_time
    try:
        meal_enum = MealTime(meal_time)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid meal time. Must be one of: {[e.value for e in MealTime]}"
        )
    
    forecast = predict_meal_demand(db, target_date, meal_enum)
    return forecast
