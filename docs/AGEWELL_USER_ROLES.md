# AgeWell User Roles & Modes

## User Model Hierarchy
- **User:** The base identity entity powering login and authentication across the platform.
- **Senior:** The end-user of care and services, utilizing an accessible interface via Senior Mode.
- **Family:** Relatives of the senior monitoring and supporting care. 
  - **Granular Permissions:** The relationship model must support many-to-many connections. One senior can be connected to multiple authorized family members. It cannot be assumed that every family member has identical access rights to sensitive health, location, or financial data.
- **Care Manager (Care Associate):** Staff who deliver services, manage visits, and perform on-the-ground support.
- **Admin/Operations:** Back-office staff managing the ecosystem (initially via API, later via the Web app).

## Senior Mode Experience
The experience tailored for the eldercare recipient includes:
- Safety assurance checks
- Today's care itinerary
- Quick access to select Services
- Health dashboard overview
- Upcoming Appointments and Medication reminders
- Highly visible Emergency triggers
- Community elements (events, trips, entertainment)
- Profile management

## Family Mode Experience
The experience tailored for family members actively monitoring and managing care:
- Parent wellbeing summary dashboard
- Today's activity overview
- Live Care Associate status and GPS tracking (if active and permitted)
- Visit and Appointment tracking
- Health information (gated strictly by that specific family member's permissions)
- Requesting Services on behalf of the senior
- Membership and Payments management
- Push Notifications and Emergency alerts
