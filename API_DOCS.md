# Backend API Docs

## Base Notes

- Base URL for all routes below: `/api/v1`
- Health check: `GET /`
- Auth: most protected routes expect `Authorization: Bearer <Firebase ID token>`
- Common response envelope: `{ success: true, data: ... }` or `{ success: false, error: "..." }`
- Some routes return a slightly different shape, which is called out in the table

## Users

| Req.Type | Endpoint | Expected request payload | Response format | What that endpoint is used for |
| --- | --- | --- | --- | --- |
| POST | `/api/v1/users/sync` | Header: `Authorization: Bearer <Firebase ID token>` | `200 { message, user }` | Creates or syncs the local user record from Firebase login data |
| GET | `/api/v1/users/me` | No body; auth required | `{ user }` | Returns the authenticated user profile, including volunteer profile if present |
| PUT | `/api/v1/users/me` | JSON body with any of: `name`, `city`, `lat`, `lng` | `{ message: "Profile updated", user }` | Updates the authenticated user profile |
| DELETE | `/api/v1/users/me` | No body; auth required | `{ success: true, message }` | Soft-deletes the authenticated account |
| POST | `/api/v1/users/volunteer-profile` | JSON body with `skills` and `availability` | `{ success: true, data }` | Creates or updates the current user's volunteer profile |
| POST | `/api/v1/users/fcm-token` | JSON body: `token` | `{ success: true, data }` | Registers an FCM device token for push notifications |
| GET | `/api/v1/users/trust-score/history` | No body; auth required | `{ success: true, data }` | Returns trust score history entries for the authenticated user |
| GET | `/api/v1/users/:id` | Path param `id` | `{ user }` | Returns a public user profile by ID |
| GET | `/api/v1/users/my-created-resources` | No body; auth required (`Authorization: Bearer <Firebase ID token>`) | `{ success: true, data: { fieldReports: [], issues: [], tasks: [] } }` | Returns field reports, issues, and tasks created by the authenticated user (includes SUGGESTED and APPROVED items) |

## Organizations

