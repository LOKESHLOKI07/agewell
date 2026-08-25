# AgeWell India — Family App (Phase 1)

AgeWell helps elderly people live independently while giving their children and family members visibility, support, healthcare coordination, and peace of mind.

Phase 1 is a **polished Family mobile app UI prototype** built with React Native and Expo. It uses mock data only. There is no backend, no real authentication, and no live payments or emergency calling.

## Tech stack

- React Native + Expo SDK 57
- TypeScript (strict)
- Expo Router
- Zustand
- React Hook Form + Zod
- ESLint + Prettier

## Install

```bash
npm install
```

Copy environment placeholders if you want them locally:

```bash
copy .env.example .env
```

`EXPO_PUBLIC_API_URL` stays empty in Phase 1. Mock services are used.

## Run

```bash
npm start
```

Then:

- press `a` for Android
- press `i` for iOS (macOS)
- scan the QR code with Expo Go
- press `w` for web

Other scripts:

```bash
npm run android
npm run ios
npm run web
npm run lint
npm run typecheck
```

## Folder structure

```
src/
  app/                 Expo Router screens and layouts
  components/          Shared UI (buttons, cards, states)
  features/            Screen implementations grouped by feature
  store/               Zustand stores
  hooks/               Shared hooks
  services/            Data access (mock now, FastAPI later)
  types/               Backend-shaped TypeScript models
  constants/           Design tokens and app config
  utils/               Dates, greetings, status labels
  mock/                Centralized mock data
```

Screens in `src/app/` stay thin. They re-export feature screens so routing stays simple and UI logic stays inside features.

## Navigation

Bottom tabs:

1. Home
2. Care
3. Services
4. Alerts
5. Profile

Stack screens (opened from tabs):

- Parent profile
- Visit details and full report
- Request service and success
- Appointments and add appointment
- Emergency and emergency status
- Payments
- Account settings (membership, payment methods, notifications, privacy, help)

Flow:

Splash → Login → Mock OTP (`123456`) → Home tabs

## Mock data

All sample records live in `src/mock/`:

- `users.ts` — Rahul Sharma (family member)
- `seniors.ts` — Lakshmi Sharma, 72, Borivali West
- `careManagers.ts` — Priya Nair
- `visits.ts` — scheduled and completed visits plus reports
- `appointments.ts` — Dr. Mehta, Cardiology
- `services.ts` — eight family services
- `notifications.ts` — visit, appointment, care, payment, and service alerts
- `payments.ts` / `memberships.ts` — AgeWell Family, ₹9,999/month

UI components do not hardcode this data.

## Mock authentication

1. Enter a 10-digit Indian mobile number.
2. Continue calls `authService.requestOtp()`.
3. The OTP screen accepts `123456`.
4. `authService.verifyOtp()` returns the mock family user.
5. Zustand `authStore` marks the session as authenticated.

No passwords are stored. Real SMS OTP can replace `authService` later without changing the screens.

## Connecting to FastAPI later

Keep screens talking to `src/services/`, not to mock files.

In Phase 2, each service function can switch from mock arrays to `fetch(`${EXPO_PUBLIC_API_URL}/...`)`.

The TypeScript models in `src/types/` already match the likely backend entities:

User, Family, Senior, Membership, CareManager, Visit, VisitReport, Appointment, ServiceRequest, EmergencyCase, Notification, Payment.

See `PHASE_1.md` for what is in and out of this release.

## Google Maps (Care Associate live tracking)

Live tracking uses `react-native-maps` with `PROVIDER_GOOGLE`. Do not put API keys in source files.

1. Create a Google Cloud project.
2. Enable **Maps SDK for Android** and **Maps SDK for iOS**.
3. Create restricted API keys:
   - Android: application restriction = Android apps, package `in.agewell.family`, plus the app SHA-1.
   - iOS: application restriction = iOS apps, bundle `in.agewell.family`.
4. Put the keys in a local `.env` (never commit it):

```
ANDROID_GOOGLE_MAPS_API_KEY=
IOS_GOOGLE_MAPS_API_KEY=
```

`app.config.js` reads those variables at prebuild time for the `react-native-maps` config plugin. Rebuild the native app after changing keys (`npx expo prebuild` / EAS). Expo Go can show a map without keys; store binaries and Google Maps on iOS require them.

