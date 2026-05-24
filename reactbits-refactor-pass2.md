# ReactBits UI Refactor — Pass 2: Audit & Expansion

> **How to use:** Paste this document into Gemini alongside the **full output code from Pass 1**. Do not attach the original pre-refactor code — only the already-refactored result. This prompt audits what landed, fixes gaps, and layers in 6 new components.

---

## Your Role

You are the same senior React developer who performed the initial ReactBits refactor. You are now doing a **second pass** with two goals:

1. **Audit** — verify that every component from Pass 1 was integrated correctly, identify any missing placements or broken patterns, and fix them in-place.
2. **Expand** — install and integrate 6 new ReactBits components that deepen the animation system without conflicting with what's already there.

Do not re-explain what ReactBits is. Go straight to work.

---

## Part 1 — Audit Checklist

Before touching anything new, scan the entire codebase and verify each item below. For every ❌ you find, fix it immediately before moving to Part 2.

### 1.1 Aurora

- [ ] Aurora is mounted **once and only once** — in the root layout, not inside any route component or page file. If it appears more than once, remove the duplicates.
- [ ] Aurora has `position: fixed` (not `absolute`) so it stays visible during scroll.
- [ ] Aurora's wrapper has no `background-color` or `background` CSS property set on itself or any ancestor element that would paint over it.
- [ ] The `z-index` of Aurora's container is `0` or unset. All page content is at least `z-10`.
- [ ] `colorStops` are actually themed to the app's color palette — not left at a generic default.

**Common failure:** Aurora renders correctly in the root but a page-level component sets `background: white` on `<main>`, making Aurora invisible. Search for any `bg-white`, `bg-gray-*`, or `background:` applied to root-level containers and replace with `bg-transparent` or remove entirely.

---

### 1.2 Dock

- [ ] The old navigation component (navbar, sidebar, bottom nav) is **completely removed** from the JSX and its import statements are deleted.
- [ ] The Dock is positioned with `fixed bottom-6 left-1/2 -translate-x-1/2 z-50` (or equivalent inline styles).
- [ ] Every original navigation route is represented in the Dock's `items` array. Count the routes in the old nav and count the Dock items — they must match.
- [ ] The main content area has `pb-28` (or equivalent ~112px) bottom padding so content is never hidden behind the Dock.
- [ ] Each Dock item has an `aria-label` equal to its label string.
- [ ] Active route highlighting works — the currently active route's icon should appear visually distinct (brighter, scaled, or with an indicator dot).

**Common failure:** The old navbar file still exists and is imported in a layout file even though it's not rendered. Delete the file and the import.

---

### 1.3 BlurText

- [ ] Every `<h1>` in the app uses `<BlurText>`. Do a global search for `<h1` — zero plain `<h1>` tags should remain.
- [ ] Every prominent `<h2>` (section titles, page headers) uses `<BlurText>`. Inline `<h2>` labels inside table rows, form fields, or list items are exempt.
- [ ] The `className` from the original heading is preserved on the `<BlurText>` component so font size and color are unchanged.
- [ ] `animateBy="words"` is used for phrases longer than 2 words. `animateBy="chars"` only for short labels (≤2 words).

**Common failure:** BlurText was applied to `<h2>` tags inside list items or card headers that render dozens of times — this causes performance issues. Move these back to plain `<h2>` and only keep BlurText on unique, page-level headings.

---

### 1.4 AnimatedContent

- [ ] Every top-level page section (`<section>`, major `<div>` blocks, card grids) is wrapped in `<AnimatedContent>`.
- [ ] Sibling `<AnimatedContent>` blocks use staggered `delay` values (0.1, 0.25, 0.4…). Verify no two adjacent sections share the same delay.
- [ ] There is **no nesting** of `<AnimatedContent>` inside another `<AnimatedContent>`.
- [ ] `<AnimatedContent>` is not wrapping elements that are already inside a mapped list (e.g. wrapping every `<li>` in a `map()` call). Only the list container itself should be wrapped.

---

### 1.5 FadeContent

- [ ] Every hero image, avatar, illustration, and decorative graphic is wrapped in `<FadeContent blur={true}>`.
- [ ] `<FadeContent>` is not applied to buttons, inputs, links, or any interactive element.
- [ ] No `<FadeContent>` is nested inside an `<AnimatedContent>` wrapping the same element — pick one or the other per element, not both.

---

### 1.6 Z-Index & Glass Morphism

Verify the full z-index stack is intact and consistent:

| Layer | z-index | Elements |
|---|---|---|
| Background | `z-0` | Aurora |
| Content | `z-10` | Sections, cards, text |
| Overlays | `z-40` | Modals, drawers, toasts |
| Navigation | `z-50` | Dock |

