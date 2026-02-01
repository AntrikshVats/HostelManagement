from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from datetime import date
from app.database import get_db
from app.models import Student, StudentFace, Attendance, AttendanceType
from app.auth import get_current_admin
from sqlalchemy import func
import base64
import json
import numpy as np

# Try importing face_recognition, if not available use a simple mock/placeholder
try:
    import cv2
    HAS_CV2 = True
except ImportError:
    HAS_CV2 = False
    print("WARNING: opencv-python not installed.")

try:
    import face_recognition
    HAS_FACE_REC = True
except ImportError:
    HAS_FACE_REC = False
    print("WARNING: face_recognition not installed. Face encoding/matching will be mocked.")

router = APIRouter(prefix="/admin/face", tags=["Face Recognition"])

@router.post("/register")
async def register_face(
    student_id: int = Form(...),
    image: UploadFile = File(...),
    current_admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Register a face for a student."""
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    # Read image data
    image_data = await image.read()
    
    encoding = None
    
    if HAS_CV2 and HAS_FACE_REC:
        try:
            # Convert bytes to numpy array
            nparr = np.frombuffer(image_data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            
            # Get encoding
            encodings = face_recognition.face_encodings(rgb_img)
            if len(encodings) > 0:
                encoding = encodings[0].tolist() # Convert to list for JSON storage
            else:
                pass 
        except Exception as e:
            print(f"Face processing error: {e}")
            pass
    elif not HAS_FACE_REC:
        # Mock encoding for testing without library
        encoding = [0.1] * 128 
            
    # Save to DB
    face_record = StudentFace(
        student_id=student_id,
        image_data=image_data,
        encoding=encoding
    )
    db.add(face_record)
    db.commit()
    
    return {"message": "Face registered successfully", "has_encoding": encoding is not None}

@router.post("/recognize")
async def recognize_face(
    image: UploadFile = File(...),
    current_admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Recognize a face and mark attendance."""
    image_data = await image.read()
    
    student = None
    confidence = 0.0
    note = ""

    # Strategy 1: Use face_recognition (Dlib) - Best Accuracy
    if HAS_FACE_REC:
        try:
            nparr = np.frombuffer(image_data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            
            unknown_encodings = face_recognition.face_encodings(rgb_img)
            
            if len(unknown_encodings) > 0:
                unknown_encoding = unknown_encodings[0]
                known_faces = db.query(StudentFace).filter(StudentFace.encoding.isnot(None)).all()
                
                best_match = None
                min_dist = 0.6
                
                for face in known_faces:
                     if not face.encoding: continue
                     known_encoding = np.array(face.encoding)
                     dist = face_recognition.face_distance([known_encoding], unknown_encoding)[0]
                     if dist < min_dist:
                        min_dist = dist
                        best_match = face
                
                if best_match:
                    student = best_match.student
                    confidence = 1 - min_dist
        except Exception as e:
            print(f"Face Rec Error: {e}")

    # Strategy 2: Use OpenCV Histogram - Fallback
    if not student and HAS_CV2:
        try:
            nparr = np.frombuffer(image_data, np.uint8)
            target_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if target_img is not None:
                # Calculate Histogram
                target_hist = cv2.calcHist([target_img], [0, 1, 2], None, [8, 8, 8], [0, 256, 0, 256, 0, 256])
                cv2.normalize(target_hist, target_hist)
                
                best_score = 0
                best_face = None
                
                known_faces = db.query(StudentFace).all()
                for face in known_faces:
                    if not face.image_data: continue
                    face_arr = np.frombuffer(face.image_data, np.uint8)
                    stored_img = cv2.imdecode(face_arr, cv2.IMREAD_COLOR)
                    if stored_img is None: continue
                    
                    stored_hist = cv2.calcHist([stored_img], [0, 1, 2], None, [8, 8, 8], [0, 256, 0, 256, 0, 256])
                    cv2.normalize(stored_hist, stored_hist)
                    
                    score = cv2.compareHist(target_hist, stored_hist, cv2.HISTCMP_CORREL)
                    if score > best_score:
                        best_score = score
                        best_face = face
                
                if best_score > 0.6 and best_face:
                    student = best_face.student
                    confidence = best_score
                    note = "OpenCV Histogram Match"
        except Exception as e:
            print(f"CV2 Error: {e}")

    if student:
        # Mark Attendance
        last_attendance = db.query(Attendance).filter(
            Attendance.student_id == student.student_id
        ).order_by(Attendance.timestamp.desc()).first()
        
        new_status = AttendanceType.IN
        if last_attendance and last_attendance.type == AttendanceType.IN:
            new_status = AttendanceType.OUT
            
        attendance = Attendance(
            student_id=student.student_id,
            type=new_status,
            timestamp=func.now()
        )
        db.add(attendance)
        db.commit()
        
        return {
            "match": True,
            "student_id": student.student_id,
            "name": f"{student.first_name} {student.last_name}",
            "status": new_status.value,
            "confidence": float(confidence),
            "note": note
        }
        
    return {"message": "Face not recognized", "match": False}
