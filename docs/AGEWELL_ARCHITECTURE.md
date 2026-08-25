# AgeWell Technical Architecture

## Core Tech Stack
- **Mobile Application:** React Native + Expo + TypeScript
- **Web Application:** Next.js + TypeScript (Using shared backend)
- **Backend API:** FastAPI + Python (Modular Monolith)
- **Database:** PostgreSQL
- **Cache & Realtime State:** Redis
- **Object Storage:** AWS S3 (or equivalent private object storage) for documents and medical reports
- **Background Processing:** Celery/RQ for scheduled tasks and asynchronous processing
- **Push Notifications:** Firebase Cloud Messaging (FCM) / APNs (React Native/Expo compatible)
- **Payments:** Razorpay (initial integration)
- **Maps / Location:** Google Maps (or equivalent mapping provider)
- **Future Communications:** WhatsApp / SMS integrations

## Backend Architecture Pattern
The backend is structured as a **Modular Monolith**. We are deliberately explicitly avoiding microservices in the initial phase. The codebase and database schemas will be organized into bounded contexts (domains) to ensure separation of concerns. This allows extracting specific domains into microservices smoothly if AgeWell scales massively in the future.

## Major Backend Domains
The modular monolith will be divided into the following domains:
- `auth`
- `users`
- `families`
- `seniors`
- `access/consent`
- `care`
- `care managers`
- `visits`
- `appointments`
- `services`
- `healthcare`
- `emergency`
- `tracking`
- `memberships`
- `membership usage`
- `add-ons`
- `orders`
- `payments`
- `notifications`
- `documents`
- `community`
- `events`
- `trips`
- `entertainment`
- `admin`
- `audit`

## GPS and Care Associate Tracking
- **Realtime Infrastructure:** Care Associate location updates will be streamed via Redis/WebSockets rather than persisting every coordinate ping into PostgreSQL to avoid database bloat.
- **Privacy & Authorization:** Tracking visibility is strictly governed by RBAC (Role-Based Access Control) and user privacy settings, ensuring only authorized family members and operations staff can access real-time locations during active visits.

## Web Application Integration
- The future Next.js application MUST use the same FastAPI backend APIs. There will not be a separate backend for web. Both mobile and web clients will authenticate and consume from the unified modular monolith.
