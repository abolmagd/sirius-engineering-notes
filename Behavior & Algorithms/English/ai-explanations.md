# Source-grounded AI explanations

## Purpose

AI explanations are an optional support layer for understanding a question. They do not replace the stored answer key, determine grades, or change a student's saved correctness.

## Source grounding

Authorized administrators upload or register approved educational source material. The system extracts searchable sections and builds a private index. When an explanation is requested, retrieval selects relevant passages and supplies them with the question context to the generation model.

```text
question context
  -> retrieve relevant approved passages
  -> build a bounded prompt without user identity
  -> generate explanation
  -> validate and store the result with source metadata
  -> return a safe display projection
```

The generation request is not intended to include the student's name or email. It focuses on the question, answer choices, expected answer, and relevant source text.

## Safety and cost controls

Generation has per-user and site-wide ceilings, timeouts, model-status checks, and usage telemetry. Exact limits remain private. The browser displays a retryable state when generation is unavailable and continues to show the editorial explanation when one exists.

Source files and indexes are admin-only. Public clients cannot browse the private source library or choose arbitrary server paths.

## Review and correction

Generated text can be reported or proposed for editing. Scientific editors can review explanation changes without receiving access to user administration. Approved content is versioned so a later correction does not silently alter the original question identity.

## Privacy boundary

The AI provider receives only the content necessary for generation. Authentication secrets, password hashes, private messages, and account contact fields are excluded. The privacy policy identifies the provider category and the purpose of this processing.

Tests cover authorization, source indexing, bounded requests, status handling, directionality for mixed Arabic/English content, cache behavior, and editor-only review paths.
