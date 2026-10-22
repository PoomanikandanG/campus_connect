# CampusConnect V2 setup and security verification

## Local foundation
New paths: /hod-appointments, /login, /student, /hod. Existing #/faculty/<id> links stay supported.
Configure production hosting to rewrite application paths to /index.html (preserve real static assets). Vite provides this fallback locally. Directory/profile links return to the root.
No appointment submission, private requests, or admin provisioning endpoint exists in this phase.

## Required operator steps (not performed automatically)
1. Create a separate Supabase test project. In Authentication settings, disable **Allow new users to sign up**. Disable anonymous sign-ins and unused providers. This server setting is required; shouldCreateUser:false alone is not a project-wide signup restriction.
2. Enable the Email provider. Configure email OTP length to **6**, and choose an expiry (for example 10 minutes). In Authentication > Email Templates > Magic Link, replace the link-only email with a code template containing `{{ .Token }}`. Configure custom SMTP for approved recipients beyond Supabase's restricted development email delivery. Configure rate limits appropriately; never disable them for a demo.
3. Set the Site URL to your deployment origin and configure approved redirect URLs. This implementation verifies typed codes and does not consume magic-link URL sessions.
4. Run supabase/migrations/202610210001_approved_accounts.sql in the SQL Editor as the database administrator. Review existing schema permissions before applying to a nonempty project. There are no automatic signup triggers that assign roles.
5. Provision approved users from a trusted server using the Supabase Admin API `auth.admin.createUser({ email, email_confirm: true })` with no password, or the equivalent trusted dashboard user creation operation. Use only an email the administrator has approved. Pre-confirming provisioning does not sign the person into this app: the user must still prove inbox access with OTP. Keep the resulting Auth UUID.
6. Using the trusted SQL Editor, insert each approval (replace values):

```sql
insert into public.approved_accounts (user_id, email, role, department)
values ('AUTH-USER-UUID', 'approved@example.edu', 'hod', 'CSE');
-- For students: role 'student', department may be null.
-- Revoke immediately at the protected data layer:
update public.approved_accounts set active = false where user_id = 'AUTH-USER-UUID';
```

Provision Auth identity first, approval row second. Delete an orphan identity if approval insertion fails. For changed emails, reapprove and update the approved email through a trusted operation; a mismatch denies access. The admin role is reserved and has no dashboard or browser write permissions.
7. Copy .env.example to .env.local, set the project URL and **publishable** key, then restart Vite. *.local is already ignored. Never put secret/service-role keys or database passwords in VITE variables. This client intentionally accepts only sb_publishable_ keys.
8. Before a production release, perform the live checks below. An eventual provisioning service must verify the caller's identity and active admin role server-side for every operation, keep privileged keys server-side, and record approvals. Do not expose a generic Admin API proxy.

## Authorization model
approved_accounts is the only role/approval authority. Verified Auth identifies the caller. RLS allows an authenticated user to read only their own active, email-matched approved record. No browser role can mutate approvals, even with an admin application role. The private helper reads current database state, so revoked accounts fail protected policies with an old JWT. React rechecks on sign-in, refresh, window focus, and every minute. A previously rendered placeholder can remain until that check; backend RLS revokes protected access immediately. No cross-user or HOD-private data exists yet.
Every future protected table must enable RLS, revoke broad grants, and use the live role helper plus ownership/department rules. A route guard alone does not protect new tables.
Persisted Supabase sessions are restored and validated using getUser; roles are never read from localStorage or user metadata. Application authorization requests fail closed on errors. SDK session persistence is not an authorization source.

## Backend security test plan ? PENDING, not run locally
Use a disposable Supabase project with two students, two HODs, an unapproved Auth user, and a revoked user. Test REST APIs directly with real user JWTs and publishable credentials, not just the UI.

- Unknown email: request OTP with shouldCreateUser:false, attempt direct signup too; no identity/session should be created. Do not enumerate approved addresses in the UI.
- Inbox ownership: incorrect/expired/reused codes fail; valid code signs in the provisioned user.
- Own data: student A can read only their own account; queries for student B/HOD rows return no records. Anonymous calls must fail or return no records.
- Role escalation: student and HOD JWTs cannot INSERT, UPDATE, DELETE or UPSERT approval records, including their own role/active/email fields. Changing user_metadata.role to admin has no effect.
- Route isolation: student navigating directly to /hod sees Access Denied; HOD navigating to /student also sees denial. Reserved admin, unknown role, missing approval and revoked approval are denied.
- Revocation: retain an old JWT, deactivate its account with trusted SQL, and immediately query approved_accounts again; zero rows. React should remove dashboard access on focus/next poll. Re-enabling access requires a trusted operation.
- Email mismatch: change an identity email without updating approval; deny access. Unconfirmed email identities must not pass RLS.
- Restore/logout: refresh an authorized dashboard, then sign out; refresh/back cannot restore protected UI without a valid session. Test Auth outage and expired sessions.
- Future HOD-private tables: before adding them, add direct REST tests for student denial, HOD department scoping, ownership and revoked access. These cannot be claimed tested in Phase 1 because those tables do not exist.

## References
- https://supabase.com/docs/guides/auth/auth-email-passwordless
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/reference/javascript/auth-admin-createuser
