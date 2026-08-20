# Moderation, feedback, and auditing

> ملخص عربي: البلاغات والفيدباك ولقطات الشاشة تدخل صناديق مراجعة بصلاحيات، والعمليات الحساسة تُسجل بدون عرض هوية تقنية للطالب كاسم عام.

## Student feedback

Students can report a question, suggest an explanation correction, or send general feedback. A screenshot is optional and is uploaded only after the user chooses it. The interface tells users not to include passwords, recovery codes, private conversations, or another person's data.

Anonymous feedback is labeled as anonymous. A raw internal user id is never used as a substitute display name.

## Moderation inboxes

Reports, explanation suggestions, reset events, and feedback are separated into purpose-specific queues. Editors can review scientific content without receiving access to owner-only user and configuration operations.

Lists load compact metadata first. Large historical datasets and screenshots are fetched only when the reviewer opens the relevant detail, reducing exposure and startup cost.

## Audit trail

Sensitive administrative actions create append-oriented audit records containing the actor role, action category, target type, time, and bounded details. Human-readable labels help the owner review activity without exposing secrets in the interface.

Audit access is owner-restricted. Logs must not contain plaintext passwords, tokens, complete session identifiers, or unnecessary personal data.

## Deletion and recovery

Question deletion is recoverable for a defined period. The content record and its image references are preserved until final cleanup. Restore and permanent cleanup are authorized and audited independently.

## Rate limits and validation

Public feedback and upload paths use size limits, accepted file types, origin checks, and abuse controls. User text is rendered as text or escaped before HTML insertion. Detailed production thresholds and internal moderation routes are not published.

## Testing

Regression tests verify alias-only rendering, anonymous fallbacks, screenshot authorization, server-side role boundaries, recycle behavior, audit completeness, bounded list hydration, and the absence of raw user identifiers in admin-facing labels.
