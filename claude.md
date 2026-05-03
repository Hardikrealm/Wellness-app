# CLAUDE.md — Mindfully Yours Platform

> This file is the authoritative context document for AI-assisted development of the Mindfully Yours platform. Read this before touching any code.

---

## What This Project Is

**Mindfully Yours** is a two-sided mental health platform connecting Mental Health Users (MHUs) with verified Mental Health Professionals (MHPs) in India. It is an AI-first platform — the core product is an AI companion that guides users from emotional awareness through to sustained clinical care.

This is a **clinically sensitive platform**. Every technical decision has downstream implications for user safety, data privacy, and regulatory compliance. When in doubt, prioritise safety and privacy over developer convenience.

**Client:** Pranav Joshi & Shreya Aras, Mindfully Yours Pvt Ltd  
**Clinical Lead:** Shreya Aras (must review all AI system prompts and crisis-related features before build)

---

## Monorepo Structure

```
mindfully-yours/
├── apps/
│   ├── mobile/          # Flutter app (MHU + MHP, shared codebase)
│   ├── web-mhu/         # Next.js 14 — MHU web portal
│   ├── web-mhp/         # Next.js 14 — MHP web portal
│   ├── web-admin/       # Next.js 14 — Admin dashboard
│   └── api/             # NestJS backend
├── packages/
│   ├── shared-types/    # TypeScript types shared across web apps
│   ├── ui/              # Shared Shadcn component library (web only)
│   └── config/          # ESLint, Prettier, TypeScript base configs
├── infra/               # AWS CDK or Terraform definitions
└── CLAUDE.md            # ← you are here
```

---

## Tech Stack — Quick Reference

| Layer | Technology | Notes |
|---|---|---|
| Mobile | Flutter 3.x + Riverpod 2.x + GoRouter | Single codebase, iOS + Android |
| Web (all portals) | Next.js 14 App Router + TypeScript | SSR on MHU portal, RSC throughout |
| Admin UI | Next.js + Shadcn/ui + Tailwind | Internal tool, desktop-first |
| Backend | Node.js 20 LTS + NestJS | Modular, DI-based |
| API Style | REST + Socket.io | REST for CRUD, WS for real-time |
| Auth | Custom JWT + OTP (MSG91) | bcrypt cost 12, 15-min access tokens |
| Primary DB | PostgreSQL 16 (AWS RDS Multi-AZ) | All structured data |
| Document DB | MongoDB (AWS DocumentDB) | Companion logs, mood data |
| Cache | Redis 7 (AWS ElastiCache) | Slot locking, rate limiting, presence |
| Vector Store | pgvector (Phase 1) → Pinecone (Phase 2) | RAG for companion memory |
| Search | AWS OpenSearch (Phase 2 only) | MHP full-text search |
| File Storage | AWS S3 + CloudFront | Credentials, documents, recordings |
| Payments | Razorpay + Razorpay Route | Initiate KYC Week 1 — it takes 4–8 weeks |
| Push | Firebase Cloud Messaging | All mobile push |
| SMS / WhatsApp | MSG91 + Wati | OTP via MSG91, reminders via Wati |
| LLM | Anthropic Claude (primary) / OpenAI (fallback) | Abstracted behind internal LLM service |
| Video (Phase 1) | Agora or Daily.co SDK | Replaced with in-house WebRTC in Phase 2 |
| Speech-to-Text | Whisper (self-hosted on EC2) | Phase 2 only — audio never leaves AWS |
| Email | AWS SES | Transactional only |
| Analytics | Mixpanel or Amplitude | No PII transmitted to analytics |
| Error Tracking | Sentry | All surfaces |
| Infra Monitoring | CloudWatch + PagerDuty | P1 alerts via PagerDuty |
| Secrets | AWS Secrets Manager | No secrets in code, ever |
| CI/CD | GitHub Actions + AWS ECR + CodeDeploy | Rolling deployments |
| CSS | Tailwind CSS | Custom design tokens, not raw colours |
| Region | AWS ap-south-1 (Mumbai) ONLY | Data sovereignty — non-negotiable |

