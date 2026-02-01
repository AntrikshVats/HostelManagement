from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import date, datetime
from typing import List
from app.database import get_db
from app.models import Student, Employee, RoomAssignment, Room, Violation, AttendanceType
from app.schemas import (
    StudentResponse, StudentCreate, RoomAssignmentCreate, RoomAssignmentResponse,
    ViolationResponse, DashboardSummary, StudentRegistrationRequest, AvailableRoom
)
from app.auth import get_current_admin, get_password_hash
from app.services.attendance_service import detect_frequent_absence, get_students_by_status, detect_students_out_past_curfew
from sqlalchemy import func, and_

router = APIRouter(prefix="/admin", tags=["Admin/Warden"])


def map_student_to_response(student):
    active_assignment = next((ra for ra in student.room_assignments if ra.is_active), None)
    room_no = active_assignment.room_no if active_assignment else None
    block = active_assignment.room.block if active_assignment and active_assignment.room else None

    return StudentResponse(
        student_id=student.student_id,
        first_name=student.first_name,
        middle_name=student.middle_name,
        last_name=student.last_name,
        email=student.email,
        roll_number=student.roll_number,
        department=student.department,
        year=student.year,
        dietary_preference=student.dietary_preference.value,
        room_no=room_no,
        block=block,
        phone_numbers=[
            {
                "phone_id": p.phone_id,
                "phone_number": p.phone_number,
                "phone_type": p.phone_type
            }
            for p in student.phone_numbers
        ]
    )



