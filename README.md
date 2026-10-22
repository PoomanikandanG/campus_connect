# CampusConnect

A responsive faculty finder homepage built with React, Vite, Tailwind CSS, and Lucide icons.

## Run locally

```sh
npm install
npm run dev
```

On Windows PowerShell, if execution policy blocks npm.ps1, use `npm.cmd install` and `npm.cmd run dev`.

## Production build

```sh
npm run build
```

Faculty records live in `src/data/faculty.js`, reusable faculty cards in `src/components/FacultyCard.jsx`, and the homepage in `src/App.jsx`. Search supports partial, case-insensitive matches against names and subjects. The independent Department and Subject area filters combine with search; subject categories are Computer Science, Mathematics, and Interdisciplinary. Results and counts update immediately. Clear Filters resets the search and both filters, including when there are no results. All filtering uses the local dataset.

Each card links to a dedicated profile using a lightweight `#/faculty/<id>` hash route. Profiles show subject area and subjects taught along with location details and the existing avatar. Search, department, and subject-area selections remain in App state when navigating between the directory and profiles. Direct profile URLs, refresh, and browser Back/Forward are supported without server routing configuration.

Run `npm test` for search, filtering, and profile navigation UI tests. On Windows PowerShell, use `npm.cmd test` if needed.

Profiles include a reusable `src/components/Faculty3DAvatar.jsx`. It lazy-loads a React Three Fiber scene with Drei rotation controls. The generic professor is built entirely from procedural geometry, with no downloaded models, textures, or font assets. Drag with a mouse or touch to rotate. The subtle idle animation respects reduced-motion preferences. WebGL failures and context loss fall back to the faculty member's initials; no profile details depend on the canvas. Avatar tests cover scene failure, fallback, and reduced motion.

The directory contains 35 teachers merged from `src/data/faculty_import.js`, with cabin details attributed to faculty directory screenshots. Subjects and subject areas follow the supplied subject-category update: 25 Computer Science, 7 Mathematics, and 3 Interdisciplinary. Rakshitha JN retains both Computer Organization & Architecture and Universal Human Values. `src/data/faculty.js` remains the only runtime source of records; the import file is a historical reference and is not loaded by the website. All IDs, names, locations, and visual settings are preserved. Outdated demo teaching times have been removed.

The shared building name is unconfirmed, so building fields use the existing `Not provided` placeholder. Numeric cabin floors are stored as display strings (for example, `507` becomes `Fifth floor`); `G09` is confirmed as Ground Floor by the project owner. The five original official department and designation assignments were demo data, not verified information, and have been cleared. Official departments remain `null` for all 35 teachers and display `Department not confirmed`; unconfirmed designations are omitted on profiles. Subject area describes teaching content and never sets an official department. The department filter remains functional for future confirmed data.

Faculty profiles include a compact Schedule Checker backed by the separate fictional timetable dataset and pure query/validation utilities. Cabin Map remains an unavailable preview. V1 has no full weekly timetable screens or interactive maps. The separate V2 demo adds local fictional appointments; see the presentation guide below.

## Adding a teacher

Edit only `src/data/faculty.js` and append a record to the exported `faculty` array. Do not copy data into components or add routes manually. The directory, counts, department options, name search, and shared profile all update from this array.

```js
{
  id: 'ananya-rao', // Required, unique, permanent: never change after publishing links.
  name: 'Prof. Ananya Rao',
  department: 'Civil Engineering',
  role: 'Associate Professor',
  building: 'Academic Block D',
  floor: 'Third floor',
  cabin: 'D-301',
  avatar: { suitColor: '#314d68', idleAnimation: true },
  timetable: [], // Reserved for future records, no timetable UI yet.
},
```

This is a documentation example, not a production record. Use actual approved details when the prototype becomes a real directory.

Only `id` and `name` need to be supplied. Add an official `department` or `role` only when verified. Missing locations display a helpful placeholder; initials are generated from the name. Existing `block` and `role` fields continue to work, and `designation` is accepted as an alias for `role`. If both building fields exist, `building` takes priority. Missing departments display `Department not confirmed`.

