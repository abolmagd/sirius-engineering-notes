# Personalization and accessibility

> ملخص عربي: الثيمات والأفاتار وحجم الخط والسطوع تفضيلات مرتبطة بالحساب، مع دعم الكيبورد وتقليل الحركة واحترام أحجام الشاشات المختلفة.

## Appearance preferences

SIRIUS supports light, AMOLED, and ink-sky themes. Theme tokens control surfaces, text, borders, accent colors, and ambient effects as one system rather than applying isolated color overrides.

Students can adjust font scale and brightness-related presentation. Controls expose their current value, work with keyboard input, and include a reset path. Preferences are cached locally for immediate first paint and synchronized to the account for other devices.

## Avatars

The avatar catalogue uses local optimized assets with attribution. A selected avatar is stored by stable catalogue id, not by arbitrary uploaded markup. Restricted promotional avatars are enforced on the server through a private allowlist; the client merely displays the returned eligibility state.

## Motion

Animation is used for orientation and feedback, not as a requirement for understanding. Scroll reveals and page transitions rely on transform and opacity. `prefers-reduced-motion` removes nonessential motion and keeps content visible.

## Keyboard and assistive technology

Interactive controls use native buttons, links, inputs, dialogs, and details elements where possible. Visible focus styles, labels, live regions for status, and predictable heading order support keyboard and screen-reader navigation.

Question navigation communicates selected, answered, correct, wrong, and bookmarked states without relying on color alone. Timed exams keep the clock available without covering question content.

## Responsive behavior

Layouts are tested at phone, tablet, and laptop widths. Touch targets remain usable, long pages use progressive rendering, and the question navigator has its own bounded scrolling region. Sticky navigation metrics are measured once and updated on resize rather than recalculated on every scroll event.

## Performance constraints

Mobile backdrops use bounded resolution and frame rate. Offscreen question cards avoid unnecessary paint work, images reserve stable space, and long sessions render in batches. Accessibility preferences take priority over decorative effects.
