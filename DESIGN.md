# Zentai interface design

The dashboard adapts Apple's design guidance to a web-based market research workspace. This is a web interpretation, not an implementation of Apple's native Liquid Glass renderer. Zentai keeps its own identity and uses the installed system font and Lucide icons; no Apple artwork or downloadable SF assets are bundled.

## Reference review

Reviewed the Design overview, linked introductions and WWDC design system material, and the relevant HIG foundations. The Apple design library also covers many native-platform features outside this project's scope; this review does not claim to cover every page on Apple Developer.

- [Design overview](https://developer.apple.com/design/)
- [Design pathway](https://developer.apple.com/design/get-started/)
- [What's new](https://developer.apple.com/design/whats-new/)
- [Meet Liquid Glass](https://developer.apple.com/videos/play/wwdc2025/219/)
- [Get to know the new design system](https://developer.apple.com/videos/play/wwdc2025/356/)
- [Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
- [Typography](https://developer.apple.com/design/human-interface-guidelines/typography)
- [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)

## Application

- Clear hierarchy: large page titles, prominent prices, quiet metadata, readable news headlines, and consistent spacing across every workspace section.
- Material hierarchy: translucent navigation, opaque chart and article surfaces. Blur is restricted to a few functional surfaces; the data remains legible.
- Appearance: semantic light/dark color tokens, system appearance by default, and a persistent manual selector. Charts and tooltips use the same tokens.
- Brand: an original warm terracotta Z mark appears in navigation, the footer, and the browser icon. Cream and copper tones replace the initial blue palette; green and red remain reserved for market direction.
- Typography: platform font stack, relative font sizes, regular-to-semibold weights, and tabular numbers for financial values. No third-party font request.
- Controls: rounded buttons and segmented controls, explicit selected states, 44px primary touch targets, visible keyboard focus, and a skip link.
- Accessibility: price changes use signs and arrows as well as color; comparative lines use distinct dash patterns; the briefing uses a modal dialog with keyboard cycling and focus restoration; mobile navigation traps focus while open and makes background controls inert.
- Preferences: reduced motion, reduced transparency, and increased contrast have CSS fallbacks. Unsupported preference queries fall back to the default readable appearance.
- Layout: wide desktop grids collapse to a single content column; the data table scrolls within its card on small screens.

Public feed refresh intervals, source timestamps, uncertainty labels, calculations, and API contracts are unchanged by the design work.

## Motion and dashboard references

- [Bento dashboard animation](https://www.instagram.com/reel/Dd7AalkTZPY/) informed the mixed-width market cards, contained result tiles, and short staggered reveals.
- [Cinematic web design reel](https://www.instagram.com/reel/Dd9nhiOyrZU/) informed the ambient glow and sense of depth. Zentai uses warm copper light instead of the reel's neon palette, and keeps financial text on opaque surfaces.

Motion is decorative and brief. Source timestamps, failure states, and model caveats remain visible. The existing reduced-motion preference disables these animations.