| Req.Type | Endpoint | Expected request payload | Response format | What that endpoint is used for |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/organizations` | Optional query params: `type`, `city`, `verificationStatus`, `page`, `limit` | `{ success: true, meta, data }` | Lists organizations with filtering and pagination |
| GET | `/api/v1/organizations/:id` | Path param `id` | `{ success: true, data }` | Returns organization details |
| POST | `/api/v1/organizations` | Auth required; JSON body with `name`, `type`, `description`, `city`, `lat`, `lng` | `{ success: true, data }` | Creates a new organization and makes the creator its OWNER |
| PATCH | `/api/v1/organizations/:id` | Auth + org role; JSON body with organization fields to update | `{ success: true, data }` | Updates organization details |
| DELETE | `/api/v1/organizations/:id` | Auth + OWNER role; no body | `{ success: true }` | Deletes an organization |
| GET | `/api/v1/organizations/invites` | Auth required; no body | `{ success: true, data }` | Lists pending invites for the authenticated user's email |
| POST | `/api/v1/organizations/invites/:inviteId/accept` | Auth required; path param `inviteId` | `{ success: true, data }` | Accepts an invite and joins the organization |
| GET | `/api/v1/organizations/:id/members` | Auth + ADMIN/OWNER role | `{ success: true, data }` | Lists active organization members |
| PATCH | `/api/v1/organizations/:id/members/:userId` | Auth + ADMIN/OWNER role; JSON body with membership fields such as `baseRole`, `customRoleName`, `status` | `{ success: true, data }` | Updates a member's role or membership data |
| DELETE | `/api/v1/organizations/:id/members/:userId` | Auth + ADMIN/OWNER role; no body | `{ success: true }` | Removes a member from the organization |
| POST | `/api/v1/organizations/:id/leave` | Auth required; no body | `{ success: true }` | Lets the current user leave the organization |
| POST | `/api/v1/organizations/:id/invite` | Auth + ADMIN/OWNER role; JSON body: `email`, `role` | `{ success: true, message, data }` | Creates an organization invite and emails it |
| POST | `/api/v1/organizations/:id/initiate-verification` | Auth + OWNER role; JSON body: `darpanId` | `{ success: true, data }` | Starts NGO verification with a DARPAN ID |
| POST | `/api/v1/organizations/:id/send-otp` | Auth + OWNER role; no body | `{ success: true, message }` | Sends verification OTP to the verified contact email |
| POST | `/api/v1/organizations/:id/verify-otp` | Auth + OWNER role; JSON body: `otp` | `{ success: true, data }` | Verifies NGO OTP and marks the organization verified |
| GET | `/api/v1/organizations/:id/dashboard` | Auth + ADMIN/OWNER role; no body | `{ success: true, data }` | Returns organization dashboard counts for issues, tasks, and members |
| GET | `/api/v1/organizations/:id/created-resources` | Auth + ADMIN/OWNER role; path param `id` | `{ success: true, data: { fieldReports: [], issues: [], tasks: [] } }` | Returns field reports, issues, and tasks created by or associated with the organization (useful for review and approval workflows) |

## Issues

| Req.Type | Endpoint | Expected request payload | Response format | What that endpoint is used for |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/issues` | Optional query params: `page`, `limit`, `city`, `category`, `status` | `{ success: true, data, meta }` | Lists issues with filtering and pagination |
| GET | `/api/v1/issues/nearby` | Query params: `lat`, `lng`, optional `radius` | `{ success: true, data, meta }` | Returns issues near a geographic point |
| GET | `/api/v1/issues/map/heatmap` | Query param: `city` | `{ success: true, data }` | Returns GeoJSON/heatmap data for map rendering |
| GET | `/api/v1/issues/:id` | Path param `id` | `{ success: true, data }` | Returns issue details, comments, tasks, media, and related org/user info |
| GET | `/api/v1/issues/:id/comments` | Path param `id` | `{ success: true, data }` | Lists comments on an issue |
| GET | `/api/v1/issues/:id/collaborators` | Path param `id` | `{ success: true, data }` | Lists collaborating organizations for an issue |
| POST | `/api/v1/issues` | Auth required; JSON body with required `title`, `description`, `category`, `urgency`, `lat`, `lng`, `city`; optional `ownerOrgId`, `fieldReportId`, `source`, `approvalStatus` | `{ success: true, data }` | Creates a new issue reported by a user |
| POST | `/api/v1/issues/public-report` | Auth required; same body as issue creation | `{ success: true, message, data }` | Submits a public report and notifies nearby NGOs |
| PATCH | `/api/v1/issues/:id` | Auth required; partial issue update body | `{ success: true, data }` | Updates an issue owned by the authenticated reporter |
| POST | `/api/v1/issues/:id/verify` | Auth required; no body | `{ success: true, data }` | Marks an issue as human verified by the owning organization |
| POST | `/api/v1/issues/:id/collaborate` | Auth + org admin/owner; JSON body: `orgId` | `{ success: true, data }` | Adds another organization as a collaborator on the issue |
| POST | `/api/v1/issues/:id/comments` | Auth required; JSON body: `content` | `{ success: true, data }` | Adds a comment to an issue |
| PATCH | `/api/v1/issues/comments/:commentId` | Auth required; JSON body: `content` | `{ success: true, data }` | Updates an existing comment by its author |
| DELETE | `/api/v1/issues/comments/:commentId` | Auth required; no body | `{ success: true }` | Deletes an issue comment |
| POST | `/api/v1/issues/:id/media` | Auth required; JSON body such as `url`, `type`, optional `startTime`, `endTime` | `{ success: true, data }` | Attaches media to an issue |
| DELETE | `/api/v1/issues/media/:mediaId` | Auth required; no body | `{ success: true }` | Deletes a media item from an issue |
| GET | `/api/v1/issues/organization/:orgId/suggested` | Auth + ADMIN/OWNER role; path param `orgId` | `{ success: true, data }` | Lists suggested issues awaiting organization review |
| POST | `/api/v1/issues/:issueId/approve` | Auth + ADMIN/OWNER role; optional JSON body: `orgId` | `{ success: true, data, message }` | Approves a suggested issue |
| POST | `/api/v1/issues/:issueId/reject` | Auth + ADMIN/OWNER role; optional JSON body: `orgId` | `{ success: true, data, message }` | Rejects a suggested issue |

## Tasks

