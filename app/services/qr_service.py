import secrets
import base64
from io import BytesIO
from datetime import datetime, timedelta
from typing import Optional
import qrcode
from sqlalchemy.orm import Session
from app.models import QRToken, Student
from app.config import get_settings

settings = get_settings()


def generate_qr_token(db: Session, student_id: int) -> tuple[str, datetime]:
    """
    Generate a time-limited QR token for a student.
    Returns (token_value, expires_at)
    """
    # Generate secure random token
    token_value = secrets.token_urlsafe(32)
    
    # Calculate expiry time
    expires_at = datetime.utcnow() + timedelta(minutes=settings.QR_CODE_EXPIRY_MINUTES)
    
    # Store token in database
    qr_token = QRToken(
        token_value=token_value,
        student_id=student_id,
        expires_at=expires_at
    )
    db.add(qr_token)
    db.commit()
    
    return token_value, expires_at


def generate_qr_image(data: str) -> str:
    """
    Generate QR code image from data.
    Returns base64 encoded PNG image.
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=settings.QR_CODE_SIZE,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    img_str = base64.b64encode(buffer.getvalue()).decode()
    
    return img_str


def validate_qr_token(db: Session, token_value: str) -> Optional[Student]:
    """
    Validate a QR token and return the associated student.
    Returns None if token is invalid, expired, or already used.
    """
    qr_token = db.query(QRToken).filter(QRToken.token_value == token_value).first()
    
    if not qr_token:
        return None
    
    # Check if token is expired
    if datetime.utcnow() > qr_token.expires_at:
        return None
    
    # Check if token has been used
    # if qr_token.is_used:
    #     return None
    
    # Mark token as used
    qr_token.is_used = True
    db.commit()
    
    return qr_token.student


def cleanup_expired_tokens(db: Session):
    """Delete expired QR tokens from database."""
    db.query(QRToken).filter(QRToken.expires_at < datetime.utcnow()).delete()
    db.commit()