- [ ] Cards use glassmorphism styles against the Aurora: `bg-white/5 backdrop-blur-md border border-white/10` (or dark equivalent). No card should have a solid opaque background.
- [ ] No element has a `z-index` value outside the table above (no random `z-9999` overrides).

---

## Part 2 — New Components

Install and integrate all 6 components below. Each section defines exactly where to place them and how they interact with the Pass 1 components already in the codebase.

---

### 2.1 ✦ SplitText — Character-Level Text Animation

**What it does:** Animates text character by character (or word by word) with a spring-physics stagger. More granular and energetic than BlurText — use it where you want a "typewriter with personality" feel.

**Install:**
```bash
npx shadcn@latest add @react-bits/SplitText-TS-TW
# jsrepo fallback:
npx jsrepo add https://reactbits.dev/tailwind/TailwindTextAnimations/SplitText
```

**Usage pattern:**
```tsx
import SplitText from "@/components/SplitText";

<SplitText
  text="Dashboard"
  className="text-2xl font-semibold text-white"
  delay={40}
  animationFrom={{ opacity: 0, transform: "translate3d(0,20px,0)" }}
  animationTo={{ opacity: 1, transform: "translate3d(0,0,0)" }}
  easing="easeOutCubic"
  threshold={0.2}
  rootMargin="-20px"
/>
```

**Placement rules:**
- Use `<SplitText>` for **subheadings and card titles** — any text that is `<h3>` level or smaller but is still a prominent label.
- `<h1>` and `<h2>` stay as `<BlurText>`. Do not replace them. SplitText goes below that level.
- Do **not** use SplitText on body text, paragraphs, captions, or timestamps.
- If the same text string is rendered inside a `map()` loop (e.g. card titles in a grid), use SplitText only if the list has **5 or fewer items**. More than that, use plain text to avoid animation overload.
- Wrap each `<SplitText>` in the correct semantic tag:
```tsx
<h3><SplitText text="Card Title" className="..." delay={30} /></h3>
```

---

### 2.2 ⚡ ClickSpark — Button Interaction Effect

**What it does:** Emits a burst of spark particles from the click point whenever the user clicks inside the wrapped element. Adds tactile feedback to primary actions.

**Install:**
```bash
npx shadcn@latest add @react-bits/ClickSpark-TS-TW
# jsrepo fallback:
npx jsrepo add https://reactbits.dev/tailwind/TailwindAnimations/ClickSpark
```

**Usage pattern:**
```tsx
import ClickSpark from "@/components/ClickSpark";

<ClickSpark
  sparkColor="#ffffff"
  sparkSize={10}
  sparkRadius={15}
  sparkCount={8}
  duration={400}
>
  <button className="px-6 py-3 rounded-xl bg-white/10 text-white">
    Submit
  </button>
</ClickSpark>
```

**Placement rules:**
- Wrap **every primary CTA button** in the app with `<ClickSpark>`. A primary button is any button that submits a form, triggers a main action, or is styled as the most prominent option on a screen.
- Do **not** wrap secondary buttons, ghost buttons, icon-only buttons, or navigation links.
- Do **not** wrap the Dock items — they already have their own spring animation.
- Set `sparkColor` to the app's primary accent color (not white) if the button sits on a light background.
- `<ClickSpark>` wraps the button element, not a `<div>` around the button — keep the DOM as flat as possible.

---

### 2.3 🔢 CountUp — Animated Number Reveals

**What it does:** Counts a number from 0 (or a starting value) to its target when the element enters the viewport. Essential for stats, metrics, and KPI displays.

**Install:**
```bash
npx shadcn@latest add @react-bits/CountUp-TS-TW
# jsrepo fallback:
npx jsrepo add https://reactbits.dev/tailwind/TailwindTextAnimations/CountUp
```

**Usage pattern:**
```tsx
import CountUp from "@/components/CountUp";

<CountUp
  from={0}
  to={1284}
  separator=","
  direction="up"
  duration={1.2}
  className="text-4xl font-bold text-white"
  onStart={() => {}}
  onEnd={() => {}}
/>
```

**Placement rules:**
- Scan the entire codebase for any static number that represents a **quantity, metric, stat, or KPI** — things like user counts, revenue figures, percentage values, item counts in a dashboard header, or progress indicators.
- Replace every such static number with `<CountUp to={value}>`. Keep the surrounding label text as-is.
- For percentages, set `suffix="%"` instead of including it in the number string.
- For currency, set `prefix="$"` (or appropriate currency symbol) and `separator=","`.
- For decimal values, add `decimals={2}`.
- If no stats, metrics, or number displays exist in the current UI, skip this component and note that in your output.

