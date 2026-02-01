from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Student, Employee, UserRole
from app.schemas import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from app.auth import (
    get_password_hash, create_access_token, authenticate_student,
    authenticate_employee, get_current_user
)
from typing import Union

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """
    Register a new user (student or employee).
    Creates account and returns JWT token.
    """
    # Check if email already exists
    existing_student = db.query(Student).filter(Student.email == request.email).first()
    existing_employee = db.query(Employee).filter(Employee.email == request.email).first()
    
    if existing_student or existing_employee:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash password
    password_hash = get_password_hash(request.password)
    
    # Create user based on role
    if request.role == UserRole.STUDENT:
        # Validate student-specific fields
        if not request.roll_number:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Roll number is required for students"
            )
        
        # Check if roll number exists
        if db.query(Student).filter(Student.roll_number == request.roll_number).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Roll number already exists"
            )
        
        user = Student(
            first_name=request.first_name,
            middle_name=request.middle_name,
            last_name=request.last_name,
            email=request.email,
            password_hash=password_hash,
            roll_number=request.roll_number,
            department=request.department,
            year=request.year
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        user_id = user.student_id
        user_type = "student"
        
    else:
        # Employee registration
        if not request.ssn:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="SSN is required for employees"
            )
        
        # Check if SSN exists
        if db.query(Employee).filter(Employee.ssn == request.ssn).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="SSN already exists"
            )
        
        user = Employee(
            ssn=request.ssn,
            first_name=request.first_name,
            middle_name=request.middle_name,
            last_name=request.last_name,
            email=request.email,
            password_hash=password_hash,
            role=request.role
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        user_id = user.ssn
        user_type = "employee"
    
    # Create access token
    access_token = create_access_token(
        data={"sub": str(user_id), "type": user_type, "role": request.role.value}
    )
    
    return TokenResponse(
        access_token=access_token,
        user_id=user_id if user_type == "student" else 0,
        role=request.role.value
    )


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Login with email and password.
    Returns JWT token on successful authentication.
    """
    # Try to authenticate as student first
    user = authenticate_student(db, request.email, request.password)
    user_type = "student"
    
    if not user:
        # Try to authenticate as employee
        user = authenticate_employee(db, request.email, request.password)
        user_type = "employee"
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user ID and role
    if user_type == "student":
        user_id = user.student_id
        role = UserRole.STUDENT.value
    else:
        user_id = user.ssn
        role = user.role.value
    
    # Create access token
    access_token = create_access_token(
        data={"sub": str(user_id), "type": user_type, "role": role}
    )
    
    return TokenResponse(
        access_token=access_token,
        user_id=user_id if user_type == "student" else 0,
        role=role
    )


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: Union[Student, Employee] = Depends(get_current_user)):
    """Get current authenticated user information."""
    if isinstance(current_user, Student):
        return UserResponse(
            id=current_user.student_id,
            email=current_user.email,
            first_name=current_user.first_name,
            last_name=current_user.last_name,
            role="Student"
        )
    else:
        return UserResponse(
            id=0,  # Don't expose SSN
            email=current_user.email,
            first_name=current_user.first_name,
            last_name=current_user.last_name,
            role=current_user.role.value
        )


@router.post("/logout")
def logout():
    """
    Logout endpoint (stateless JWT - client should delete token).
    Returns success message.
    """
    return {"message": "Successfully logged out. Please delete your token."}