Optional fields:

| Field | Behavior |
| --- | --- |
| `department`, `role` | Confirmed official department and designation only; do not infer from subject area or name titles. |
| `subjectArea` | Teaching category: `Computer Science`, `Mathematics`, or `Interdisciplinary`. Independent of official department. |
| `subjects` | Array of full subject names used for search and profile display. Missing values normalize to an empty array. |
| `initials` | Overrides generated initials. |
| `color` | Portrait background: `blue`, `purple`, `peach`, `green`, or `sand`; defaults to blue. |
| `photo` | Optional URL or public asset path (for example, `/faculty/photo.jpg` for a file in `public/faculty/`). Missing or failed images show initials. |
| `building`, `floor`, `cabin` | Explicit floor text is preserved. Empty floors and `Not provided` placeholders fall back to the shared `deriveFloorFromCabin` utility: `206`/`207` → `2nd Floor`, `307` → `3rd Floor`, `407` → `4th Floor`, `507` → `5th Floor`, `607` → `6th Floor`. String and numeric cabins are supported. Unrecognized or missing cabins use `Not provided`. `G09` maps to `Ground Floor`, as confirmed by the project owner; verified explicit floor information always takes priority. |
| `avatar` | Optional `suitColor`, `accentColor`, `skinColor`, and `hairColor` (3- or 6-digit hex colors), plus `idleAnimation`. Invalid colors use the existing defaults. Reduced-motion preferences take priority. |
| `timetable` | Legacy reserved optional field; not used for the separate weekly timetable dataset. Keep new weekly sessions exclusively in `src/data/timetable.js`. |

`src/utils/faculty.js` normalizes optional values once when building the directory and provides the ID lookup. Existing record values are preserved. Duplicate names are supported; duplicate or missing IDs fail validation with an actionable error. Never derive IDs from array positions or change them when a name changes. Unknown or malformed profile URLs show `Faculty not found` with a return action.

After adding records, run `npm test` and `npm run build` (or `npm.cmd` on PowerShell). The tests exercise every profile and use an additional test-only record to verify dynamic search, new departments, shared profiles, optional-field fallbacks, photo failures, and ID-based timetable associations. Merge regression tests verify all 35 imported teachers, uniqueness, original IDs and visual settings, corrected cabins, and missing-data placeholders.

## Fictional timetable data and profile checker

`src/data/timetable.js` exports the editable `timetable` array and `timetableMetadata`. It covers 35 existing faculty IDs with 245 weekly sessions, including 43 two-hour labs and varied loads of 4–10 sessions per teacher. This is a fictional odd-semester demonstration covering semesters 1, 3, 5, and 7, Monday–Saturday, with a 10:30–10:45 morning break and a 12:45–13:30 lunch break. Teaching hours are 08:30–17:30. The eight periods are 08:30–09:30, 09:30–10:30, 10:45–11:45, 11:45–12:45, 13:30–14:30, 14:30–15:30, 15:30–16:30, and 16:30–17:30. Lectures last one hour and labs reserve two full hours. Gaps are intentionally unscheduled.

Each session has `id`, `facultyId`, `day`, `startTime`, `endTime`, `subject`, `department`, `semester`, `section`, `classroom`, `sessionType` (`lecture` or `lab`), and `source: 'fictional-demo'`. Times use 24-hour `HH:mm`. `department` identifies the students' department, independently of the teacher's official department. Sections are AIML A–B, CSE A–G, ISE A–D, and ECE A–C; other departments may use A–C. Subjects come from the existing faculty records; fictional semester assignments are not claims about actual curriculum.

`src/utils/timetableUtils.js` has no React or dataset imports. Pass arrays explicitly:

