# Auth/Payment Gate Restore Checklist

Purpose: restore the user-side auth wall and payment step after temporary bypass mode.

## Current bypass markers

Search for these markers and follow the steps below:
- AUTH_GATE_DISABLED
- PAYMENT_GATE_DISABLED

## Restore steps

- [ ] Restore upload auth wall in UI:
  - File: components/HeroSection.tsx
  - File: frontend/components/HeroSection.tsx
  - Action: Uncomment each AUTH_GATE_DISABLED block in:
    - handleFileSelect
    - handleDrop
    - handleButtonClick
  - Action: Keep Sign Up modal as-is (it is already present).

- [ ] Restore strict auth headers in upload requests:
  - File: components/HeroSection.tsx
  - File: frontend/components/HeroSection.tsx
  - Action: Replace current conditional Headers logic with the commented original headers blocks inside both fetch calls in handleUpload.

- [ ] Restore payment gate in post-upload flow:
  - File: components/HeroSection.tsx
  - File: frontend/components/HeroSection.tsx
  - Action: Replace the current processing redirect with the commented original payment redirect block:
    - from: router.push('/processing?mode=analysis')
    - to: router.push('/payment')
  - Action: Revert success-modal copy from "Starting processing..." to "Redirecting to payment...".

- [ ] Restore Next.js upload API auth enforcement:
  - File: app/api/upload/route.ts
  - File: frontend/app/api/upload/route.ts
  - Action: Uncomment the original unauthorized return block.
  - Action: Remove guest fallback userId assignment.
  - Action: Use auth.userId again when building the S3 key.

- [ ] Restore backend upload endpoint auth enforcement:
  - File: backend/app/api/v1/upload.py
  - File: frontend/backend/app/api/v1/upload.py
  - Action: Change dependency back from get_optional_user to get_current_user in both endpoints.
  - Action: Remove Optional and uuid4 imports added for guest mode.
  - Action: Use current_user.id directly instead of guest fallback user_id.

- [ ] Restore middleware protected-route auth redirects:
  - File: lib/supabase/middleware.ts
  - File: app/lib/supabase/middleware.ts
  - File: frontend/lib/supabase/middleware.ts
  - Action: Uncomment AUTH_GATE_DISABLED redirect block for protected routes so unauthenticated users are redirected to /signin.

- [ ] Restore post-upload flow endpoint auth/ownership checks:
  - File: backend/app/api/v1/status.py
  - File: backend/app/api/v1/questions.py
  - File: backend/app/api/v1/answers.py
  - File: backend/app/api/v1/download.py
  - File: frontend/backend/app/api/v1/status.py
  - File: frontend/backend/app/api/v1/questions.py
  - File: frontend/backend/app/api/v1/answers.py
  - File: frontend/backend/app/api/v1/download.py
  - Action: Replace get_optional_user with get_current_user on user-facing endpoints.
  - Action: Remove Optional imports if no longer needed.
  - Action: Replace conditional ownership checks:
    - from: if current_user and resume.user_id != current_user.id
    - to: if resume.user_id != current_user.id
  - Action: Keep endpoint status checks and business rules unchanged.

## Validation after restore

- [ ] Logged-out user clicks Upload button and sees sign-up modal.
- [ ] Logged-out user drag/drop shows sign-up modal.
- [ ] Logged-out upload request returns 401 from /api/upload.
- [ ] Successful upload redirects to /payment.
- [ ] Authenticated user upload and /upload-s3 registration still succeed.
- [ ] Unauthenticated access to /processing, /questions, /resume-preview, /profile, /payment redirects to /signin.
- [ ] Unauthenticated calls to /api/v1/status/{id}, /api/v1/questions/{id}, /api/v1/answers, /api/v1/preview/{id}, /api/v1/download/{id} are blocked by auth.

## Notes

This checklist is user-flow focused (auth wall + payment step). If you later change status/questions/download access policies, validate those separately.