| Req.Type | Endpoint | Expected request payload | Response format | What that endpoint is used for |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/tasks/issues/:issueId/tasks` | Path param `issueId` | `{ success: true, data }` | Returns all tasks for a specific issue |
| POST | `/api/v1/tasks/issues/:issueId/tasks` | Auth + ADMIN/OWNER role; JSON body with `title`, `description`, `category`, `requiredSkills`, `volunteersNeeded` | `{ success: true, data }` | Creates a task for an issue |
| GET | `/api/v1/tasks/organizations/:id/tasks` | Auth + ADMIN/OWNER role; path param `id` | `{ success: true, data }` | Lists tasks for an organization |
| GET | `/api/v1/tasks/tasks/:id/applicants` | Auth + ADMIN/OWNER role; path param `id` | `{ success: true, data }` | Lists volunteer applicants for a task |
| GET | `/api/v1/tasks/tasks/:id/recommended-volunteers` | Auth + ADMIN/OWNER role; path param `id` | `{ success: true, data }` | Returns ranked volunteer recommendations for a task |
| POST | `/api/v1/tasks/tasks/:taskId/apply` | Auth required; no body | `{ success: true, data }` | Lets the authenticated volunteer apply to a task |
| GET | `/api/v1/tasks/assignments/:id` | Auth required; path param `id` | `{ success: true, data }` | Returns a single assignment record |
| PATCH | `/api/v1/tasks/assignments/:id` | Auth required; JSON body, typically `status` and optional `feedbackScore` | `{ success: true, data }` | Updates an assignment and can trigger trust-score side effects |
| GET | `/api/v1/tasks/volunteers/assignments` | Auth required; no body | `{ success: true, data }` | Lists the authenticated volunteer's assignments |
| GET | `/api/v1/tasks/organization/:orgId/suggested` | Auth + ADMIN/OWNER role; path param `orgId` | `{ success: true, data }` | Lists suggested tasks awaiting organization approval |
| POST | `/api/v1/tasks/:taskId/approve` | Auth + ADMIN/OWNER role; optional JSON body: `orgId` | `{ success: true, data, message }` | Approves a suggested task |
| POST | `/api/v1/tasks/:taskId/reject` | Auth + ADMIN/OWNER role; optional JSON body: `orgId` | `{ success: true, data, message }` | Rejects a suggested task |

## Trust

| Req.Type | Endpoint | Expected request payload | Response format | What that endpoint is used for |
| --- | --- | --- | --- | --- |
| POST | `/api/v1/trust/feedback` | Auth required; JSON body: `assignmentId`, `score` | `{ success: true, data }` | Submits feedback for an assignment and adjusts trust scores |
| GET | `/api/v1/trust/trust-scores/leaderboard` | No body | `{ success: true, data }` | Returns the top volunteers and organizations by trust score |

## Admin

| Req.Type | Endpoint | Expected request payload | Response format | What that endpoint is used for |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/admin/organizations/pending` | Auth required; platform admin only | `{ success: true, data }` | Lists organizations waiting for verification review |
| POST | `/api/v1/admin/organizations/:id/add-contact` | Auth required; platform admin only; JSON body: `email` | `{ success: true, data }` | Adds a verified contact email to an NGO |
| GET | `/api/v1/admin/stats` | Auth required; platform admin only | `{ success: true, data }` | Returns platform-wide counts and summary stats |

## AI

| Req.Type | Endpoint | Expected request payload | Response format | What that endpoint is used for |
| --- | --- | --- | --- | --- |
| POST | `/api/v1/ai/ocr` | JSON body: `fileUrl` | `{ success: true, data }` | Runs OCR on a file URL |
| POST | `/api/v1/ai/transcribe` | JSON body: `fileUrl` | `{ success: true, data }` | Transcribes an audio/video file URL |
| POST | `/api/v1/ai/translate` | JSON body: `text` | `{ success: true, data }` | Translates text to English |
| POST | `/api/v1/ai/analyze-survey` | JSON body: survey data object | `{ success: true, data }` | Performs AI survey analysis |
| POST | `/api/v1/ai/classify-issue` | JSON body: `text` | `{ success: true, data }` | Classifies an issue from text |
| POST | `/api/v1/ai/generate-report` | JSON body object passed into the pipeline, typically including `mediaUrls` and contextual fields | `{ success: true, data: { report, pdfUrl } }` | Generates an assessment report PDF from AI pipeline inputs |
| POST | `/api/v1/ai/regenerate-report` | JSON body: `originalReport`, `feedback` | `{ success: true, data: { report, pdfUrl } }` | Regenerates a report from user feedback |
| POST | `/api/v1/ai/process-field-report-and-create-issues` | Auth required; `multipart/form-data` with optional file fields `files[]`, `docs[]` plus body fields `lat`, `lng`, `city`, optional `organizationId`, `description`, `text`, `mediaUrls` | `201 { success: true, message, data }` or `202` / `200` for cached or in-progress cases | Processes a field report, extracts issues and tasks, and auto-creates suggested records |

## Notifications

| Req.Type | Endpoint | Expected request payload | Response format | What that endpoint is used for |
| --- | --- | --- | --- | --- |
| POST | `/api/v1/notifications/subscribe` | Auth required; JSON body: `token` | `{ success: true, data }` | Saves an FCM token for the current user |
| DELETE | `/api/v1/notifications/token` | Auth required; JSON body: `token` | `{ success: true }` | Removes a stored FCM token |
| GET | `/api/v1/notifications/history` | Auth required; no body | `{ success: true, data }` | Returns notification history for the current user |
| PATCH | `/api/v1/notifications/:id/read` | Auth required; path param `id` | `{ success: true }` | Marks one notification as read |
| PATCH | `/api/v1/notifications/read-all` | Auth required; no body | `{ success: true }` | Marks all unread notifications as read |

## Upload

| Req.Type | Endpoint | Expected request payload | Response format | What that endpoint is used for |
| --- | --- | --- | --- | --- |
| POST | `/api/v1/upload` | `multipart/form-data` with a single file field named `file` | `{ success: true, data }` | Uploads a file to storage and returns the public URL, storage path, and file type |

## Response Shape Examples

Most endpoints return JSON in one of these forms:

```json
{ "success": true, "data": {} }
```

```json
{ "success": false, "error": "Reason" }
```

Some routes return extra fields such as `message`, `meta`, or `user`. The tables above call out those cases where the controller uses a different envelope.