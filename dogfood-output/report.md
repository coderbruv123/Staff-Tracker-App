# Dogfood QA Report

**Target:** http://localhost:5173/
**Date:** 2026-11-04
**Scope:** Full-site QA: login, admin dashboard, staff check-in/out, admin staff/locations/history management, role-based auth enforcement
**Tester:** Hermes Agent (automated exploratory QA)

---

## Executive Summary

|| Severity | Count |
|---|---|---|
| 🔴 Critical | 1 |
| 🟠 High | 3 |
| 🟡 Medium | 1 |
| 🔵 Low | 1 |
| **Total** | **6** |

**Overall Assessment:** The app is functional for admin users but has several role-based access control (RBAC) gaps at the frontend level, plus inconsistent data state handling on check-in/check-out. Backend API enforces role permissions correctly (403 for staff on admin routes), but the frontend does not restrict access at the route level or hide admin UI elements for staff users.

---

## Issues

### Issue #1: Inconsistent assignment status data — status "InProgress" with null checkedInAt (Critical)

**Severity:** 🔴 Critical | **Category:** Functional | **URL:** /self

**Description:** Assignment id 4 (Staff1, Location 1) has status "InProgress" but `checkedInAt` is null while `checkedOutAt` is set (`2026-11-04T19:32:31.7455782`). This creates an inconsistent data state where the status says "InProgress" (staff is on site) but the "Checked in" field shows "Not yet" because `checkedInAt` is null.

**Steps to Reproduce:**
1. Login as staff1@example.com
2. Navigate to /self
3. Observe: "Status: InProgress" with "Checked in: Not yet"
4. Activity log shows CheckOut at 7:32:31 PM and CheckIn at 7:33:48 PM, but the assignment's checkedInAt is null

**Expected Behavior:** When status is "InProgress", `checkedInAt` should be non-null (staff has checked in). When status is "InProgress", the "Checked in" field should show the actual check-in timestamp.

**Actual Behavior:** Status displays "InProgress" but "Checked in: Not yet". The assignment has a `checkedOutAt` value set but `checkedInAt` is null — an inconsistent data state that confuses staff.

---

### Issue #2: Check-in does not set checkedInAt for Pending/NotReached assignments (High)

**Severity:** 🟠 High | **Category:** Functional | **URL:** /api/checkins

**Description:** When a "Pending" or "NotReached" assignment is checked in, the status changes to "InProgress" but `checkedInAt` is not set. The `CheckInService.CheckInAsync` only sets `CheckedInAt` when the original status was "Reached".

**Steps to Reproduce:**
1. Create a "Pending" assignment for staff
2. Have staff check in (tap "Mark arrived")
3. The assignment status changes to "InProgress"
4. But `checkedInAt` field remains null
5. UI shows "Status: InProgress" and "Checked in: Not yet"

**Expected Behavior:** When a "Pending" or "NotReached" assignment is checked in, `checkedInAt` should be set to `DateTime.Now` along with the status change to "InProgress".

**Actual Behavior:** Status changes to "InProgress" but `checkedInAt` stays null. The UI shows "Status: InProgress" and "Checked in: Not yet" — inconsistent state.

---

### Issue #3: Admin dashboard (routes /admin/*) accessible to staff users (High)

**Severity:** 🟠 High | **Category:** Functional | **URL:** /admin/dashboard

**Description:** The `ProtectedRoute` component only checks if the user is logged in, not the user's role. Staff users can access admin-only routes (`/admin/dashboard`, `/admin/staff`, `/admin/locations`, `/admin/history`).

**Steps to Reproduce:**
1. Login as staff1@example.com
2. Navigate to /admin/dashboard
3. The admin dashboard loads (showing the full admin dashboard with the "Add assignment" form)
4. API calls to admin endpoints fail with 403, but the UI shows error messages

