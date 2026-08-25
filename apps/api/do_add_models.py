import os

def append_to_file(filepath, content):
    with open(filepath, "a") as f:
        f.write("\n" + content)

# 1. Healthcare
healthcare_additions = """
class Medication(Base):
    __tablename__ = "medications"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    senior_id = Column(UUID(as_uuid=True), ForeignKey("seniors.id"))
    name = Column(String)
    dosage = Column(String)

class MedicationSchedule(Base):
    __tablename__ = "medication_schedules"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    medication_id = Column(UUID(as_uuid=True), ForeignKey("medications.id"))
    schedule_time = Column(String)
    frequency = Column(String)

class HealthDocument(Base):
    __tablename__ = "health_documents"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    senior_id = Column(UUID(as_uuid=True), ForeignKey("seniors.id"))
    file_url = Column(String)
    document_type = Column(String)

class LabResult(Base):
    __tablename__ = "lab_results"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    senior_id = Column(UUID(as_uuid=True), ForeignKey("seniors.id"))
    test_name = Column(String)
    result_value = Column(String)
    date = Column(DateTime)
"""
append_to_file("app/modules/healthcare/models.py", healthcare_additions)

# 2. Visits
visits_additions = """from sqlalchemy import Boolean
class VisitTask(Base):
    __tablename__ = "visit_tasks"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    visit_id = Column(UUID(as_uuid=True), ForeignKey("visits.id"))
    task_name = Column(String)
    is_completed = Column(Boolean, default=False)

class VisitReport(Base):
    __tablename__ = "visit_reports"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    visit_id = Column(UUID(as_uuid=True), ForeignKey("visits.id"))
    summary = Column(String)
    issues_noted = Column(String)
"""
append_to_file("app/modules/visits/models.py", visits_additions)

# 3. Memberships
memberships_additions = """from sqlalchemy import Integer
class MembershipBenefit(Base):
    __tablename__ = "membership_benefits"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plan_id = Column(UUID(as_uuid=True), ForeignKey("membership_plans.id"))
    benefit_name = Column(String)
    quota = Column(Integer)

class MembershipUsageLedger(Base):
    __tablename__ = "membership_usage_ledger"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    membership_id = Column(UUID(as_uuid=True), ForeignKey("memberships.id"))
    benefit_id = Column(UUID(as_uuid=True), ForeignKey("membership_benefits.id"))
    used_amount = Column(Integer)
    date_used = Column(DateTime, server_default=func.now())
"""
append_to_file("app/modules/memberships/models.py", memberships_additions)

# 4. Orders
orders_additions = """
class OrderItem(Base):
    __tablename__ = "order_items"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"))
    item_name = Column(String)
    price = Column(Numeric(10, 2))
"""
append_to_file("app/modules/orders/models.py", orders_additions)

# 5. Payments
payments_additions = """
class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    payment_id = Column(UUID(as_uuid=True), ForeignKey("payments.id"))
    transaction_reference = Column(String)
    status = Column(Enum(PaymentStatus))
"""
append_to_file("app/modules/payments/models.py", payments_additions)

# 6. Notifications
notifications_additions = """from sqlalchemy import Boolean
class NotificationPreference(Base):
    __tablename__ = "notification_preferences"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    email_enabled = Column(Boolean, default=True)
    push_enabled = Column(Boolean, default=True)
    sms_enabled = Column(Boolean, default=False)
"""
append_to_file("app/modules/notifications/models.py", notifications_additions)

# 7. Community
community_additions = """from sqlalchemy import ForeignKey
class EventRegistration(Base):
    __tablename__ = "event_registrations"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id = Column(UUID(as_uuid=True), ForeignKey("community_events.id"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    status = Column(String)
"""
append_to_file("app/modules/community/models.py", community_additions)

# 8. Tracking
tracking_additions = """from sqlalchemy import DateTime
class LocationPoint(Base):
    __tablename__ = "location_points"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("location_sessions.id"))
    latitude = Column(String)
    longitude = Column(String)
    timestamp = Column(DateTime)
"""
append_to_file("app/modules/tracking/models.py", tracking_additions)

# 9. Emergency
emergency_additions = """
class EmergencyEvent(Base):
    __tablename__ = "emergency_events"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id = Column(UUID(as_uuid=True), ForeignKey("emergency_cases.id"))
    event_description = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
"""
append_to_file("app/modules/emergency/models.py", emergency_additions)
