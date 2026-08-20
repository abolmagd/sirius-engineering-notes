# Friends and live challenges

> ملخص عربي: الصداقة علاقة متبادلة على الخادم، والتحدي جلسة لها حالات واضحة وتحقق من المشاركين والأسئلة والنتائج.

## Friend model

Friendship is stored as one normalized pair, independent of who added whom first. Before creating the relationship, the server verifies that the target profile exists and that the user is not trying to add the same account as itself.

The friend list returns a minimal profile projection suitable for the interface: public display information and the state needed to start a challenge. Private login identifiers are not required for ordinary friend display.

## Challenge lifecycle

```text
draft -> pending -> accepted -> active -> completed
                     \-> declined or cancelled
```

The challenger chooses an eligible friend and a question set. The server validates that both participants are allowed, the question identifiers belong to the permitted academic scope, and the requested set is bounded.

Answers are written idempotently per challenge, question, and participant. The server grades against its answer key, updates participant totals inside a transaction, and decides completion only after the required answers exist. This prevents the browser from declaring itself the winner.

## Synchronization

Active challenges use versioned polling and countdown timestamps from shared state. The client preloads the next question assets and aligns transitions to the visible question area. Version gates prevent a late response from an older challenge state from replacing a newer one.

If a participant closes or leaves a challenge, the event is represented explicitly rather than inferred from a missing browser connection. The interface can therefore distinguish cancellation, completion, and temporary offline periods.

## Privacy and abuse resistance

A user can act only on challenges in which they are a participant. Identifiers supplied by the browser are checked again on the server. Challenge views reveal only information needed by the two participants and aggregate result display.

Rate limits, bounded question counts, transactional writes, and audit-friendly state changes reduce spam and inconsistent results. Exact production limits are deliberately not published.
