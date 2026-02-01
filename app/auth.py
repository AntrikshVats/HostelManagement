from datetime import datetime, timedelta
from typing import Optional, Union
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.config import get_settings
from app.database import get_db
from app.models import Student, Employee, UserRole

settings = get_settings()

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# HTTP Bearer token scheme
security = HTTPBearer()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a plaintext password."""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> dict:
    """Decode and verify a JWT token."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> Union[Student, Employee]:
    """
    Get the current authenticated user from the JWT token.
    Returns either a Student or Employee object.
    """
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = decode_access_token(token)
        user_id: int = payload.get("sub")
        user_type: str = payload.get("type")
        
        if user_id is None or user_type is None:
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception
    
    # Retrieve user based on type
    if user_type == "student":
        user = db.query(Student).filter(Student.student_id == user_id).first()
    elif user_type == "employee":
        user = db.query(Employee).filter(Employee.ssn == user_id).first()
    else:
        raise credentials_exception
    
    if user is None:
        raise credentials_exception
    
    return user


def require_role(*allowed_roles: UserRole):
    """
    Decorator to require specific roles for endpoint access.
    Usage: current_user = Depends(require_role(UserRole.ADMIN, UserRole.WARDEN))
    """
    def role_checker(current_user: Union[Student, Employee] = Depends(get_current_user)):
        # Get user role
        if isinstance(current_user, Employee):
            user_role = current_user.role
        else:
            user_role = UserRole.STUDENT
        
        # Check if user has required role
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {[role.value for role in allowed_roles]}"
            )
        
        return current_user
    
    return role_checker


def get_current_student(current_user: Union[Student, Employee] = Depends(get_current_user)) -> Student:
    """Get current user and ensure it's a student."""
    if not isinstance(current_user, Student):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is only accessible to students"
        )
    return current_user


def get_current_admin(current_user: Union[Student, Employee] = Depends(get_current_user)) -> Employee:
    """Get current user and ensure it's an admin/warden."""
    if not isinstance(current_user, Employee) or current_user.role not in [UserRole.ADMIN, UserRole.WARDEN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint requires admin or warden access"
        )
    return current_user


# =====================================================
# AUTHENTICATION HELPERS
# =====================================================

def authenticate_student(db: Session, email: str, password: str) -> Optional[Student]:
    """Authenticate a student user."""
    student = db.query(Student).filter(Student.email == email).first()
    if not student:
        return None
    if not verify_password(password, student.password_hash):
        return None
    return student


def authenticate_employee(db: Session, email: str, password: str) -> Optional[Employee]:
    """Authenticate an employee user."""
    employee = db.query(Employee).filter(Employee.email == email).first()
    if not employee:
        return None
    if not verify_password(password, employee.password_hash):
        return None
    return employee
