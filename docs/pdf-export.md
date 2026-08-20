# PDF study-sheet export

> ملخص عربي: تصدير الـPDF يبني ورقة مذاكرة من الفلاتر الحالية، يحافظ على ترتيب الحالات والصور، ويضع الإجابات في مفتاح منفصل مناسب للطباعة.

## Goal

The export feature turns the current dashboard selection into a printable study sheet. It is intentionally derived from the same filter state used to start a session, so the on-screen match count and exported scope agree.

## Preparation pipeline

1. Read the current module, subject, chapter, source, and duplicate settings.
2. Build the filtered question list in deterministic curriculum order.
3. Resolve stimulus relationships and keep grouped cases together.
4. Load only the images required by the exported questions.
5. Ensure the answer key is available before rendering.
6. Build a print-only document with fixed paper pages.
7. Wait for fonts and image layout, then open the browser print dialog.

The export fails closed when an answer key or required image cannot be prepared. It does not silently create an incomplete answer sheet.

## Layout model

The printable document contains:

- a cover and scope summary;
- a compact contents section;
- numbered question blocks;
- one shared stimulus image or caption before its related questions;
- a visible marker only for questions the student bookmarked;
- page numbers and print-safe margins;
- a compact, multi-column answer key placed after the questions.

Answers are not printed directly below each question. Separating the key keeps the document useful for self-testing.

## Image handling

Stimulus images are rendered once per group rather than once per child question. The browser prepares image sources before measuring pages because late image dimensions can move content across page boundaries. Temporary object URLs are released after printing to avoid retaining memory.

## Determinism and privacy

Chapter ordering and tie-breaks are stable, making repeated exports from the same filters predictable. The export is generated in the student's browser; it does not upload a new PDF file or expose the student's email. Bookmark state is represented as a simple local annotation.

Regression tests verify filter parity, answer-key separation, grouped stimulus images, page numbering, scale adjustment, contents generation, bookmark labels, and cleanup after success or failure.
