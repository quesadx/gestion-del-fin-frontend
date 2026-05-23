# ReactBits UI Refactor Prompt

## Context

You are a senior React developer tasked with fully refactoring a frontend UI using components from **ReactBits** (https://reactbits.dev) — an open-source library of animated, interactive, and customizable React components. The goal is to produce a visually stunning, modern interface with a moving animated background, a macOS-style dock for navigation, and smooth reveal animations throughout the app.

All ReactBits components are **copy-paste / CLI installable** — they are not imported from an npm package. Each component is dropped directly into the project's source tree. Use the install commands provided below.

---

## Selected ReactBits Components

### 1. 🌌 Aurora — Animated Background

**What it does:** Renders a smooth, shifting aurora-borealis-style gradient background using WebGL/canvas. It should sit behind all page content as a full-screen layer.

**Install:**
```bash
npx shadcn@latest add @react-bits/Aurora-TS-TW
# or manually: https://reactbits.dev/backgrounds/aurora
```

**Usage pattern:**
```tsx
import Aurora from "@/components/Aurora";

// Wrap the entire app or page root:
<div className="relative min-h-screen">
  <Aurora
    colorStops={["#0a0a0a", "#1a1a2e", "#16213e", "#0f3460"]}
    speed={0.3}
    amplitude={1.2}
  />
  <div className="relative z-10">
    {/* All page content goes here */}
  </div>
</div>
```

**Refactor rules:**
- Remove any existing static background colors from `<body>`, `<main>`, or root layout wrappers.
- The Aurora component must be `position: fixed` or `absolute`, `inset-0`, behind all content (`z-0`). All content must be `z-10` or above.
- Adjust `colorStops` to match the existing app's color palette. If the app is dark-themed, use deep navy/indigo stops. If light, use soft pastels.
- Do not place Aurora inside individual route components — it belongs in the root layout so it persists across navigation.

---

### 2. 🪄 Dock — Navigation Bar

**What it does:** Replaces the existing navbar/sidebar with a macOS-style floating dock that magnifies icons on hover using spring physics.

**Install:**
```bash
npx shadcn@latest add @react-bits/Dock-TS-TW
# or manually: https://reactbits.dev/components/dock
```

**Usage pattern:**
```tsx
import Dock from "@/components/Dock";

const navItems = [
  { icon: <HomeIcon />, label: "Home", onClick: () => navigate("/") },
  { icon: <SearchIcon />, label: "Search", onClick: () => navigate("/search") },
  { icon: <UserIcon />, label: "Profile", onClick: () => navigate("/profile") },
  { icon: <SettingsIcon />, label: "Settings", onClick: () => navigate("/settings") },
];

<Dock
  items={navItems}
  panelHeight={68}
  baseItemSize={50}
  magnification={70}
/>
```

**Refactor rules:**
- Identify every existing navigation element (topbar, sidebar, bottom nav, breadcrumbs for primary routes) and consolidate them into the Dock's `items` array.
- Position the Dock at the **bottom center** of the viewport: `fixed bottom-6 left-1/2 -translate-x-1/2 z-50`.
- Remove the old navigation component entirely from the JSX tree.
- If the existing nav had active-state highlighting, replicate it by checking the current route inside `onClick` or by adding a conditional style to the active item's icon.
- Ensure the Dock does not overlap page content: add `pb-28` (or equivalent bottom padding) to the main content container.

---

### 3. ✨ BlurText — Heading Reveal Animation

**What it does:** Animates text so each word (or character) blurs in from nothing and snaps into focus, one after another. Ideal for hero headings, section titles, and page headers.

**Install:**
```bash
npx shadcn@latest add @react-bits/BlurText-TS-TW
# or manually: https://reactbits.dev/text-animations/blur-text
```

**Usage pattern:**
```tsx
import BlurText from "@/components/BlurText";

<BlurText
  text="Welcome back, Alex"
  delay={80}
  animateBy="words"
  direction="top"
  className="text-4xl font-bold text-white"
/>
```

**Refactor rules:**
- Replace every `<h1>` in the app with `<BlurText>`.
- Replace every `<h2>` that is a **section title** (not an inline label) with `<BlurText animateBy="words" delay={60}>`.
- Leave `<h3>` and below as plain text unless they are prominent hero elements.
- Keep the same `className` that was on the original heading so font size, weight, and color are preserved.
- Do not wrap `<BlurText>` in another animation wrapper — it is self-contained.

---

### 4. 🎞️ AnimatedContent — Enter Animations for Sections

**What it does:** Wraps any block of content and animates it into view when the component mounts or enters the viewport. Supports directional slide (top/bottom/left/right) + fade.

**Install:**
```bash
npx shadcn@latest add @react-bits/AnimatedContent-TS-TW
# or manually: https://reactbits.dev/animations/animated-content
```

**Usage pattern:**
```tsx
import AnimatedContent from "@/components/AnimatedContent";

<AnimatedContent
  distance={40}
  direction="vertical"
  reverse={false}
  duration={0.6}
  ease="power3.out"
  initialOpacity={0}
  animateOpacity
  threshold={0.1}
  delay={0.1}
>
  <YourComponent />
</AnimatedContent>
```

**Refactor rules:**
- Wrap every **page-level section** (`<section>`, major `<div>` blocks, card grids, dashboards panels) in `<AnimatedContent>`.
- Do **not** wrap individual small elements like buttons, badges, or inline text — only containers.
- Stagger sibling sections by incrementing `delay` by `0.15s` per section (0.1, 0.25, 0.4, 0.55…).
- Use `direction="vertical"` (slide from below) as the default. Use `direction="horizontal"` only for sidebars or elements that logically slide in from the side.
- Avoid nesting `<AnimatedContent>` inside another `<AnimatedContent>` — one level deep is enough.

---

### 5. 🫥 FadeContent — Subtle Opacity Reveals

**What it does:** Fades any content from invisible to visible on mount. Simpler than AnimatedContent — no movement, just opacity. Best for images, background panels, and supporting UI elements.

**Install:**
```bash
npx shadcn@latest add @react-bits/FadeContent-TS-TW
# or manually: https://reactbits.dev/animations/fade-content
```

**Usage pattern:**
```tsx
import FadeContent from "@/components/FadeContent";

<FadeContent blur={true} duration={800} delay={200} easing="ease-out" initialOpacity={0}>
  <img src={heroImage} alt="Hero" />
</FadeContent>
```

**Refactor rules:**
- Wrap every hero image, illustration, avatar, or decorative graphic in `<FadeContent blur={true}>`.
- Wrap background overlay panels and modal backdrops in `<FadeContent blur={false}>`.
- Do not use FadeContent on interactive elements like buttons or form fields — it adds visual noise where clarity is needed.
- Use `blur={true}` for anything visually prominent (images, cards), `blur={false}` for structural elements.

---

## Global Refactor Rules

Apply these rules throughout the entire codebase regardless of which specific component is being changed:

1. **Dark theme baseline:** Ensure all text colors, card backgrounds, and container backgrounds use opacity-aware values that look good against the animated Aurora background (semi-transparent cards work best: `bg-white/5`, `bg-black/30`, `backdrop-blur-md`).

2. **Remove conflicting transitions:** Delete any existing CSS `transition`, `animation`, or `@keyframes` that overlap with ReactBits animations on the same elements. Duplicate animation systems cause jank.

3. **Z-index stack (strictly follow this order):**
   - `z-0` → Aurora background
   - `z-10` → Page content, sections, cards
   - `z-40` → Modals, drawers, overlays
   - `z-50` → Dock

4. **Performance:** Add `will-change: transform` to elements wrapped in AnimatedContent or the Dock items. Do not add it globally — only to animated elements.

5. **Accessibility:** All Dock items must have an `aria-label`. All BlurText headings must use the correct semantic tag (pass `as="h1"` or `as="h2"` via props if supported, or wrap in the correct tag).

6. **No layout shift:** AnimatedContent slides elements in using `transform: translateY()`, not by changing `height` or `margin`. Verify no layout shift occurs in the surrounding flow by testing with Chrome DevTools Layout Shift overlay.

---

## Installation Summary

Run these commands from your project root before starting:

```bash
# Aurora background
npx shadcn@latest add @react-bits/Aurora-TS-TW

# Dock navigation
npx shadcn@latest add @react-bits/Dock-TS-TW

# Heading animation
npx shadcn@latest add @react-bits/BlurText-TS-TW

# Section enter animations
npx shadcn@latest add @react-bits/AnimatedContent-TS-TW

# Fade reveals
npx shadcn@latest add @react-bits/FadeContent-TS-TW
```

If your project does not use shadcn, use jsrepo instead:
```bash
npx jsrepo add github/DavidHDev/react-bits/src/content/Backgrounds/Aurora
npx jsrepo add github/DavidHDev/react-bits/src/content/Components/Dock
npx jsrepo add github/DavidHDev/react-bits/src/content/TextAnimations/BlurText
npx jsrepo add github/DavidHDev/react-bits/src/content/Animations/AnimatedContent
npx jsrepo add github/DavidHDev/react-bits/src/content/Animations/FadeContent
```

---

## Deliverable

Return the **fully refactored source files** with:
- All 5 components installed and integrated
- No remnants of the old navigation system
- Every heading using BlurText
- Every major section wrapped in AnimatedContent
- All images and decorative elements wrapped in FadeContent
- Aurora mounted at the root layout level
- Dock replacing the previous navigation, fixed at the bottom

Do not return partial diffs — return complete files ready to drop into the project.