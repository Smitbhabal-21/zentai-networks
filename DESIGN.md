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
- [Color](https://developer.apple.com/design/human-interface-guidelines/color)

## Application

- Clear hierarchy: large page titles, prominent prices, quiet metadata, readable news headlines, and consistent spacing across every workspace section.
- Material hierarchy: translucent navigation, opaque chart and article surfaces. Blur is restricted to a few functional surfaces; the data remains legible.
- Appearance: semantic light/dark color tokens, increased-contrast variants, system appearance by default, and a persistent manual selector. Charts and tooltips use the same tokens.
- Brand: an original Z mark appears in navigation, the footer, and the browser icon. The current palette pairs clean neutral surfaces and a dark hero with a restrained lime accent. Positive and negative market moves use separate semantic colors.
- Typography: platform font stack, relative font sizes, regular-to-semibold weights, and tabular numbers for financial values. No third-party font request.
- Controls: rounded buttons and segmented controls, explicit selected states, 44px primary touch targets, visible keyboard focus, and a skip link.
- Accessibility: price changes use signs and arrows as well as color; comparative lines use distinct dash patterns; the briefing uses a modal dialog with keyboard cycling and focus restoration; mobile navigation traps focus while open and makes background controls inert.
- Preferences: reduced motion, reduced transparency, and increased contrast have CSS fallbacks. Unsupported preference queries fall back to the default readable appearance.
- Layout: wide desktop grids collapse to a single content column; the data table scrolls within its card on small screens.

Public feed refresh intervals, source timestamps, uncertainty labels, calculations, and API contracts are unchanged by the design work.

## Motion and dashboard references

- [Bento dashboard animation](https://www.instagram.com/reel/Dd7AalkTZPY/) informed the mixed-width market cards, contained result tiles, and short staggered reveals.
- [Cinematic web design reel](https://www.instagram.com/reel/Dd9nhiOyrZU/) informed the ambient glow and sense of depth. Zentai keeps financial text on opaque surfaces.

## Color references

The current color direction takes neutral surfaces and contrast cues from [Apple](https://www.apple.com/) and selective high-energy lime from [Robinhood](https://robinhood.com/us/en/). Zentai retains its own mark and layout. Lime marks actions and selection; market gain and loss colors remain semantically distinct.

Apple's Color guidance also informed a semantic pass: noninteractive market cards use neutral surfaces without status-colored edges or hover motion; gains and losses carry signs and arrows as well as distinct colors; and the custom palette defines stronger variants for increased-contrast light and dark settings.

Motion is decorative and brief. Source timestamps, failure states, and model caveats remain visible. The existing reduced-motion preference disables these animations.

The [logo reveal reference](https://www.instagram.com/reel/DctfWOITj85/) and [animated hero reference](https://www.instagram.com/reel/DeM4Xlhhkgu/) informed a short Z stroke draw, a wordmark entrance, and a quiet orbit inside the dashboard header. The feed indicator pulses only during an actual request; the existing source and timing labels remain the authority for data freshness. Motion stops when the user prefers reduced motion.

## Dashboard makeover

The workspace now uses a deep green navigation rail in both appearances, warmer neutral content surfaces, and a dark featured company chart to make the research area visually distinct. The market summary is a compact four-signal strip with small trend lines calculated from the existing three-month price history. Each card retains its latest observation time, while the strip states when the feed snapshot was fetched. The featured chart adds sourced quote facts beneath the graph. On narrow screens, the cards form two columns so the company chart appears sooner. These visual changes do not alter market calculations or data refresh behavior.
