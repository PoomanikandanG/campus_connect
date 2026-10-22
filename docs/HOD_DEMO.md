# CampusConnect V2: local HOD appointment demo

## Start
Run `npm.cmd run dev` on Windows (or `npm run dev` elsewhere). Open the displayed localhost URL and select HOD Appointments. No Supabase setup, account, OTP, or network service is needed for this demo. Existing /login, /student and /hod authentication foundation routes remain separate; this demo never grants access to them.

## Presentation walkthrough
1. Open /hod-appointments and explain the fictional, browser-only notice.
2. Continue as Demo Student. Keep Alex or select another fictional identity. Select a department and HOD. The starting date is the next date with a future available slot; choose another Monday-Saturday date if needed.
3. Pick a time, student department and reason category. Optionally add a fictional description. Submit. Point out the unique ID, Pending badge, and empty Upcoming Appointments section.
4. Switch to Demo HOD. The selected HOD carries over. Review the request and choose Approve.
5. Switch to Demo Student. The selected student carries over; the approved request now appears under Upcoming Appointments. Refresh to demonstrate persisted request data (after refresh reselect an alternate demo identity/HOD if necessary).
6. Send another request, switch to Demo HOD, and Propose another time. Pick a different available slot and send the proposal. Switch back and accept. The originally requested date/time is replaced only after successful acceptance. Alternatively decline the proposal.
7. Demonstrate slot management: choose a future date, mark a free slot unavailable and confirm. Switch to Student and show that it is absent from the picker. Switch back to re-enable it.
8. For a conflict example, use Alex and Sam to submit the same free slot before approval. Only one can be approved; the other stays Pending with a clear conflict message.
9. Cancel an approved request and confirm. Its slot becomes available again. Exit Demo or return to Faculty Directory to show V1 remains available.
10. Reset demo data is available on every demo page and asks for confirmation. It clears requests and blocked slots only, not V1 data or Supabase sessions.

## Implemented scope
- Four fictional HODs in AIML, CSE, ISE and ECE, entirely separate from real faculty IDs and timetable data.
- Three selectable fictional student identities, request validation, reasons and optional descriptions.
- Configured 30-minute slots Monday-Saturday, 10 AM-noon and 2 PM-4 PM IST. No Sunday or midday-gap slots. No passed slots or dates.
- Pending, Approved, Declined, Reschedule Proposed and Cancelled statuses. Student/HOD cancellation, HOD approval/decline/proposal, and student proposal acceptance/rejection.
- Pending requests and proposals do not reserve slots. Approval and acceptance recheck current availability. Approved conflicts are prevented in the local workflow. Cancelling frees a reserved slot.
- HOD-scoped requests, status/date filters, overview counts and block/unblock controls.
- Versioned localStorage, corruption validation, explicit reset, and storage-failure warnings. Malformed data is not overwritten until reset is confirmed.
- Keyboard-operable native controls and slot radios, mobile layouts, reduced-motion styling and readable AM/PM times.

## Architecture and limitations
Data: src/data/hodDemo.js. Pure rules: src/utils/appointmentUtils.js. Storage: src/utils/appointmentStorage.js. Context/provider coordinates both demo modes. Pages and shared components call the same rules. A future backend can replace persistence and commands; it must implement its own transactions, authentication and authorization.

Storage key: campusconnect_hod_demo_v1. Only fictional requests and blocked slots are stored. Changing modes in one tab preserves state immediately; the browser storage event also refreshes other tabs. localStorage is not a transactional backend: simultaneous changes from separate tabs/devices are not a production concurrency guarantee. Use one tab for the presentation. Do not enter real student IDs, credentials or private information. No emails, real bookings, notifications, actual availability calendars, holidays or real HOD assignments exist in this demo.

Existing Supabase integration and SQL are retained from the earlier foundation but are not used by these demo pages. The demo's public role switching is not authentication and will not become secure just by changing storage. Backend security testing remains a separate future activity.

Production hosting must rewrite /hod-appointments and its child paths to /index.html while serving existing static assets normally. Existing #/faculty/<id> links remain supported.

## Checks
Run `npm.cmd test -- --maxWorkers=1` and `npm.cmd run build`. Tests cover V1 regressions, the existing auth foundation, complete demo interactions, appointment rules, conflicts, proposal checks and storage recovery.


## Validation performed
- Full automated suite: 315 tests passed across 12 files using one worker, including existing V1 and authentication tests.
- Chrome smoke test: submitted a real UI demo request, switched to HOD, approved it, switched back, verified Upcoming Appointments, and reloaded to verify persistence. No JavaScript exceptions were observed during that flow.
- Layout checks: 390px, 768px and 1365px viewports had no horizontal overflow. Mobile and desktop screenshots were inspected.
- Real backend authorization and multi-device synchronization were not tested or implemented for this local demo.
