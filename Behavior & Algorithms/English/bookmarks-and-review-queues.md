# Bookmarks and review queues

## Personal bookmarks

A bookmark is stored as a set of stable question identifiers in the student's study record. Toggling a bookmark updates the card immediately, writes local recovery state, and queues a cloud synchronization. Set semantics prevent duplicate identifiers.

Removing a bookmark is treated as a real state change, not as an append-only event. The synchronization layer records which server version the device last saw so an old device cannot accidentally re-add a bookmark that was deliberately removed elsewhere.

## Review queues

SIRIUS can build queues from:

- bookmarked questions;
- questions whose saved best state is still wrong;
- a selected review result supplied by another feature.

The student can narrow a queue by module. Two behaviors are available:

- **Explore** — read questions and explanations without recording new attempts.
- **Practice** — answer normally and update learning statistics.

Shared stimuli remain grouped and reported questions are deferred as whole blocks.

## Community bookmarks

The community view works from aggregate counts, not from a list of who bookmarked what. Counts are scoped to the student's current year and accessible curriculum. Modules remain discoverable even when their current aggregate is zero; ranked question rows include only items with a positive count.

Rows sort by bookmark count, then by stable question id. The second key prevents equal-count rows from jumping around between renders.

## Performance

Personal bookmarks render from local study state immediately. Community aggregates use a short stale-while-revalidate cache. A bookmark mutation forces a refresh after its own synchronization succeeds, while opening the page repeatedly inside the freshness window causes no unnecessary request or DOM rebuild.

## Privacy

Other students receive aggregate bookmark counts only. They cannot see the identity of the people behind those counts. Administrators may access operational data only through authorized tools and audit controls.