---

### 2.4 🃏 TiltedCard — 3D Perspective Card

**What it does:** Wraps any card content and applies a smooth 3D tilt effect driven by mouse position. The card rotates on X and Y axes as the cursor moves over it, creating depth and interactivity.

**Install:**
```bash
npx shadcn@latest add @react-bits/TiltedCard-TS-TW
# jsrepo fallback:
npx jsrepo add https://reactbits.dev/tailwind/TailwindComponents/TiltedCard
```

**Usage pattern:**
```tsx
import TiltedCard from "@/components/TiltedCard";

<TiltedCard
  imageSrc="/card-image.png"
  altText="Feature preview"
  captionText="Explore the feature"
  containerHeight="300px"
  containerWidth="220px"
  imageHeight="300px"
  imageWidth="220px"
  rotateAmplitude={12}
  scaleOnHover={1.04}
  showMobileWarning={false}
  showTooltip={true}
  displayOverlayContent={true}
  overlayContent={
    <div className="p-4 text-white">
      <h3 className="font-bold">Feature Title</h3>
      <p className="text-sm opacity-80">Short description here.</p>
    </div>
  }
/>
```

**Placement rules:**
- Identify the **most visually prominent card grid** in the app (a feature showcase, a product listing, a dashboard widget grid, a team member grid, etc.). Apply `<TiltedCard>` to those cards only.
- Do **not** apply TiltedCard to every card in the app — only hero/featured cards. A good heuristic: cards that are 200px or wider and are presented in a grid of ≤6 items.
- Remove any existing `hover:scale-*` or `hover:shadow-*` Tailwind utilities from cards that receive `<TiltedCard>` — they will conflict with the tilt's own scale and shadow system.
- On mobile, the tilt effect triggers on touch, which can interfere with scrolling. Set `showMobileWarning={false}` and verify the card still looks correct without tilt on small screens (it falls back gracefully).

---

### 2.5 🌊 ScrollReveal — Scroll-Triggered Text Reveal

**What it does:** Progressively reveals text as the user scrolls, with each word or line "unmasking" in sequence. Best for long-form content, landing page copy, and manifesto-style sections.

**Install:**
```bash
npx shadcn@latest add @react-bits/ScrollReveal-TS-TW
# jsrepo fallback:
npx jsrepo add https://reactbits.dev/tailwind/TailwindTextAnimations/ScrollReveal
```

**Usage pattern:**
```tsx
import ScrollReveal from "@/components/ScrollReveal";

<ScrollReveal
  baseOpacity={0.15}
  enableBlur={true}
  baseBlur={4}
  containerClassName="max-w-2xl mx-auto"
  textClassName="text-xl text-white/90 leading-relaxed"
>
  Your long-form paragraph or section description text goes here.
  It can be multiple sentences and will reveal word by word as
  the user scrolls through the section.
</ScrollReveal>
```

**Placement rules:**
- Apply `<ScrollReveal>` to **body paragraphs in hero sections and feature description sections** — the supporting copy under a main heading, not the heading itself.
- Do not use it on short strings (under 10 words) — for those, `<BlurText>` or `<SplitText>` are better choices.
- Do not use it on UI copy like button labels, tooltips, form labels, or error messages.
- `<ScrollReveal>` and `<AnimatedContent>` must not wrap the same element. If a section paragraph is already inside an `<AnimatedContent>` block, remove the `<AnimatedContent>` from around just that paragraph and use `<ScrollReveal>` instead. The surrounding section container can keep its `<AnimatedContent>`.
- Only one `<ScrollReveal>` per visible screen area — do not stack multiple back-to-back without a gap between them.

---

### 2.6 💡 DecryptedText — Character Scramble Reveal

**What it does:** Animates text by scrambling characters randomly, then progressively "decrypting" them to the real value — a hacker/terminal aesthetic for labels, tags, status indicators, and short UI strings.

**Install:**
```bash
npx shadcn@latest add @react-bits/DecryptedText-TS-TW
# jsrepo fallback:
npx jsrepo add https://reactbits.dev/tailwind/TailwindTextAnimations/DecryptedText
```

**Usage pattern:**
```tsx
import DecryptedText from "@/components/DecryptedText";

<DecryptedText
  text="ONLINE"
  speed={80}
  maxIterations={12}
  characters="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  className="text-green-400 font-mono text-sm font-semibold"
  parentClassName="inline-flex"
  encryptedClassName="text-green-200/50"
  animateOn="view"
/>
```

