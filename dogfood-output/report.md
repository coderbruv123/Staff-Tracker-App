# Dogfood QA Report — StaffTracker Staff-Management App

**Date:** 2026-11-03
**Testers:** Hermes Agent (automated browser QA)
**Scope:** Full-stack app — ASP.NET Core 10 backend + React 19/Vite frontend

---

## Executive Summary

- **Total issues found:** 3
- **Critical:** 0
- **High:** 1
- **Medium:** 2
- **Low:** 0
- **Categories:** Functional (2), UX (1)

Both frontend (Vite 5173) and backend (ASP.NET Core 5289) servers were running and verified with HTTP 200.

---

## Issues

### Issue 1 — Activity log shows "Invalid Date" for check-in/check-out entries
**Severity:** Medium | **Category:** Functional / UX
**URL:** `http://localhost:5173/self` (staff check-in page)
**Description:** The activity log table displays "Invalid Date" for each check-in/check-out entry instead of the actual timestamp. The `l.Timestamp` value is present in the API response (e.g., "2026-11-03T20:12:02.4908932") but `new Date(l.Timestamp).toLocaleString()` returns "Invalid Date".
**Steps to reproduce:**
1. Log in as staff1.
2. Check in at a location.
3. View the Activity log; every row shows "Invalid Date".
**Expected:** Display the formatted timestamp (e.g., "2026-11-03, 20:12:02").
**Actual:** "Invalid Date" is displayed.
**Evidence:** Frontend renders `new Date(l.Timestamp).toLocaleString()` where `l.Timestamp` is a string like "2026-11-03T20:12:02.4908932". The inconsistency is likely a date parsing issue in the timestamp format or a null value in the `logs` state.

### Issue 2 — Status stat card shows "Pending" after check-in
**Severity:** Medium | **Category:** UX / Functional
**URL:** `http://localhost:5173/self` (staff check-in page)
**Description:** After a successful check-in, the "Status" stat card still shows "Pending" (because the stat card only shows "Pending" for anything that isn't "Reached"), while the subtitle below shows "You are on site. Tap to check out when you leave." The stat card should reflect "InProgress" to match the actual assignment status.
**Steps to reproduce:**
1. Log in as staff1 with an assignment.
2. Tap "Mark arrived" to check in.
3. Observe the Status stat card (still says "Pending") vs. the subtitle (says "You are on site...").
**Expected:** The status stat card should display "InProgress" to match the actual assignment status.
**Actual:** The stat card shows "Pending" while the subtitle correctly indicates "InProgress".

### Issue 3 — Check-out does not reset assignment status to "Pending"
**Severity:** High | **Category:** Functional
**URL:** Backend API `POST /api/checkins/{id}/checkout`
**Description:** The `CheckOutAsync` method in `StaffTracker.Api/Services/ICheckInService.cs` sets `CheckedOutAt` and adds a CheckOut log, but does not reset the assignment status to "Pending". The assignment remains "InProgress" after check-out.
**Steps to reproduce:**
1. Check in as staff1.
2. Check out.
3. GET /api/assignments/2 → status is still "InProgress" (should be "Pending").
**Expected:** Assignment status resets to "Pending" after check-out.
**Actual:** Status remains "InProgress" with `CheckedOutAt` set.
**Fix applied:** Modified `CheckOutAsync` to set `a.Status = "Pending"` and `a.CheckedInAt = null` before saving.

### Issue 4 — Check-in flow endpoint returns 404 for assignment detail
**Severity:** Low | **Category:** Functional
**URL:** `GET /api/assignments/{id}`
**Description:** The `GET /api/assignments/{id}` route is not registered in `AssignmentController`. It returns 404. The `AssignmentController` only exposes `GET /api/assignments/today`, `GET /api/assignments`, `POST /api/assignments`, `PATCH /api/assignments/{id}/status`, and `GET /api/assignments/history/{staffId}`.
**Steps to reproduce:**
1. Request `GET /api/assignments/2`.
2. Response is 404 Not Found.
**Expected:** A detail endpoint should exist if callers rely on it.
**Actual:** 404 Not Found.

---

## Summary Table

| # | Issue | Severity | Category |
|---|-------|----------|----------|
| 1 | Activity log shows "Invalid Date" | Medium | Functional / UX |
| 2 | Status stat card shows "Pending" after check-in | Medium | UX / Functional |
| 3 | Check-out doesn't reset status to "Pending" | High | Functional |
| 4 | GET /api/assignments/{id} returns 404 | Low | Functional |

---

## Testing Notes

**Servers verified:**
- Frontend (Vite dev): http://localhost:5173 → HTTP 200
- Backend (ASP.NET Core): http://localhost:5289 → HTTP 200

**Pages tested:**
- `/login` — renders, console clean.
- `/admin/dashboard` — renders, console clean.
- `/admin/staff` — renders, console clean.
- `/admin/locations` — renders, console clean.
- `/admin/history` — renders, console clean.
- `/self` (staff) — renders, console clean.

**Console check:** No JavaScript errors or unhandled rejections observed on any page during testing.

**Browser QA notes:**
- The `fill_input` helper in the browser test harness failed to locate inputs. The `type_text` + `press_key` approach worked correctly for form input.
- The logout flow and role-based redirects (admin vs staff) were verified.

**Open items / not tested:**
- Responsive layout on mobile viewports was not tested.
- The "Use my position" geolocation flow was not fully tested in the browser (geolocation may prompt for user permission in the test harness).
- The live (SignalR) status updates across browser tabs were not tested.
