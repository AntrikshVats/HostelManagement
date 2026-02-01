"""
Database Initialization Script
Creates sample data for testing SmartHostel system
"""

import sys
import os
from datetime import datetime, date, timedelta
import random

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, SessionLocal
from app.models import (
    Base, Student, Employee, Room, RoomAssignment, Attendance, MenuPool,
    MenuItem, OptOut, PhoneNumber, UserRole, DietaryPreference, DayOfWeek,
    MealTime, AttendanceType, RoomType
)
from app.auth import get_password_hash


def init_database():
    """Drop all tables and recreate them."""
    print("🗄️  Initializing database...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully!")


def create_sample_data():
    """Create sample data for testing."""
    db = SessionLocal()
    
    try:
        print("\n📝 Creating sample data...")
        
        # Create admin account
        print("Creating admin account...")
        admin = Employee(
            ssn="000-00-0000",
            first_name="System",
            middle_name="",
            last_name="Admin",
            role=UserRole.ADMIN,
            email="admin@smarthostel.com",
            password_hash=get_password_hash("admin123"),
            phone_number="9999999999"
        )
        db.add(admin)
        
        # Create warden account
        warden = Employee(
            ssn="000-00-0001",
            first_name="John",
            middle_name="",
            last_name="Warden",
            role=UserRole.WARDEN,
            email="warden@smarthostel.com",
            password_hash=get_password_hash("warden123"),
            phone_number="9999999998"
        )
        db.add(warden)
        db.commit()
        
        # Create rooms
        print("Creating rooms...")
        blocks = ['A', 'B', 'C']
        room_types = [RoomType.SINGLE, RoomType.DOUBLE, RoomType.TRIPLE]
        
        for block in blocks:
            for floor in range(1, 4):
                for room_num in range(1, 11):
                    room_type = random.choice(room_types)
                    capacity = {'Single': 1, 'Double': 2, 'Triple': 3}[room_type.value]
                    
                    room = Room(
                        room_no=f"{block}{floor}0{room_num}",
                        block=block,
                        floor=floor,
                        capacity=capacity,
                        room_type=room_type
                    )
                    db.add(room)
        db.commit()
        print(f"✅ Created {blocks.__len__() * 3 * 10} rooms")
        
        # Create students
        print("Creating students...")
        departments = ["Computer Science", "Electrical", "Mechanical", "Civil", "Electronics"]
        first_names = ["Rahul", "Priya", "Amit", "Sneha", "Vikram", "Anjali", "Rohan", "Pooja", 
                      "Arjun", "Nisha", "Karan", "Divya", "Aditya", "Kavya", "Aryan", "Riya",
                      "Sanjay", "Meera", "Varun", "Shreya"]
        last_names = ["Sharma", "Patel", "Kumar", "Singh", "Reddy", "Nair", "Gupta", "Joshi",
                     "Verma", "Iyer", "Rao", "Mehta", "Shah", "Desai", "Pillai"]
        
        students = []
        for i in range(20):
            first_name = first_names[i]
            last_name = random.choice(last_names)
            roll_num = f"20{random.randint(21, 24)}{random.choice(['CS', 'EE', 'ME', 'CE'])}{str(i+1).zfill(3)}"
            
            student = Student(
                first_name=first_name,
                middle_name="" if random.random() > 0.5 else random.choice(["Kumar", "Bhai", "Raj"]),
                last_name=last_name,
                email=f"{first_name.lower()}.{last_name.lower()}@student.smarthostel.com",
                password_hash=get_password_hash("student123"),
                roll_number=roll_num,
                department=random.choice(departments),
                year=random.randint(1, 4),
                dietary_preference=random.choice(list(DietaryPreference))
            )
            db.add(student)
            students.append(student)
        
        db.commit()
        db.refresh(students[0])
        print(f"✅ Created {len(students)} students")
        
        # Add phone numbers for students
        print("Adding phone numbers...")
        for student in students:
            phone = PhoneNumber(
                student_id=student.student_id,
                phone_number=f"98{random.randint(10000000, 99999999)}",
                phone_type="Mobile"
            )
            db.add(phone)
        db.commit()
        
        # Assign rooms to students
        print("Assigning rooms...")
        rooms = db.query(Room).all()
        for i, student in enumerate(students):
            room = rooms[i % len(rooms)]
            assignment = RoomAssignment(
                student_id=student.student_id,
                room_no=room.room_no,
                assigned_date=date.today() - timedelta(days=random.randint(10, 90)),
                is_active=True
            )
            db.add(assignment)
        db.commit()
        print(f"✅ Assigned rooms to students")
        
        # Create attendance records (last 30 days)
        print("Generating attendance records...")
        attendance_count = 0
        for student in students:
            # Generate attendance for last 30 days
            for day_offset in range(30, 0, -1):
                target_date = datetime.now() - timedelta(days=day_offset)
                
                # 80% chance of attendance
                if random.random() < 0.8:
                    # Morning IN
                    in_time = target_date.replace(
                        hour=random.randint(6, 9),
                        minute=random.randint(0, 59)
                    )
                    attendance_in = Attendance(
                        student_id=student.student_id,
                        timestamp=in_time,
                        type=AttendanceType.IN,
                        location="Main Gate"
                    )
                    db.add(attendance_in)
                    attendance_count += 1
                    
                    # Evening OUT (some students)
                    if random.random() < 0.6:
                        out_time = target_date.replace(
                            hour=random.randint(17, 23),
                            minute=random.randint(0, 59)
                        )
                        attendance_out = Attendance(
                            student_id=student.student_id,
                            timestamp=out_time,
                            type=AttendanceType.OUT,
                            location="Main Gate"
                        )
                        db.add(attendance_out)
                        attendance_count += 1
                        
                        # Late return (some students)
                        if random.random() < 0.3:
                            return_time = out_time + timedelta(hours=random.randint(2, 5))
                            if return_time.day == out_time.day:
                                attendance_return = Attendance(
                                    student_id=student.student_id,
                                    timestamp=return_time,
                                    type=AttendanceType.IN,
                                    location="Main Gate"
                                )
                                db.add(attendance_return)
                                attendance_count += 1
        
        db.commit()
        print(f"✅ Created {attendance_count} attendance records")
        
        # Create menu pools
        print("Creating menu pools...")
        days = list(DayOfWeek)
        meals = list(MealTime)
        
        menu_items_data = {
            MealTime.BREAKFAST: [
                ("Idli Sambar", "Steamed rice cakes with lentil soup", 250),
                ("Poha", "Flattened rice with spices", 200),
                ("Bread Toast", "Toast with butter and jam", 180),
                ("Coffee", "Hot coffee", 50),
                ("Tea", "Hot tea", 40)
            ],
            MealTime.LUNCH: [
                ("Dal Rice", "Yellow lentils with steamed rice", 400),
                ("Chapati", "Whole wheat flatbread", 150),
                ("Paneer Curry", "Cottage cheese curry", 350),
                ("Chicken Curry", "Spicy chicken curry", 450),
                ("Curd", "Fresh yogurt", 80)
            ],
            MealTime.DINNER: [
                ("Roti", "Indian flatbread", 140),
                ("Mixed Vegetables", "Seasonal vegetable curry", 250),
                ("Dal Fry", "Spiced lentils", 200),
                ("Fish Curry", "Fish in spicy gravy", 400),
                ("Rice", "Steamed basmati rice", 300)
            ],
            MealTime.SNACKS: [
                ("Samosa", "Fried pastry with filling", 180),
                ("Pakora", "Fried fritters", 150),
                ("Tea", "Evening tea", 40)
            ]
        }
        
        for day in days:
            for meal in meals:
                # Veg menu pool
                pool_veg = MenuPool(
                    day_of_week=day,
                    meal_time=meal,
                    meal_category=DietaryPreference.VEG
                )
                db.add(pool_veg)
                db.commit()
                db.refresh(pool_veg)
                
                # Add menu items
                for item_name, item_desc, calories in menu_items_data.get(meal, []):
                    if "Chicken" not in item_name and "Fish" not in item_name:
                        menu_item = MenuItem(
                            pool_id=pool_veg.pool_id,
                            item_name=item_name,
                            item_description=item_desc,
                            calories=calories,
                            is_available=True
                        )
                        db.add(menu_item)
                
                # Non-veg menu pool for Lunch and Dinner
                if meal in [MealTime.LUNCH, MealTime.DINNER]:
                    pool_nonveg = MenuPool(
                        day_of_week=day,
                        meal_time=meal,
                        meal_category=DietaryPreference.NON_VEG
                    )
                    db.add(pool_nonveg)
                    db.commit()
                    db.refresh(pool_nonveg)
                    
                    # Add menu items
                    for item_name, item_desc, calories in menu_items_data.get(meal, []):
                        menu_item = MenuItem(
                            pool_id=pool_nonveg.pool_id,
                            item_name=item_name,
                            item_description=item_desc,
                            calories=calories,
                            is_available=True
                        )
                        db.add(menu_item)
        
        db.commit()
        print(f"✅ Created menu pools and items")
        
        # Create opt-out records
        print("Creating opt-out records...")
        optout_count = 0
        for student in students:
            # Random opt-outs for next 7 days
            for day_offset in range(7):
                target_date = date.today() + timedelta(days=day_offset)
                
                # Random opt-out (20% chance)
                if random.random() < 0.2:
                    meal = random.choice(list(MealTime))
                    opt_out = OptOut(
                        student_id=student.student_id,
                        date=target_date,
                        meal_time=meal,
                        opt='Y',
                        reason="Personal" if random.random() < 0.5 else "Going out"
                    )
                    db.add(opt_out)
                    optout_count += 1
        
        db.commit()
        print(f"✅ Created {optout_count} opt-out records")
        
        print("\n✨ Sample data creation completed successfully!")
        print("\n🔑 Default Credentials:")
        print("   Admin: admin@smarthostel.com / admin123")
        print("   Warden: warden@smarthostel.com / warden123")
        print("   Students: <firstname>.<lastname>@student.smarthostel.com / student123")
        print(f"\n📊 Summary:")
        print(f"   - {db.query(Employee).count()} employees")
        print(f"   - {db.query(Student).count()} students")
        print(f"   - {db.query(Room).count()} rooms")
        print(f"   - {db.query(Attendance).count()} attendance records")
        print(f"   - {db.query(OptOut).count()} opt-out records")
        
    except Exception as e:
        print(f"❌ Error creating sample data: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("=" * 60)
    print("SmartHostel Database Initialization")
    print("=" * 60)
    
    init_database()
    create_sample_data()
    
    print("\n" + "=" * 60)
    print("✅ Database initialization complete!")
    print("=" * 60)
