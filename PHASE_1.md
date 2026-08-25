# Phase 1 — Family App UI Prototype

Phase 1 delivers a complete Family Member experience for AgeWell India using mock data. It is a mobile-first Expo app. No backend was built.

## Completed screens

- Splash
- Login
- Mock OTP
- Home dashboard
- Care (care plan, manager, visit history)
- Visit details
- Full visit report
- Parent profile
- Services catalogue
- Request service
- Request received
- Appointments list
- Add appointment
- Alerts
- Emergency assistance (UI only)
- Emergency status (mock)
- Payments / membership history
- Profile
- Membership, payment methods, notification settings, privacy, help

## Components

- AppHeader
- ParentCard
- StatusBadge
- VisitCard
- AppointmentCard
- ServiceCard
- NotificationCard
- EmergencyButton
- PrimaryButton / SecondaryButton
- SectionHeader
- EmptyState / LoadingState / ErrorState
- Screen, TextField, ConfirmDialog, BrandMark

## Mock services

These live in `src/services/` and currently return mock data:

- `authService`
- `seniorService`
- `visitService`
- `appointmentService`
- `serviceRequestService`
- `notificationService`
- `paymentService`
- `emergencyService`

Zustand is used only for:

- current user / auth
- selected parent
- service requests
- notifications

## Known limitations

- No FastAPI, PostgreSQL, or real API client
- OTP is hardcoded to `123456`
- No Razorpay, Firebase, WhatsApp, or GPS
- Emergency flow does **not** call 112 / ambulance / phone dialer
- No Care Manager app
- No real medical records or payment instruments
- Service requests and new appointments persist only in memory until the app reloads
- Network/offline states are implemented as reusable UI, not live connectivity checks

## Future backend integration points

Replace the body of each function in `src/services/` with FastAPI calls. Suggested endpoints:

- `POST /auth/otp/request` and `POST /auth/otp/verify`
- `GET /families/me/seniors`
- `GET /seniors/:id`
- `GET /seniors/:id/visits` and `GET /visits/:id/report`
- `GET /seniors/:id/appointments` and `POST /appointments`
- `GET /services` and `POST /service-requests`
- `GET /notifications`
- `GET /payments` and `GET /memberships/current`
- `POST /emergency-cases`

Keep using the TypeScript models in `src/types/`. Set `EXPO_PUBLIC_API_URL` in `.env`.

## Phase 2 recommendations

1. Wire services to FastAPI with a small `apiClient`.
2. Replace mock OTP with real mobile verification.
3. Persist auth session securely.
4. Add Razorpay for membership billing.
5. Add push notifications for visits, appointments, and emergency cases.
6. Implement real emergency coordination with explicit user confirmation.
7. Start the Care Manager app using the same design tokens and models.
8. Add automated tests for auth, service requests, and navigation.

Do not start Phase 2 until it is explicitly requested.
