# AgeWell MVP Scope

## Phase 1 Technical Boundaries
- **Mobile First:** The MVP strictly focuses on delivering the React Native / Expo application natively for iOS and Android. 
- **Web App Deferral:** The Next.js web application is out of scope for the MVP phase build, but the backend API architecture must be completely agnostic and designed to support it seamlessly in the following phase.
- **Modular Monolith Backend:** The API is built entirely as a single FastAPI Python application containing strictly bounded domains. No microservices will be provisioned in the initial infrastructure footprint.

## Functional Included Scope
- **Core Mobile Modes:** Functional implementation of Senior Mode and Family Mode with appropriate UI variances. Care Manager interfaces for visit completion.
- **Advanced Data Privacy Context:** Complete implementation of the multi-family member authorization concept for a single senior, ensuring varying permission contexts (financial vs. health data).
- **Service Workflows:** Complete implementation of the state tracking from "Requested" to "Completed" for standard service variants.
- **Abstract Memberships:** A purely data-driven membership plan and usage meter system without hardcoding product pricing strings or plan definitions in the codebase.
- **Emergency & GPS:** Basic emergency state triggers, Redis-powered temporary tracking functionality for active Care Associates, and push notifications for alerting.

## Out of Scope for MVP
- Admin/Operations Next.js web dashboard.
- Full custom complex CMS for the Community and Events tabs (to use simpler structured static or lightweight remote data initially).
- Custom chat/messaging replacement for WhatsApp.
- Direct automated EMS/Ambulance booking API integrations.
- Wearables / Custom IoT hardware synchronisation.
