# 🏢 SmartHostel: Intelligent Attendance and Mess Management System

A modern, production-ready web application for automating hostel attendance tracking, mess management, and analytics. Built with **Python FastAPI**, **React**, and **MySQL**, featuring specific AI-powered capabilities like face recognition and anomaly detection.

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![React](https://img.shields.io/badge/React-18-cyan)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-teal)
![MySQL](https://img.shields.io/badge/MySQL-8.0+-orange)
![License](https://img.shields.io/badge/license-MIT-purple)

---

## 📋 Table of Contents

- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Installation](#-installation)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [Security](#-security)
- [Contributing](#-contributing)

---

## ✨ Features

### 🚀 **New Premium Frontend**
- **Modern UI/UX**: Built with **React** and **Tailwind CSS** featuring a beautiful glassmorphism design.
- **Interactive Dashboards**: Real-time data visualization using **Recharts**.
- **Smooth Animations**: Powered by **Framer Motion** for a premium feel.
- **Responsiveness**: Fully mobile-responsive design for students on the go.

### 👤 **Face Recognition Attendance**
- **Dual-Strategy Recognition**: 
    - **Primary**: High-accuracy detection using `face_recognition` (dlib).
    - **Fallback**: OpenCV histogram comparison for robustness when dependencies are missing.
- **Touchless Entry**: Mark attendance simply by showing your face to the kiosk.
- **Real-time Feedback**: Instant success/failure alerts with confidence scores.

### � **Core Functionality**
- **Authentication**: Secure JWT-based auth with Role-Based Access Control (Student, Admin, Warden).
- **QR Code System**: Time-limited (5-min), encrypted QR codes for secure manual entry.
- **Mess Management**: Daily meal opt-out, digital menu viewing, and dietary preference tracking.
- **Student Profile**: Manage personal details and view comprehensive attendance history.

### 📊 **Advanced Analytics**
- **Peak Hours Analysis**: Identify busiest IN/OUT times to optimize staffing.
- **Anomaly Detection**: AI-powered alerts for unusual absence patterns (e.g., missing for >24h).
- **Occupancy Tracking**: Real-time view of hostel occupancy by block.
- **Mess Demand Forecasting**: ML-based prediction of meal requirements to reduce food waste.

---

## 🛠️ Technology Stack

### **Frontend (New)**
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS
- **State/Logic**: Axios, React Router, Lucide Icons
- **Visuals**: Framer Motion (Animations), Recharts (Analytics)

### **Backend**
- **Framework**: FastAPI 0.109
- **Language**: Python 3.8+
- **ORM**: SQLAlchemy 2.0
- **AI/CV**: `face_recognition`, `opencv-python` (cv2), NumPy
- **Auth**: Python-JOSE (JWT), Passlib (bcrypt)

### **Database**
- **System**: MySQL 8.0+
- **Features**: Stored Procedures, Triggers, Views for complex analytics.

---

## 📁 Project Structure

```bash
dbms_final_try/
├── app/                        # FastAPI Backend
│   ├── main.py                 # App entry point
│   ├── routes/                 # API Endpoints (auth, attendance, face_recognition)
│   ├── services/               # Business logic
│   ├── models.py               # Database models
│   └── database.py             # DB connection
├── frontend-react/             # Primary React Frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Dashboard pages
│   │   └── services/           # API integration
│   ├── package.json            # Frontend dependencies
│   └── vite.config.js          # Build config
├── database/                   # Database Scripts
│   ├── schema.sql              # SQL Schema
│   └── init_db.py              # Data seeder
├── frontend/                   # (Legacy) HTML/JS Frontend
├── requirements.txt            # Python dependencies
└── README.md                   # This file
```

---

## 🚀 Installation

### Prerequisites
- Python 3.8+
- Node.js & npm (for React frontend)
- MySQL Server

### 1. Backend Setup

```bash
# Clone the repository
git clone <repository-url>
cd dbms_final_try

# Create and activate virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```

### 2. Frontend Setup

```bash
# Navigate to react frontend directory
cd frontend-react

# Install dependencies
npm install
```

### 3. Database Setup

```bash
# Return to root directory
cd ..

# Update .env file with your MySQL credentials
copy .env.example .env

# Initialize Database (Schema + Sample Data)
python database/init_db.py
```
*Note: This script creates sample users including Admin (`admin@smarthostel.com` / `admin123`) and Students.*

---

## ▶️ Running the Application

You need to run both the backend and frontend terminals simultaneously.

### Terminal 1: Backend (FastAPI)
```bash
# From root directory
uvicorn app.main:app --reload
```
*Server runs at `http://localhost:8000`* | *Docs at `http://localhost:8000/docs`*

### Terminal 2: Frontend (React)
```bash
# From root directory
cd frontend-react
npm run dev
```
*UI runs at `http://localhost:5173`*

---

## 📚 API Documentation

### **Auth & Users**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Login user (returns JWT) |
| GET | `/auth/me` | Get current user profile |

### **Attendance & Face Rec**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/attendance/scan` | Scan QR code |
| POST | `/attendance/generate-qr` | Generate dynamic QR |
| POST | `/admin/face/register` | Register student face |
| POST | `/admin/face/recognize` | Mark attendance via face |

### **Analytics**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/analytics/peak-hours` | Get busy times |
| GET | `/analytics/anomalies` | Get absent alerts |
| GET | `/analytics/daily-trends` | 7-day attendance trend |

---

## 🔒 Security Measures
- **JWT Protection**: All protected routes require a valid Bearer token.
- **Password Hashing**: Bcrypt is used for all password storage.
- **Input Validation**: Pydantic schemas prevent invalid data entry.
- **QR Security**: 5-minute expiration + One-time use prevention on QR codes.

---

## 🤝 Contributing
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/NewFeature`)
3. Commit your Changes (`git commit -m 'Add some NewFeature'`)
4. Push to the Branch (`git push origin feature/NewFeature`)
5. Open a Pull Request

---

**Built with ❤️ for a smarter campus experience.**
