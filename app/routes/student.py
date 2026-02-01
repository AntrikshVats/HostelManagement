from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Student
from app.schemas import StudentResponse, StudentUpdate, AttendanceRecord
from app.auth import get_current_student
from app.services.attendance_service import get_attendance_history

router = APIRouter(prefix="/student", tags=["Student"])


@router.get("/profile", response_model=StudentResponse)
def get_profile(current_student: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    """Get current student's profile information."""
    return StudentResponse(
        student_id=current_student.student_id,
        first_name=current_student.first_name,
        middle_name=current_student.middle_name,
        last_name=current_student.last_name,
        email=current_student.email,
        roll_number=current_student.roll_number,
        department=current_student.department,
        year=current_student.year,
        dietary_preference=current_student.dietary_preference.value,
        phone_numbers=[
            {
                "phone_id": p.phone_id,
                "phone_number": p.phone_number,
                "phone_type": p.phone_type
            }
            for p in current_student.phone_numbers
        ]
    )


@router.put("/profile", response_model=StudentResponse)
def update_profile(
    update_data: StudentUpdate,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """Update current student's profile."""
    # Update fields if provided
    if update_data.first_name is not None:
        current_student.first_name = update_data.first_name
    if update_data.middle_name is not None:
        current_student.middle_name = update_data.middle_name
    if update_data.last_name is not None:
        current_student.last_name = update_data.last_name
    if update_data.department is not None:
        current_student.department = update_data.department
    if update_data.year is not None:
        current_student.year = update_data.year
    if update_data.dietary_preference is not None:
        current_student.dietary_preference = update_data.dietary_preference
    
    db.commit()
    db.refresh(current_student)
    
    return StudentResponse(
        student_id=current_student.student_id,
        first_name=current_student.first_name,
        middle_name=current_student.middle_name,
        last_name=current_student.last_name,
        email=current_student.email,
        roll_number=current_student.roll_number,
        department=current_student.department,
        year=current_student.year,
        dietary_preference=current_student.dietary_preference.value,
        phone_numbers=[
            {
                "phone_id": p.phone_id,
                "phone_number": p.phone_number,
                "phone_type": p.phone_type
            }
            for p in current_student.phone_numbers
        ]
    )


@router.get("/attendance", response_model=List[AttendanceRecord])
def get_my_attendance(current_student: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    """Get current student's attendance history."""
    records = get_attendance_history(db, current_student.student_id)
    
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


@router.get("/mess/history")
def get_mess_history(current_student: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    """Get current student's mess opt-out history."""
    from app.models import OptOut
    
    opt_outs = db.query(OptOut).filter(
        OptOut.student_id == current_student.student_id
    ).order_by(OptOut.date.desc()).limit(30).all()
    
    return {
        "student_id": current_student.student_id,
        "dietary_preference": current_student.dietary_preference.value,
        "recent_opt_outs": [
            {
                "opt_id": o.opt_id,
                "date": o.date,
                "meal_time": o.meal_time.value,
                "opt": o.opt,
                "reason": o.reason
            }
            for o in opt_outs
        ]
    }