```js
import { faculty } from './src/data/faculty.js'
import { timetable } from './src/data/timetable.js'
import {
  getFacultyWeeklyTimetable, findScheduledClass, validateTimetable,
  checkTeacherConflicts, checkClassroomConflicts, checkSectionConflicts,
  validateFacultyReferences,
} from './src/utils/timetableUtils.js'

getFacultyWeeklyTimetable(timetable, 'mahesh-h') // sorted Monday–Saturday
findScheduledClass(timetable, 'mahesh-h', 'Monday', '10:30') // session or null
validateTimetable(timetable, faculty) // { valid, errors, conflicts }
checkTeacherConflicts(timetable) // conflict pairs, likewise for rooms/sections
validateFacultyReferences(timetable, faculty) // unknown ID references
```

Conflicts use complete half-open time ranges `[startTime, endTime)`: adjacent classes are allowed, while a booking during either hour of a lab conflicts. A student section is identified by department + semester + section. `validateTimetable` checks the schema, duplicate IDs, valid faculty references, odd semesters, section limits, working hours, both breaks, alignment with college periods, two-hour lab durations, and all three conflict types. After editing entries, run `npm test` and `npm run build`. Tests also reserve every minute independently to verify the absence of conflicts.

Replace, add, or delete timetable entries in this file without changing faculty data, profiles, search, avatars, routing, or cabin details. Keep session IDs unique and faculty IDs stable; no schedule is generated at runtime. The legacy optional `faculty.timetable` field is not used for this dataset. A newly added teacher without sessions safely returns `[]` from the weekly query and `null` from class lookup.

All classroom and lab assignments are fictional and separate from verified faculty cabins. A scheduled class is not evidence of actual faculty availability or location. No scheduled class does not mean a teacher is free or in their cabin.

`src/components/FacultyScheduleStatus.jsx` replaces the profile's timetable placeholder with a compact status card. It queries the existing timetable using the stable faculty ID, showing a scheduled class, no class at the checked time, or unavailable schedule information when the teacher has no records. All results show `Demo timetable — not actual faculty location.` and explicitly state that actual faculty availability and location are unconfirmed. Known permanent cabin details appear for the latter two states.

The checker initializes with the current day and time in `Asia/Kolkata` using `getKolkataDayTime`, independently of the browser's local timezone. Current-time mode refreshes at minute boundaries. `Check another time` exposes day and time controls (including Sunday); changes update immediately. Empty time input asks for a valid time rather than inferring a result. `Check current time` uses a fresh campus-time reading and returns to automatic updates. Selecting a different faculty profile resets the checker. No full weekly timetable is rendered. Component tests cover all three states, manual changes, reset, timezone rollover, lab durations, minute-boundary updates and cleanup, missing cabins, stable IDs, and profile integration.

College period times are defined once in `TEACHING_PERIODS` and `TIMETABLE_BREAKS` in `src/utils/timetableUtils.js`, and reused by timetable metadata and validation. Lectures use one period; labs use two consecutive periods without crossing a break. Session times follow the supplied college hours; teaching assignments remain fictional.


## V2 HOD appointments foundation

The public directory and existing hash-based faculty URLs remain available without authentication. `/hod-appointments` introduces the upcoming system; `/login` supports Supabase email OTP for administrator-provisioned accounts. `/student` and `/hod` require a verified session and the matching active backend approval. Appointment booking and admin provisioning UI are not implemented.

Copy `.env.example` to `.env.local` and follow [Supabase setup and backend security test plan](docs/SUPABASE_SETUP.md). Without valid public configuration the app displays Configuration required; no simulated login is provided. Apply the separate SQL migration and configure Auth restrictions before use. Production hosting needs an SPA fallback for the new pathname routes. Backend tests require a configured disposable Supabase project and remain pending until explicitly run.


## Complete local HOD appointment demo

`/hod-appointments` now opens the fictional local demo, with `/hod-appointments/student` and `/hod-appointments/hod` for public role simulation. Request, approve, decline, reschedule, accept, cancel, and block/re-enable slots without configuring a backend. Requests and slot changes persist in versioned browser storage. No real accounts, appointments, messages, HOD assignments, or cross-device storage are involved.

See [the presentation walkthrough, architecture and limitations](docs/HOD_DEMO.md). The earlier Supabase account pages remain separate at `/login`, `/student` and `/hod`; the public demo does not bypass their guards. Faculty records and fictional faculty timetables remain separate and unchanged.