@router.get("/students", response_model=List[StudentResponse])
def get_all_students(
    department: str = Query(None),
    year: int = Query(None),
    current_admin: Employee = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get list of all students with optional filters."""
    query = db.query(Student)
    
    if department:
        query = query.filter(Student.department == department)
    if year:
        query = query.filter(Student.year == year)
    
    students = query.all()
    
    students = query.all()
    
    return [map_student_to_response(s) for s in students]


@router.post("/students", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student(
    request: StudentCreate,
    current_admin: Employee = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Create a new student account."""
    # Check if email or roll number exists
    if db.query(Student).filter(Student.email == request.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )
    
    if db.query(Student).filter(Student.roll_number == request.roll_number).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Roll number already exists"
        )
    
    # Create student
    student = Student(
        first_name=request.first_name,
        middle_name=request.middle_name,
        last_name=request.last_name,
        email=request.email,
        password_hash=get_password_hash(request.password),
        roll_number=request.roll_number,
        department=request.department,
        year=request.year,
        dietary_preference=request.dietary_preference
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    
    # Add phone numbers
    from app.models import PhoneNumber
    for phone in request.phone_numbers:
        phone_entry = PhoneNumber(
            student_id=student.student_id,
            phone_number=phone.phone_number,
            phone_type=phone.phone_type
        )
        db.add(phone_entry)
    
    db.commit()
    db.refresh(student)
    
    db.refresh(student)
    
    return map_student_to_response(student)


@router.post("/rooms/assign", response_model=RoomAssignmentResponse)
def assign_room(
    request: RoomAssignmentCreate,
    current_admin: Employee = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Assign a student to a room."""
    # Validate student exists
    student = db.query(Student).filter(Student.student_id == request.student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # Validate room exists
    room = db.query(Room).filter(Room.room_no == request.room_no).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    
    # Check room capacity
    current_occupants = db.query(RoomAssignment).filter(
        and_(
            RoomAssignment.room_no == request.room_no,
            RoomAssignment.is_active == True
        )
    ).count()
    
    if current_occupants >= room.capacity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Room is at full capacity ({room.capacity})"
        )
    
    # Deactivate any existing active assignment
    db.query(RoomAssignment).filter(
        and_(
            RoomAssignment.student_id == request.student_id,
            RoomAssignment.is_active == True
        )
    ).update({"is_active": False, "vacated_date": date.today()})
    
    # Create new assignment
    assignment = RoomAssignment(
        student_id=request.student_id,
        room_no=request.room_no,
        assigned_date=request.assigned_date,
        is_active=True
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    
    return RoomAssignmentResponse(
        assignment_id=assignment.assignment_id,
        student_id=assignment.student_id,
        room_no=assignment.room_no,
        assigned_date=assignment.assigned_date,
        vacated_date=assignment.vacated_date,
        is_active=assignment.is_active
    )


@router.get("/rooms/available", response_model=List[AvailableRoom])
def get_available_rooms(
    block: str = Query(None),
    current_admin: Employee = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get list of rooms with vacancy."""
    query = db.query(Room)
    if block:
        query = query.filter(Room.block == block)
    
    rooms = query.all()
    results = []
    
    for room in rooms:
        occupied_count = db.query(RoomAssignment).filter(
            and_(
                RoomAssignment.room_no == room.room_no,
                RoomAssignment.is_active == True
            )
        ).count()
        
        if occupied_count < room.capacity:
            results.append(AvailableRoom(
                room_no=room.room_no,
                block=room.block,
                floor=room.floor,
                room_type=room.room_type.value,
                capacity=room.capacity,
                occupied=occupied_count,
                available=room.capacity - occupied_count
            ))
            
    return results


@router.post("/register-student", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def register_student_with_room(
    request: StudentRegistrationRequest,
    current_admin: Employee = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Register a new student and assign a room in one transaction."""
    # 1. Validate Room Availability
    room = db.query(Room).filter(Room.room_no == request.room_no).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
        
    occupied_count = db.query(RoomAssignment).filter(
        and_(
            RoomAssignment.room_no == request.room_no,
            RoomAssignment.is_active == True
        )
    ).count()
    
    if occupied_count >= room.capacity:
        raise HTTPException(status_code=400, detail="Selected room is full")

    # 2. Create Student (Reuse Create logic logic or call function if refactored, here duplicating for transaction safety)
    if db.query(Student).filter(Student.email == request.email).first():
        raise HTTPException(status_code=400, detail="Email already exists")

    if db.query(Student).filter(Student.roll_number == request.roll_number).first():
        raise HTTPException(status_code=400, detail="Roll number already exists")

    student = Student(
        first_name=request.first_name,
        middle_name=request.middle_name,
        last_name=request.last_name,
        email=request.email,
        password_hash=get_password_hash(request.password),
        roll_number=request.roll_number,
        department=request.department,
        year=request.year,
        dietary_preference=request.dietary_preference
    )
    db.add(student)
    db.flush() # Generate ID
    
    # Phone numbers
    from app.models import PhoneNumber
    for phone in request.phone_numbers:
        db.add(PhoneNumber(
            student_id=student.student_id,
            phone_number=phone.phone_number,
            phone_type=phone.phone_type
        ))

    # 3. Assign Room
    assignment = RoomAssignment(
        student_id=student.student_id,
        room_no=request.room_no,
        assigned_date=date.today(),
        is_active=True
    )
    db.add(assignment)
    
    db.commit()
    db.refresh(student)
    return map_student_to_response(student)


@router.get("/violations", response_model=List[ViolationResponse])
def get_violations(
    resolved: bool = Query(False),
    current_admin: Employee = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get list of violations (curfew, frequent absence, etc.)."""
    violations = db.query(Violation).filter(
        Violation.resolved == resolved
    ).order_by(Violation.created_at.desc()).limit(100).all()
    
    return [
        ViolationResponse(
            violation_id=v.violation_id,
            student_id=v.student_id,
            student_name=f"{v.student.first_name} {v.student.last_name}",
            violation_type=v.violation_type.value,
            violation_date=v.violation_date,
            description=v.description,
            severity=v.severity.value,
            resolved=v.resolved
        )
        for v in violations
    ]


@router.get("/students/absent", response_model=List[StudentResponse])
def get_frequent_absent_students(
    days: int = Query(30, ge=1, le=90),
    threshold: int = Query(10, ge=1, le=30),
    current_admin: Employee = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get students with frequent absences.
    Returns students who have been OUT more than threshold days in the last N days.
    """
    students = detect_frequent_absence(db, days, threshold)
    
    return [map_student_to_response(s) for s in students]


@router.get("/dashboard", response_model=DashboardSummary)
def get_dashboard_summary(
    current_admin: Employee = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get comprehensive dashboard summary for admin/warden."""
    from app.models import OptOut
    
    # Total students
    total_students = db.query(Student).count()
    
    # Students currently IN
    present_students = get_students_by_status(db, AttendanceType.IN)
    present_count = len(present_students)
    
    # Students currently OUT
    out_students = get_students_by_status(db, AttendanceType.OUT)
    out_count = len(out_students)
    
    # Total rooms
    total_rooms = db.query(Room).count()
    
    # Occupied rooms
    occupied_rooms = db.query(func.count(func.distinct(RoomAssignment.room_no))).filter(
        RoomAssignment.is_active == True
    ).scalar()
    
    # Pending violations
    pending_violations = db.query(Violation).filter(Violation.resolved == False).count()
    
    # Today's meal attendance (expected counts)
    today = date.today()
    meal_summary = {}
    
    from app.models import MealTime
    for meal in MealTime:
        # Count only records with opt='N' (Not eating)
        opted_out = db.query(OptOut).filter(
            and_(
                OptOut.date == today,
                OptOut.meal_time == meal,
                OptOut.opt == 'N'
            )
        ).count()
        
        meal_summary[meal.value] = {
            "expected": total_students - opted_out,
            "opted_out": opted_out
        }
    
    return DashboardSummary(
        total_students=total_students,
        present_students=present_count,
        out_students=out_count,
        total_rooms=total_rooms,
        occupied_rooms=occupied_rooms or 0,
        pending_violations=pending_violations,
        today_meal_attendance=meal_summary
    )


@router.put("/violations/{violation_id}/resolve")
def resolve_violation(
    violation_id: int,
    current_admin: Employee = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Mark a violation as resolved."""
    violation = db.query(Violation).filter(Violation.violation_id == violation_id).first()
    
    if not violation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Violation not found"
        )
    
    violation.resolved = True
    violation.resolved_by = current_admin.ssn
    violation.resolved_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Violation marked as resolved"}


@router.post("/violations/check-curfew")
def check_curfew_violations(
    current_admin: Employee = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Manually trigger curfew violation detection.
    Detects students who are currently OUT and it's past curfew time (22:00).
    Creates violation records for students who haven't returned.
    """
    violations = detect_students_out_past_curfew(db)
    
    return {
        "message": f"Curfew check completed. Found {len(violations)} violations.",
        "violations": violations
    }