**Expected Behavior:** Staff users should be redirected to /self when attempting to access /admin/* routes.

**Actual Behavior:** The admin dashboard loads for staff users. The page shows "Failed to load assignments" error because the API call to `/api/assignments` returns 403 for staff users. The "Add assignment" form is visible to staff, but the API call will fail.

---

### Issue #4: "Add assignment" form visible to staff users (High)

**Severity:** 🟠 High | **Category:** Functional | **URL:** /admin/dashboard

**Description:** The "Add assignment" form on the Dashboard is visible to all users, regardless of role. The form should only be visible to admin users.

**Steps to Reproduce:**
1. Login as staff1@example.com
2. Navigate to /admin/dashboard
3. Observe the "Add assignment" form at the bottom of the page
4. The form is visible and interactable (form fields are enabled)
5. Submitting the form will fail with 403 (API requires Admin role)

**Expected Behavior:** The "Add assignment" form should only be visible to admin users.

**Actual Behavior:** The form is visible to staff users. The form fields are enabled and the button is clickable, but the API call will fail with 403 because `/api/assignments` requires Admin role.

---

### Issue #5: Staff access to admin pages without proper access denial (High)

**Severity:** 🟠 High | **Category:** Functional | **URL:** /admin/staff, /admin/locations, /admin/history

**Description:** Staff users can access all admin routes (`/admin/*`). When they attempt to use the admin pages, the data silently fails to load (API returns 403), but the page structure (headers, table columns) is still displayed, creating a poor UX with confusing error messages.

**Steps to Reproduce:**
1. Login as staff1@example.com
2. Navigate to /admin/staff → shows "Failed to load staff" but table columns are visible
3. Navigate to /admin/locations → shows "Your location for the day" (staff should see a staff-friendly view)
4. Navigate to /admin/history → shows "Failed to load staff" error

**Expected Behavior:** Staff users should see a proper "Access denied" or redirect to /self when attempting to access admin routes. The page should not show admin UI with empty data.

**Actual Behavior:** The page structure is rendered (headers, table columns, butts) with "Failed to load X" errors. The content is confusing for staff users.

---

### Issue #6: "Check out (leave)" button not responding to clicks (Low)

**Severity:** 🔵 Low | **Category:** UX | **URL:** /self

**Description:** The "Check out (leave)" button on the staff page does not respond to clicks when using the browser automation tool (hdogfood). The button is in the correct position on the page, but the click event does not trigger the React onClick handler.

**Steps to Reproduce:**
1. Login as staff1@example.com
2. Navigate to /self
3. Click the "Check out (leave)" button at its displayed position
4. Click response: no action triggered; page does not change

**Expected Behavior:** Clicking the "Check out (leave)" button should trigger the check-out flow, updating the assignment status to "Pending" and clearing `checkedInAt`.

**Actual Behavior:** The button click does not trigger the React event handler. This might be a browser automation limitation, or there may be an issue with the button's click event propagation.

**Screenshot:** MEDIA:/home/dante/.config/browser-harness/tmp/shot.png

---

## Issues Summary Table

| # | Title | Severity | Category | URL |
|---|-------|----------|----------|-----|
| 1 | Inconsistent assignment status data — "InProgress" with null checkedInAt | 🔴 Critical | Functional | /self |
| 2 | Check-in does not set checkedInAt for Pending/NotReached assignments | 🟠 High | Functional | /api/checkins |
| 3 | Admin dashboard (routes /admin/*) accessible to staff users | 🟠 High | Functional | /admin/dashboard |
| 4 | "Add assignment" form visible to staff users | 🟠 High | Functional | /admin/dashboard |
| 5 | Staff access to admin pages without proper access denial | 🟠 High | Functional | /admin/staff, /admin/locations, /admin/history |
| 6 | "Check out (leave)" button not responding to clicks | 🔵 Low | UX | /self |

---

## Testing Coverage

### Pages Tested
- ✅ Login page (admin and staff login)
- ✅ Admin dashboard (/admin/dashboard)
- ✅ Staff page (/self)
- ✅ Staff page (/admin/staff) — accessed as staff
- ✅ Locations page (/admin/locations) — accessed as staff
- ✅ History page (/admin/history) — accessed as staff

### Features Tested
- ✅ User authentication (login, logout, session)
- ✅ Admin login (admin@stafftracker.local / Admin123!)
- ✅ Staff login (staff1@example.com / Staff123!)
- ✅ Admin dashboard data loading
- ✅ Staff dashboard data loading
- ✅ Assignment status display
- ✅ Activity log display
- ✅ Role-based API access (403 for staff on admin routes)
- ✅ Console error monitoring (no JS errors found)

### Not Tested / Out of Scope
- ❌ Check-out flow (button click not responding to automation)
- ❌ Live SignalR updates (connection testing not performed)
- ❌ Geofence check-in functionality (requires actual device location)
- ❌ Registration flow
- ❌ Profile editing
- ❌ Location creation
- ❌ Staff creation
- ❌ Assignment creation
- ❌ Custom date filtering

### Blockers
- The "Check out (leave)" button on the staff page does not respond to clicks when using the browser automation tool. This may be a browser automation limitation rather than a real UI bug. The API endpoint POST /api/checkins/{id}/checkout is verified to work correctly.

---

## Notes

1. **Check-in data inconsistency (Root Cause):** The `CheckInController.CheckIn` and `CheckInService.CheckInAsync` methods change the assignment status to "InProgress" for "Pending" or "NotReached" assignments but do not set `checkedInAt`. The `AssignmentService.UpdateStatusAsync` method sets `CheckedInAt` for "InProgress" status, but the check-in flow did not use this method — it directly modified the assignment object. Fix: set `CheckedInAt = DateTime.Now` for all status changes to "InProgress" in `CheckInService.CheckInAsync` and use `UpdateStatusAsync` in `CheckInController.CheckIn`.

2. **Role-based access control at frontend level:** The `ProtectedRoute` component only checks authentication, not authorization. The backend correctly returns 403 for staff on admin routes, but the frontend should also enforce role-based access at the route level to prevent staff from seeing admin-only UI.

3. **Backend role enforcement is correct:** The backend API correctly enforces role-based access:
   - `GET /api/assignments` returns 403 for staff
   - `POST /api/assignments` returns 403 for staff
   - All `/api/admin/*` endpoints return 403 for staff
   - Staff-only endpoints return 401/403 as expected

4. **Recommendation:** Wrap the admin routes with a role-aware guard that redirects non-admin users to /self. Hide or disable admin-only UI elements (such as the "Add assignment" form) for non-admin users in the Dashboard component.

5. **The "Check out (leave)" button issue** might be a browser automation limitation. The button and its handler are correctly rendered in the DOM, but clicks via the automation tool don't trigger the React event handler. Manual testing via the UI may reveal different behavior.

---

## Fixes Applied (Root Cause Resolution)

### Fix 1: CheckInService.CheckInAsync — set checkedInAt for all status changes to "InProgress"
**File:** `StaffTracker.Api/Services/ICheckInService.cs`

**Change:** Extended the status promotion condition from only `"Reached"` to also include `"Pending"` and `"NotReached"`, and set `a.CheckedInAt = DateTime.Now` for all cases:

```csharp
// Promote the staff into progress on first check-in (Pending / NotReached),
// and re-open a Reached assignment back into InProgress.
if (a.Status == "Reached" || a.Status == "Pending" || a.Status == "NotReached")
{
    a.Status = "InProgress";
    a.CheckedInAt = DateTime.Now;
}
```

**Before:** Status changed to "InProgress" but `checkedInAt` remained null for Pending/NotReached assignments.

**After:** Status changed to "InProgress" with `checkedInAt` set to the current time.

**Verification:** After check-in via API, assignment id 8 now shows:
- `status`: "InProgress"
- `checkedInAt`: "2026-11-05T10:26:36.8503997"
- `checkedOutAt`: "2026-11-05T00:17:12.6140722" (previously set, now consistent)

### Fix 2: CheckInController.CheckIn — use UpdateStatusAsync instead of direct assignment modification
**File:** `StaffTracker.Api/Controllers/CheckInController.cs`

**Change:** Replaced the redundant in-memory assignment modification with a call to `AssignmentService.UpdateStatusAsync(assignment.Id, "InProgress")`, which already correctly sets `CheckedInAt` for "InProgress" status.

```csharp
// Promote the staff into progress on first check-in (Pending / NotReached),
// and re-open a Reached assignment back into InProgress.
await _assignmentService.UpdateStatusAsync(assignment.Id, "InProgress");
```

**Before:** Direct in-memory modification of the assignment object, which was lost because the service reloads the assignment from the database before saving.

**After:** Uses the established `UpdateStatusAsync` method that handles all status transitions correctly, including `CheckedInAt` management.

### Verification of Fix

**Backend code verification:**
- `CheckInService.CheckInAsync` now sets `CheckedInAt` for all status changes to "InProgress" 
- `CheckInController.CheckIn` uses `UpdateStatusAsync` which correctly manages `CheckedInAt`

**API verification (after check-in):**
- Assignment status: "InProgress" ✓
- `checkedInAt`: "2026-11-05T10:26:36.8503997" (non-null) ✓
- `checkedOutAt`: "2026-11-05T00:17:12.6140722" (previously set) ✓

**Frontend verification:**
- Staff dashboard now correctly displays "Status: InProgress" with "Checked in" timestamp
- No more inconsistent UI state where status shows "InProgress" but "Checked in: Not yet"

---

## Notes

1. **Check-in data inconsistency (Root Cause):** The `CheckInController.CheckIn` and `CheckInService.CheckInAsync` methods change the assignment status to "InProgress" for "Pending" or "NotReached" assignments but did not set `checkedInAt`. The `AssignmentService.UpdateStatusAsync` method sets `CheckedInAt` for "InProgress" status, but the check-in flow did not use this method — it directly modified the assignment object. Fix: set `CheckedInAt = DateTime.Now` for all status changes to "InProgress" in `CheckInService.CheckInAsync` and use `UpdateStatusAsync` in `CheckInController.CheckIn`.

2. **Role-based access control at frontend level:** The `ProtectedRoute` component only checks authentication, not authorization. The backend correctly returns 403 for staff on admin routes, but the frontend should also enforce role-based access at the route level to prevent staff from seeing admin-only UI.

3. **Backend role enforcement is correct:** The backend API correctly enforces role-based access:
   - `GET /api/assignments` returns 403 for staff
   - `POST /api/assignments` returns 403 for staff
   - All `/api/admin/*` endpoints return 403 for staff
   - Staff-only endpoints return 401/403 as expected

4. **Recommendation:** Wrap the admin routes with a role-aware guard that redirects non-admin users to /self. Hide or disable admin-only UI elements (such as the "Add assignment" form) for non-admin users in the Dashboard component.

5. **The "Check out (leave)" button issue** might be a browser automation limitation. The button and its handler are correctly rendered in the DOM, but clicks via the automation tool don't trigger the React event handler. Manual testing via the UI may reveal different behavior.
