# AgeWell Product Requirements

## Overview
AgeWell is a production-grade eldercare and family-support platform. The initial rollout focuses entirely on a robust mobile application with Senior Mode, Family Mode, and Care Manager experiences. The backend provides unified API support that will eventually power the Next.js web ecosystem (Admin, Operations, Care Management, Reporting).

## Services Lifecycle
Services span Care, Food & Home, Health, Mobility, Life & Community, and Add-ons.
All service requests follow a unified state machine lifecycle:
- Requested
- Confirmed
- Assigned
- Scheduled
- In Progress
- Completed
- Cancelled

## Health Records & Storage
- **Data Categories:** Medical history, Medical reports, Medication, Doctors, Appointments, Physiotherapy, Lab tests, Emergency information.
- **Storage:** Health documents will be strictly segregated and stored privately and securely in object storage (AWS S3 or equivalent).

## Emergency Support
- **Categories:** Medical Emergency, Hospital Assistance, Care Manager Assistance, Call AgeWell.
- **Actions:** Share Location, Confirmation prompt to prevent accidental triggers, Emergency Case generation.
- **Tracking:** Full status tracking, authorized family notifications, and audit history.
- **Constraint:** The platform does not position itself as a direct medical emergency service or ambulance replacement; it is an orchestration and assistance layer.

## Memberships
- **Dynamic Configuration:** NO hardcoded pricing. The system operates on a flexible schema.
- **Configurable Entities:** Plan, Price, Billing cycle, Benefits, Quotas, Usage, Validity, Add-ons, Upgrade paths, Renewal logic.

## Notifications
- **Types:** Information, Important, Emergency.
- **Delivery:** Must respect configuration preferences, recipient rules, and authorization boundaries across Firebase Cloud Messaging (FCM).