**Placement rules:**
- Apply `<DecryptedText>` to **status badges, environment labels, version strings, and short identifiers** — anything that is a tag, a badge, a chip, or a label that conveys a state or category (e.g. "ACTIVE", "v2.1.0", "PRO", "LIVE", "BETA").
- Use it on strings of **1 to 4 words maximum**. Longer text looks chaotic while scrambling.
- Set `animateOn="hover"` for status badges that sit statically in the UI. Set `animateOn="view"` for badges that appear as part of a page load or route transition.
- Use `font-mono` in the className — the scramble effect looks intentional with monospace, random without it.
- Do **not** apply to body text, headings (those use BlurText/SplitText), or any text that must be readable at all times (error messages, form validation, accessibility labels).

---

## Part 3 — Conflict & Compatibility Matrix

Use this table to resolve any conflicts between Pass 1 and Pass 2 components on the same element:

| Element type | Correct component | Do NOT also use |
|---|---|---|
| `<h1>` | BlurText | SplitText, ScrollReveal, DecryptedText |
| `<h2>` section title | BlurText | SplitText, ScrollReveal |
| `<h3>` card/widget title | SplitText | BlurText, ScrollReveal |
| Body paragraph (hero) | ScrollReveal | AnimatedContent (on same element) |
| Body paragraph (card) | Plain text | Any animation — cards already tilt |
| Short label / badge | DecryptedText | BlurText, SplitText |
| Stat / metric number | CountUp | BlurText, SplitText |
| Image / illustration | FadeContent | AnimatedContent (on same element) |
| Page section container | AnimatedContent | FadeContent, ScrollReveal (on container) |
| Primary button | ClickSpark | AnimatedContent |
| Featured card | TiltedCard | AnimatedContent (remove if already on card) |

**Rule of thumb:** One animation per element. If two animation components want to own the same DOM node, the more specific one wins (TiltedCard > AnimatedContent, ScrollReveal > AnimatedContent on paragraphs, ClickSpark > AnimatedContent on buttons).

---

## Part 4 — Final QA Checklist

Run through every item before returning the code.

### Performance
- [ ] Open the browser's Performance tab and record a page load. Total animation-related JS work should be under 50ms on the main thread. If it exceeds this, check for animation components applied inside large `map()` calls.
- [ ] `will-change: transform` is present on TiltedCard containers and AnimatedContent wrappers. It is not applied globally.
- [ ] The Aurora canvas element has no siblings with `pointer-events: auto` that would block interactions.
- [ ] No component is using `useLayoutEffect` in a way that causes a flash before animation plays (symptom: content briefly visible at 100% opacity before animating in). If this happens, set `initialOpacity={0}` on the relevant AnimatedContent.

### Accessibility
- [ ] Every `<ClickSpark>` wrapped button has its own accessible label (either visible text or `aria-label`).
- [ ] Every `<SplitText>` element is inside a semantic heading tag (`<h3>`, `<h4>`).
- [ ] `<CountUp>` numbers have `aria-label` on their container with the final static value, so screen readers announce it immediately rather than waiting for the animation: `<span aria-label="1,284 users">`.
- [ ] `<DecryptedText>` has `aria-label` on its container with the final real text so screen readers do not read out the scrambled characters.
- [ ] `prefers-reduced-motion` is respected — verify that all ReactBits components (especially SplitText, BlurText, AnimatedContent) expose a way to disable animation, and confirm that each component's source file checks `window.matchMedia('(prefers-reduced-motion: reduce)')`. If any do not, add the check manually inside the component file.

### Visual
- [ ] On mobile (375px viewport), the Dock does not overflow horizontally. If it does, reduce `baseItemSize` to 42 and `magnification` to 56.
- [ ] TiltedCard tilt does not cause horizontal scroll on mobile. Verify with `overflow-x: hidden` on the card's section container.
- [ ] DecryptedText badges are readable mid-scramble — the `encryptedClassName` color should be at least 30% opacity of the final color, not invisible.
- [ ] CountUp numbers do not cause layout shift as they grow in digit count (e.g. going from "9" to "10" changes width). Wrap each `<CountUp>` in a container with `min-width` matching the final value's width, or use `tabular-nums` on the className.
- [ ] All glassmorphism cards (`bg-white/5 backdrop-blur-md`) are visible against both the Aurora background and any fallback solid color background (for browsers where backdrop-filter is unsupported).

---

## Deliverable

Return **complete, updated source files** — not diffs, not partial excerpts. Every file that was touched must be returned in full. Files that were not changed do not need to be returned.

The final codebase must:
- Pass every audit item in Part 1 with no ❌ remaining
- Include all 6 new components installed and integrated per Part 2 rules
- Have no animation conflicts as defined by the matrix in Part 3
- Pass every QA item in Part 4
