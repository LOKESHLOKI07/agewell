# AgeWell Emergency Widget

The AgeWell Emergency Widget is an additional entry point into the **existing** emergency system. It does not call 911, ambulance services, police, or civic emergency services. It does not create a second API, table, or escalation path.

```
Home-screen widget
  → confirmation screen (hold 3 seconds)
  → POST /api/v1/emergency/
       type = MEDICAL
       trigger_source = HOME_PANIC_BUTTON
  → emergency service
  → PostgreSQL (emergency_cases / recipients / events)
  → Family + Companion notified immediately
  → ~30 seconds later, durable escalation job
  → Care Manager + AgeWell Support if nobody acknowledged
```

## 1. How the widget works

1. After a **development build** or EAS APK is installed, the senior adds **AgeWell Emergency** from the Android widget picker (or iOS widget gallery).
2. The widget shows only AgeWell branding, 🆘, **EMERGENCY**, and **Get Help**. It stores no tokens, names, addresses, or GPS.
3. A tap does **not** create an emergency. Android App Widgets and iOS WidgetKit cannot reliably implement the in-app 3-second hold, so the tap opens `agewell://emergency/widget-sos`.
4. That confirmation screen uses the same 3-second hold as in-app SOS, then calls the existing create-emergency API with `HOME_PANIC_BUTTON`.
5. The backend remains the authority: authentication, senior identity, active membership, service-area eligibility, and duplicate active-case checks all run on the server.

In-app SOS is unchanged: hold SOS 3 seconds → `APP_SOS`.

## 2. Android implementation

The project is **Expo SDK 57** (managed workflow + EAS Build, Continuous Native Generation). There is no committed `android/` folder.

Android home-screen widgets need native `AppWidgetProvider` code, so this uses `react-native-android-widget` (Expo config plugin, compatible with Expo ≥54 / React 19). Expo Go cannot show the widget.

- Widget UI: `src/features/emergency/widget/AgeWellEmergencyWidget.tsx`
- Task handler: `src/features/emergency/widget/widgetTaskHandler.tsx`
- Config plugin: family variant only, in `app.config.js`
- Click: `OPEN_URI` → `agewell://emergency/widget-sos`

The Care app variant (`APP_VARIANT=care`) does not register this widget.

## 3. iOS implementation

iOS uses WidgetKit via `@bacons/apple-targets` (production path for Expo SDK 53+). Official `expo-widgets` is still alpha and is not used.

- Target: `targets/emergency-widget/`
- The whole widget is tappable (`widgetURL`) and opens the same confirmation route.
- Interactive App Intents that fire SOS without opening the app are intentionally not used: confirmation must happen in the authenticated app.
- Building/testing iOS requires macOS + Xcode, or EAS iOS. This Windows development machine cannot install the iOS widget locally.

## 4. Authentication handoff (security decision)

The main app stores JWTs in **Expo SecureStore** (`agewell.access_token` / `agewell.refresh_token`). Home-screen widgets run in a separate process and cannot read SecureStore.

**Decision:** do not copy JWTs, passwords, or API secrets into SharedPreferences, App Groups, or widget storage.

Handoff:

1. Widget tap opens the app with a deep link.
2. Root layout hydrates the existing SecureStore session (and skips the splash video for this link).
3. If the user is not signed in, Expo Router's auth guard sends them to sign-in.
4. The confirmation screen then uses the normal `apiClient` Authorization header.

The widget is visible even when logged out; activation still cannot bypass login, membership, or service-area checks.

## 5. Emergency API integration

Existing endpoint: `POST /api/v1/emergency/`

Body from the widget:

```json
{ "type": "MEDICAL", "trigger_source": "HOME_PANIC_BUTTON" }
```

`senior_id` is resolved from the authenticated user. Location remains the static senior address / preferred hospital snapshot. Live phone GPS is not sent.

## 6. `HOME_PANIC_BUTTON`

The API already accepted this trigger (alongside `APP_SOS`). The in-app SOS tab still sends `APP_SOS`. The widget is the first client that sends `HOME_PANIC_BUTTON`. Notifications label it “Home Panic Button”.

## 7. Existing emergency state machine

Statuses: `OPEN` → `ACKNOWLEDGED` / `ASSIGNED` → `IN_PROGRESS` → `RESOLVED` or `CANCELLED`.

On create:

- Case is `OPEN` with a case number (`AW-EMG-YYYY-######`).
- Recipients: Family, Companion (notified immediately), Care Manager and AgeWell Support (stand by).
- If Family acknowledges first, status becomes `ACKNOWLEDGED`.
- If Companion / Care Manager / Support acknowledges, status becomes `IN_PROGRESS`.
- Staff file a report to `RESOLVED`.