---

## User Roles

Three user types. Each has a completely different data model and interface.

| Role | Interface | Description |
|---|---|---|
| `MHU` | Mobile app + Web portal | Mental Health User — the person seeking care |
| `MHP` | Mobile app (limited) + Web portal | Mental Health Professional — therapists, psychiatrists |
| `Admin` | Web admin dashboard only | Internal Mindfully Yours team, tiered access |

Admin access is further split into 5 tiers:
- `super_admin` — unrestricted
- `clinical_lead` — clinical + crisis data only (Shreya's role)
- `ops_admin` — MHP verification, complaints
- `finance_admin` — payments, payouts, reconciliation
- `content_admin` — CMS, newsletters, webinars

---

## Backend Architecture (NestJS)

### Module Structure

```
api/src/
├── auth/              # JWT, OTP, refresh token rotation
├── users/             # Shared user entity (mhu + mhp + admin)
├── mhu/               # MHU profile, onboarding, preferences
├── mhp/               # MHP profile, availability, verification
├── admin/             # Admin-only operations
├── companion/         # AI companion orchestration (see AI section)
├── triage/            # PHQ-9, GAD-7 scoring, care level assignment
├── matching/          # MHP matchmaking algorithm
├── scheduling/        # Booking engine, slot management
├── sessions/          # Video session rooms, notes
├── payments/          # Razorpay integration, payout splits
├── notifications/     # FCM, MSG91, Wati dispatch
├── crisis/            # Crisis detection and escalation (CLINICAL — READ CAREFULLY)
├── archive/           # Session history, mood logs, companion logs
├── analytics/         # MIS reporting, funnel data
├── content/           # Resource library, newsletter CMS
└── audit/             # Append-only audit logging (NO DELETE EVER)
```

### Guards & RBAC

**RBAC must be enforced at the API route level, not just the frontend.**  
A user can make raw API calls bypassing the UI. Guards are the actual security boundary.

```typescript
// Every route must have explicit role guards
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('mhp')
@Get('patients/:mhuId/history')
async getPatientHistory(@Param('mhuId') mhuId: string, @CurrentUser() mhp: AuthUser) {
  // ALSO check that mhp has an active assignment to this mhuId
  // Never trust the param alone
}
```

Key RBAC rules to enforce:
1. MHU queries **always** include `WHERE user_id = :authenticated_user_id` — no exceptions
2. MHP cannot access another MHP's patient records — enforce via therapist-patient assignment join
3. MHP cannot access companion logs without a valid consent record (check `consents` table)
4. Admin analytics use pre-aggregated anonymised views — no direct clinical table access for non-clinical roles
5. All clinical data access is **logged to the audit table** (append-only, no DELETE granted)

### Authentication

```typescript
// Access token: 15-minute expiry, role in payload
// Refresh token: 30-day expiry, stored in HttpOnly cookie
// OTP: 6-digit via MSG91, 5-minute expiry, max 3 attempts before lockout

// JWT payload shape
interface JwtPayload {
  sub: string;         // user UUID
  role: UserRole;      // 'mhu' | 'mhp' | 'admin'
  adminTier?: AdminTier; // only present if role === 'admin'
  iat: number;
  exp: number;
}
```

---

## Database Schema — Core Entities

### PostgreSQL (primary relational data)

```sql
-- users: single table for all roles
users (id uuid PK, phone_hash text UNIQUE, email_hash text, role user_role_enum, 
       status user_status_enum, consent_version int, created_at timestamptz)

-- mhu_profiles
mhu_profiles (user_id uuid FK UNIQUE, preferred_language text, location_lat float, 
              location_lng float, onboarding_completed bool, triage_level triage_level_enum,
              assigned_mhp_id uuid FK nullable)

-- mhp_profiles  
mhp_profiles (user_id uuid FK UNIQUE, registration_number text, specialisations text[],
              languages text[], session_rate_inr int, verification_status verification_enum,
              rating_avg float, session_count int, payout_account_id text)

-- sessions
sessions (id uuid PK, mhu_id uuid FK, mhp_id uuid FK, scheduled_at timestamptz,
          status session_status_enum, session_type session_type_enum,
          duration_minutes int, payment_id uuid FK, room_token text, created_at timestamptz)

-- payments
payments (id uuid PK, session_id uuid FK, razorpay_order_id text, amount_inr int,
          platform_share_inr int, mhp_share_inr int, status payment_status_enum,
          payout_id text, refund_id text, created_at timestamptz)

-- mhp_availability
mhp_availability (id uuid PK, mhp_id uuid FK, day_of_week int, start_time time,
                  end_time time, max_sessions_per_day int, buffer_minutes int)

-- session_notes (fields encrypted at application level before storage)
session_notes (id uuid PK, session_id uuid FK, mhp_id uuid FK,
               content_encrypted bytea, goals_encrypted bytea,
               risk_flags text[], homework_assigned text, created_at timestamptz)

-- consents
consents (id uuid PK, mhu_id uuid FK, consent_type text, granted_to_id uuid nullable,
          granted_at timestamptz, expires_at timestamptz, revoked_at timestamptz,
          consent_text_version int)

-- audit_logs (append-only — never grant DELETE)
audit_logs (id uuid PK, timestamp timestamptz, actor_id uuid, actor_role text,
            resource_type text, resource_id uuid, action text, ip_address inet)

-- crisis_flags
crisis_flags (id uuid PK, mhu_id uuid FK, triggered_at timestamptz,
              severity_level crisis_severity_enum, source text,
              resolved_at timestamptz, resolver_id uuid FK)
```

### MongoDB (DocumentDB) — companion + mood data

```javascript
// companion_conversations collection
{
  _id: ObjectId,
  mhu_id: String,       // UUID reference (no FK enforcement)
  session_date: Date,
  messages: [
    { role: 'user' | 'assistant', content: String, timestamp: Date, risk_flags: [] }
  ],
  triage_score: { phq9: Number, gad7: Number },
  risk_flags: ['suicidal_ideation' | 'acute_distress' | 'hopelessness'],
  embedding_id: String  // reference to vector store
}

// mood_logs collection
{
  _id: ObjectId,
  mhu_id: String,
  timestamp: Date,
  score: Number,           // 1-10
  emotions: [String],      // Plutchik emotion wheel selections
  journal_text_encrypted: String,  // encrypted before storage
  linked_conversation_id: ObjectId
}
```

---

## AI Companion — Architecture

The companion is the most complex and clinically sensitive component. Read this carefully.

### The Companion is NOT a Raw LLM Wrapper

The system architecture is:

```
User message
    ↓
[Orchestration Layer — NestJS State Machine]
    ↓ determines companion "mode"
    ↓ enforces topic guardrails
    ↓
[Memory Retrieval — RAG]
    ↓ semantic search on past conversation embeddings
    ↓
[LLM Call — Anthropic / OpenAI]
    ↓ includes: system prompt + history + retrieved memory + emotional state vector
    ↓
[Output Safety Layer — Classifier]
    ↓ blocks: diagnostic language, medication advice, self-harm descriptions
    ↓ logs violations for system prompt improvement
    ↓
Response to user
```

### Companion Modes

The state machine routes conversations through these modes:

| Mode | Trigger | Behaviour |
|---|---|---|
| `casual_check_in` | Default / daily check-in | Light, supportive, mood logging |
| `triage` | First session or re-triage trigger | PHQ-9 / GAD-7 conversational delivery |
| `crisis` | Risk classifier fires | Escalation protocol, resources surfaced |
| `between_session` | Booked user between sessions | Homework follow-up, mood continuity |
| `post_session` | Within 24hrs of session | Session reflection, goal setting |

### LLM Service — Abstract the Provider

```typescript
// All LLM calls go through this internal service — never call Anthropic/OpenAI directly
// This allows provider switching without changing companion logic

@Injectable()
export class LLMService {
  async generateCompanionResponse(payload: {
    systemPrompt: string;
    history: Message[];
    retrievedMemory: string;
    emotionalStateVector: number[];
  }): Promise<string>
}
```

### Triage Protocol

- PHQ-9 and GAD-7 questions are **woven into conversation over multiple turns** — never presented as a form
- Scores are **calculated server-side** and never exposed to the user as a raw number
- Triage output maps to 4 care levels: `wellbeing_support` / `mild_clinical` / `moderate_severe` / `crisis`
- Clinical validation by Shreya required before this goes live

### Output Safety Rules

Every LLM output must be checked before it reaches the user. Block if output contains:
- Any diagnostic language ("you have", "you appear to have", "you are experiencing")
- Medication recommendations or dosage information
- Explicit descriptions of self-harm methods
- Definitive clinical assessments

All violations logged. Use violation logs to iterate on system prompts weekly.

### Apple Guideline 1.4.2 Compliance

**This must be addressed at design stage, not as an afterthought.**

- All AI outputs must use "self-reflection" or "check-in" framing — never diagnostic
- Good: "Based on what you've shared, speaking to a professional might help"
- Bad: "You appear to have moderate depression"
- All system prompts must be reviewed by Shreya before App Store submission
- Any post-launch change to AI behaviour requires re-review by clinical lead

---

## Crisis Detection System

**Clinical feature, not a product feature. Design in consultation with Shreya before building.**

### Signal Detection

All messages, journal entries, and mood logs run through a real-time risk classifier:

- Suicidal ideation keywords
- Acute distress language
- Expressions of hopelessness
- Sudden sharp mood drops (≥4 points on 1–10 scale in a single log)

### Severity Levels & Protocols

| Severity | Trigger | MHU Response | MHP Response | Admin Log |
|---|---|---|---|---|
| `low` | Below-threshold but notable | Companion shifts tone, checks in | None | Logged |
| `medium` | Concerning pattern | SOS resources surfaced, helpline shown | None | Logged |
| `high` | Immediate risk language | Helpline surfaced, emergency contact option | Push alert to assigned MHP (severity + timestamp only, no content) | Logged + clinical review |

**Crisis helplines to surface (India):**
- iCall: 9152987821
- Vandrevala Foundation: 1860-2662-345
- NIMHANS: 080-46110007

---

## Scheduling Engine — Critical Rules

The scheduling system must prevent double-bookings under concurrent load:

```typescript
// Slot locking flow:
// 1. User selects slot → soft-lock in Redis with 5-minute TTL
// 2. Payment begins
// 3. On payment success → convert to confirmed booking in PostgreSQL
// 4. On payment failure or timeout → Redis TTL expires, slot released

// Use optimistic locking in PostgreSQL for concurrent booking attempts
// Reject at API level if slot status has changed since soft-lock
```

**Cancellation policy engine (all rules configurable from admin panel):**
- Reschedule >24hrs before: no cost
- Reschedule <24hrs: reschedule fee applies
- No-show: full session fee charged, MHP receives 80%
- Refund triggered automatically via Razorpay Refund API

---

## Payment Architecture

**Start Razorpay Route KYC on Week 1. It takes 4–8 weeks.**

```
MHU pays session fee
    ↓
Razorpay Order created server-side
    ↓
MHU completes payment in app
    ↓
Razorpay webhook → verify signature → update payment record
    ↓
Session marked confirmed
    ↓
After session completion (24hr window)
    ↓
Razorpay Route splits: MHP share → MHP bank, platform share → platform account
    ↓
Payout record created, MHP dashboard updated
```

**Never trust the frontend for payment amounts. Always calculate server-side.**  
**Always verify Razorpay webhook signatures before processing.**

---

## Encryption Strategy

| Layer | Method | Scope |
|---|---|---|
| In transit | TLS 1.3, HSTS | All connections |
| At rest (DB) | AES-256, AWS KMS | All RDS + DocumentDB |
| At rest (files) | SSE-S3, customer-managed KMS | All S3 objects |
| Application-level | Field-level encryption before storage | session_notes, companion content, assessment scores |
| Mobile storage | flutter_secure_storage | Auth tokens, session state |

**Field-level encryption on session notes:**
```typescript
// Encrypt BEFORE writing to DB, decrypt AFTER reading
// Encryption key stored in AWS Secrets Manager, separate from DB credentials
// Never log decrypted clinical data
```

---

## Environment Variables Pattern

All secrets come from AWS Secrets Manager at runtime. No secrets in `.env` files committed to git.

```bash
# .env.example — structure only, no real values
DATABASE_URL=
REDIS_URL=
MONGODB_URI=
JWT_SECRET=
JWT_REFRESH_SECRET=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
ANTHROPIC_API_KEY=
MSG91_AUTH_KEY=
WATI_API_KEY=
FCM_SERVER_KEY=
AWS_SES_REGION=
S3_BUCKET_NAME=
CLOUDFRONT_DOMAIN=
FIELD_ENCRYPTION_KEY=
```

---

## Mobile App (Flutter) — Key Patterns

```dart
// State management: Riverpod 2.x only
// Navigation: GoRouter (role-based route guards at router level)
// Secure storage: flutter_secure_storage (never SharedPreferences for sensitive data)
// HTTP: Dio with interceptors for JWT refresh

// Route guard pattern — detect role post-login, render different experience
// MHU sees wellness journey, MHP sees professional dashboard
// Same app binary, different widget trees based on role claim in JWT
```

**Mood logging inputs:**
- 1–10 slider
- Emotion wheel (Plutchik's model — 8 primary, 8 secondary emotions)
- Free-text journal
- Optional image/audio attachment

---

## Web Portals (Next.js) — Key Patterns

```typescript
// All three web surfaces: Next.js 14 App Router, TypeScript, Tailwind
// MHU portal: SSR for SEO, public-facing pages
// MHP portal: Desktop-first, professional layout
// Admin dashboard: Shadcn/ui components, internal tool

// Role-based routing: separate /app/(mhu), /app/(mhp), /app/(admin) route groups
// Auth: JWT in HttpOnly cookie, refreshed via /api/auth/refresh
// Real-time: Socket.io client for session rooms and live notifications
```

---

## Notification Cadence

For every session booking:
1. Booking confirmation — immediate (push + email)
2. 24hr reminder (push + WhatsApp via Wati)
3. 1hr reminder (push + SMS via MSG91)
4. 15min pre-session (push)
5. Post-session check-in — 2hrs after (push, opens companion in check-in mode)

Fallback: if push not delivered within 5 minutes → SMS triggered automatically.

---

## AWS Infrastructure

**Region: ap-south-1 (Mumbai) ONLY. Data must never leave India.**

| Service | Config |
|---|---|
| EC2 | t3.medium, Auto-scaling min 2 / max 10, behind ALB |
| RDS PostgreSQL | db.t3.medium, Multi-AZ, daily backups 30-day retention, AES-256, VPC-only |
| DocumentDB | MongoDB-compatible, encrypted, clustered |
| ElastiCache Redis | Redis 7 cluster, 2 shards + 1 replica each, TLS, VPC-only |
| S3 | SSE-S3 + KMS, versioning enabled, no public read |
| CloudFront | Signed URLs for sensitive S3, WAF rate limiting |
| Secrets Manager | All credentials, auto-rotation on DB creds |
| CloudWatch | Infrastructure metrics + log aggregation |
| ECR | Docker image registry |
| SES | Transactional email, SPF/DKIM configured |

### Environments

| Env | Data | Access |
|---|---|---|
| Development | Seeded synthetic only — no real user data | All developers |
| Staging | Anonymised prod structure, Razorpay test mode | Dev + Client + QA |
| Production | Live data, full encryption, Razorpay live | Automated deployments only |

---

## Data Retention Policy

| Data Type | Retention | Notes |
|---|---|---|
| Active user data | While account active | User can delete individual entries (immediate, permanent) |
| Deleted accounts | PII purged within 30 days | Anonymised aggregate retained indefinitely |
| Payment records | 7 years | Tax compliance, PII removed |
| Audit logs | 5 years | Cannot be deleted by any role; S3 Glacier after 1 year |
| Crisis flags | 5+ years | Medico-legal protection; clinical lead access only |

**Companion logs:** User can delete individual entries or full periods. Deletion is immediate and permanent — no soft deletes for companion content.

---

## Regulatory Compliance — Build Constraints

### DPDP Act (India 2023)

- Explicit, granular consent at every touchpoint — log consent version + timestamp
- No cross-border data transfer — LLM API calls must minimise PII (send summaries, not raw identifying content)
- Right to erasure must be built into user settings — 30-day PII purge on deletion
- Grievance Officer contact must appear in-app and on website

### Telemedicine Guidelines (MoHFW 2020)

- All MHPs must be licensed practitioners — no exceptions
- No prescription functionality in Phase 1 (psychiatry prescriptions require additional legal review)
- Teletherapy / counselling is within guidelines

### RCI / MCI Verification

- No automated API exists for credential verification in India
- All verification is manual via admin panel queue
- MHP is NOT visible to any MHU until verification status is `active`
- Verification records retained permanently
- Annual re-verification reminder system required

---

## MHP Verification Flow

```
MHP registers → submits documents to S3 (restricted IAM)
    ↓
Admin ops queue shows pending verification
    ↓
Admin reviews document by document → approve / reject with notes
    ↓
MHP notified at each status change (email + push)
    ↓
All docs verified → MHP sets availability, rates, payout account
    ↓
Razorpay KYC for Route payouts (separate process)
    ↓
Profile goes live to MHUs
```

---

## Development Rules

1. **No secrets in code or git history** — use AWS Secrets Manager
2. **No PII in logs** — mask phone numbers, emails, and all clinical content before logging
3. **No real user data in dev or staging** — synthetic + anonymised only
4. **RBAC at API level** — frontend guards are UX, not security
5. **Every clinical data access logged** — audit_logs table, no exceptions
6. **Encryption before storage** — field-level encryption on all clinical fields, never store plaintext
7. **Never call LLM directly** — always go through the internal LLMService abstraction
8. **All LLM output through safety classifier** — before it reaches the user
9. **AI system prompts are clinical content** — Shreya must review before any prompt goes to production
10. **Data never leaves ap-south-1** — verify every third-party integration's data residency

---

## Key Risks to Keep in Mind

| Risk | What to Watch |
|---|---|
| AI companion clinical safety | Multi-layer output safety + Shreya review on all prompts |
| Data breach of clinical records | Field-level encryption + zero-trust + annual pen test |
| Apple App Store rejection | 1.4.2 compliance at design stage, clinical review before submission |
| Razorpay Route KYC delays | KYC initiated Week 1 — fallback manual payouts while pending |
| Double-bookings | Optimistic locking in PostgreSQL + Redis slot TTL |
| LLM provider outage | Provider abstracted, secondary fallback configured, graceful degradation |

---

## Phase Timeline Reference

| Phase | Weeks | Focus |
|---|---|---|
| 1 | 1–6 | PRD, design, infra, AWS provisioning, Razorpay KYC, crisis protocol with Shreya |
| 2 | 7–16 | MHU mobile app + backend API + AI companion MVP |
| 3 | 17–22 | MHP platform + admin dashboard |
| 4 | 23–26 | QA, compliance audit, pen test, App Store submission, go-live |
| 5 | Post-launch | WebRTC in-house, Whisper STT, community forums, enhanced ML |

---

## Questions Before Building Anything

Before implementing any feature in the companion, crisis, or triage modules, ask:

- Has Shreya reviewed the clinical logic and system prompts?
- Is consent being captured and logged for this data access?
- Is this data access logged in the audit table?
- Is this LLM output going through the safety classifier?
- Is any PII leaving AWS ap-south-1?

If any answer is no — stop and fix it before proceeding.
