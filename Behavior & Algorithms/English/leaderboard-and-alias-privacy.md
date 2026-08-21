# Leaderboard and alias privacy

## Public identity

The leaderboard is designed around a public alias. It does not need an email address, password metadata, or raw internal user identifier. Profile responses use an explicit public shape containing only the fields required by the page.

The account owner can choose an alias and avatar. A real account name remains private to authorized administration and is not used as the normal ranking label. If public identity cannot be resolved safely, the interface uses a neutral fallback rather than exposing an internal id.

## Ghost mode

Ghost mode excludes the student from peer ranking output while preserving their private study record and statistics. It is a visibility control, not a data-deletion control. Turning it off allows future leaderboard responses to include the alias again.

## Ranking data

The server calculates compact study summaries rather than sending complete study payloads to every peer. Typical ranking inputs include total answered attempts, best saved correctness, active time, and completed sessions. The exact display can evolve, but the data projection remains minimal.

Rows are scoped to the same academic year. Rank is computed server-side, and the client renders the returned order. Stable tie rules avoid visual reshuffling.

## Cohort comparison

Topic comparisons use exact module, subject, or chapter scopes. Peer accuracy is pooled from same-year students and excludes the requesting student. Best saved outcomes prevent repeated attempts on one question from overwhelming breadth.

When ranking topics with different sample sizes, a Wilson lower bound is used instead of raw percentage alone. A small perfect sample should not automatically outrank a large, reliable sample.

## Caching

Leaderboard data uses a short cache to make repeated navigation instant. Before a fresh ranking request, pending study synchronization is given a bounded chance to finish. A network stall returns a retryable empty state rather than freezing the page indefinitely.

## Who can identify an alias?

Ordinary students cannot map an alias to a login email or real name through the leaderboard. Authorized administrators can resolve an account when necessary for support, safety, or moderation, and those actions are subject to role checks and auditing.