**Duplicate rule:** a senior cannot open a second case while one is `OPEN`, `ACKNOWLEDGED`, `ASSIGNED`, or `IN_PROGRESS` (HTTP 409). The widget confirmation screen opens the active case instead.

## 8. Escalation mechanism

Business rule (unchanged): escalate only when the case is not `RESOLVED` or `CANCELLED`, and neither Family nor Companion has acknowledged.

Previously this was only `asyncio.sleep` in the API process, so a restart could drop the timer.

Infrastructure found: PostgreSQL is the system of record. `REDIS_URL` is configured and the `redis` package is installed, but **no Celery/RQ workers exist** and Redis is unused in application code. The smallest production-safe fix is therefore **Postgres-backed**:

- `emergency_cases.escalation_due_at` is set on create (`now + SOS_FIRST_RESPONSE_ESCALATION_SECONDS`, default 30).
- A FastAPI lifespan poller (every ~2s) plus a same-process timer claim due rows (`escalation_dispatched_at`) and call existing `escalate_if_needed`.
- On API startup, overdue undispatched rows are recovered. A restart cannot lose the job.

Redis is not required for correctness. A future Celery/RQ worker can keep the same columns.

## 9. Security considerations

- Widget UI contains no PII, tokens, or credentials.
- Backend enforces auth (401), membership (403), service area (403), and duplicate active cases (409).
- Service-area and duplicate checks now run on create for all SOS entry points, so the widget cannot bypass rules the SOS tab already intended.
- Admin / Operations / assigned care staff may still create a case for a senior (membership/area gates match prior staff behaviour).
- Confirmation hold lives in the app, not on the widget surface.

## 10. How to build the app

Widgets are **not** available in Expo Go. You need a development build or an EAS APK.

From the repo root (family app, not Care):

```bash
npm install
```

### Development build (Android, USB device)

```bash
npx expo prebuild --platform android
npx expo run:android
```

Or start Metro after a prebuild:

```bash
npx expo start --dev-client
```

### EAS Android APK (physical install)

Existing preview profile in `eas.json`:

```bash
npx eas-cli build --platform android --profile preview
```

Install the downloaded APK on the phone.

### iOS (Mac or EAS only)

```bash
npx expo prebuild --platform ios
npx expo run:ios
```

EAS does not currently define an iOS profile in `eas.json`. Add one when you are ready to ship TestFlight, then:

```bash
npx eas-cli build --platform ios --profile preview
```

## 11. Install and test the widget on a physical Android device

1. Sign in as a **senior** with **active membership** in Kandivali / Borivali.
2. Long-press the home screen → **Widgets** → **AgeWell India** → **AgeWell Emergency**.
3. Place the widget. Confirm it shows AgeWell, 🆘, EMERGENCY, Get Help — no name, address, or token.
4. Tap once. The app should open the confirmation screen (splash is skipped on this deep link).
5. Release immediately: no case should be created.
6. Press and hold **Get Help** for 3 seconds. A `MEDICAL` case with `HOME_PANIC_BUTTON` should open as `OPEN`.
7. Family and assigned Companion should be notified immediately. After ~30 seconds, if neither acknowledged, Care Manager and AgeWell Support are notified.
8. Tap the widget again: you should land on the active case (duplicate create is rejected).
9. Sign out, tap the widget: you must sign in. The widget still cannot call the API.
10. Sign in as family/care/admin: the confirmation screen must not send SOS for those roles.
11. Restart the API process after creating a case and before 30 seconds: escalation should still fire.

API for inspection:

```bash
cd "apps/api"
.\venv\Scripts\activate
alembic upgrade head
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

## 12. How to test on iOS if supported

On a Mac with Xcode 16+:

1. `npx expo prebuild --platform ios && npx expo run:ios`
2. Long-press the Home Screen → **Edit** → **Add Widget** → **AgeWell Emergency**.
3. Tap the widget. It opens `agewell://emergency/widget-sos`. Continue from step 4 in the Android list.

On Windows, iOS widget testing is not available locally.

## TODO — Emergency Current Location (not in this change)

Live phone GPS must **not** be attached to emergency create yet. A future **Emergency Current Location** feature needs its own Android/iOS background-location permission and privacy design. Until then, cases keep the static address + preferred hospital snapshot.

## Automated tests

Backend (`apps/api`). These tests expect the demo seed users (`senior@example.com` / `password123` and related accounts from `python seed.py`):

```bash
cd apps/api
.\venv\Scripts\activate
pytest tests/test_emergency.py tests/test_notifications.py
```

Mobile:

```bash
npm test -- src/features/emergency/__tests__/emergencyWidget.test.ts src/features/emergency/__tests__/emergencyFlow.test.ts src/api/__tests__/errors.test.ts
```

Device-only checks (widget picker, physical tap) cannot run in Jest.
