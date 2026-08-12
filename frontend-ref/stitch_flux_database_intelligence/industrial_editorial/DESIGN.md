---
name: Industrial Editorial
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#444748'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f1f1f1'
  outline: '#747878'
  outline-variant: '#c4c7c7'
  surface-tint: '#5f5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1c1b1b'
  on-primary-container: '#858383'
  inverse-primary: '#c8c6c5'
  secondary: '#735c00'
  on-secondary: '#ffffff'
  secondary-container: '#fed65b'
  on-secondary-container: '#745c00'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1b1c1c'
  on-tertiary-container: '#848484'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c8c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474746'
  secondary-fixed: '#ffe088'
  secondary-fixed-dim: '#e9c349'
  on-secondary-fixed: '#241a00'
  on-secondary-fixed-variant: '#574500'
  tertiary-fixed: '#e3e2e2'
  tertiary-fixed-dim: '#c7c6c6'
  on-tertiary-fixed: '#1b1c1c'
  on-tertiary-fixed-variant: '#464747'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 42px
    letterSpacing: -0.02em
  headline-xl:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 30px
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  code-md:
    fontFamily: jetbrainsMono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 24px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  xxl: 64px
  container-max: 1200px
  gutter: 24px
---

## Brand & Style

The design system embodies a fusion of **Industrial Precision** and **Editorial Sophistication**. It is designed for high-density technical information presented with the clarity and grace of a premium publication. The brand personality is authoritative, meticulous, and calm.

The visual style leans heavily into **Minimalism** with a focus on structural integrity. It utilizes sharp grid alignment, ample whitespace to reduce cognitive load, and high-quality typography as the primary decorative element. The interface should feel like a well-engineered tool that respects the user's focus, avoiding unnecessary ornamentation in favor of functional elegance and clear information hierarchy.

## Colors

The palette follows a **Carbon & Gold** theme, emphasizing contrast and prestige.

- **Primary (Carbon):** `#1A1A1A`. Used for primary text, iconography, and structural borders. It provides a grounded, industrial foundation.
- **Secondary (Gold):** `#D4AF37`. Used sparingly for high-value call-to-actions, active states, or highlighting critical insights. It adds a premium editorial layer.
- **Neutral:** A range of greys from `#F9F9F9` (Surface) to `#717171` (Secondary Text). 
- **Accent/Success:** Use a muted forest green for positive states, maintaining the organic yet professional feel.

The default mode is `light`, utilizing a clean white or slightly off-white (`#FDFDFD`) background to ensure maximum readability for long-form content.

## Typography

The typography system is built on **Inter**, chosen for its exceptional legibility and neutral, modern tone. To achieve the editorial rhythm:

1.  **Scale:** Headlines use a tight, aggressive scale to create clear entry points into content.
2.  **Tracking:** Large displays use negative tracking (`-0.02em`) to feel cohesive. Labels and small body text use slight positive tracking to improve character recognition.
3.  **Line Height:** Body text utilizes a generous line height (1.6x - 1.65x) to facilitate comfortable long-form reading, especially for technical documentation and chat transcripts.
4.  **Weights:** Use `SemiBold` (600) for headlines to provide "ink-heavy" emphasis against the Carbon primary color.

## Layout & Spacing

The design system employs a **Fixed Grid** philosophy for desktop to maintain editorial control over line lengths, while transitioning to a **Fluid Grid** for mobile devices.

- **Grid:** A 12-column grid with a 24px gutter. On desktop, the main content area is capped at `1200px` to prevent line lengths from becoming unreadable.
- **Rhythm:** All spacing is derived from a 4px baseline. Use `xl` (40px) and `xxl` (64px) for vertical section margins to reinforce the "Editorial" feel.
- **Chat Layout:** In chat interfaces, use asymmetrical margins (wider on the trailing side) to create a clear visual distinction between user and system responses while maintaining a vertical "spine" of alignment.

## Elevation & Depth

This design system avoids heavy shadows, opting instead for **Low-contrast Outlines** and **Tonal Layers** to denote hierarchy. This maintains the "industrial" flat-sheet aesthetic.

- **Level 0 (Base):** `#F9F9F9` background.
- **Level 1 (Cards/Containers):** White (`#FFFFFF`) background with a 1px solid border in `#E5E5E5`.
- **Level 2 (Popovers/Modals):** White background with a very soft, highly diffused ambient shadow (`0px 8px 24px rgba(0,0,0,0.04)`) and a 1px border.
- **Interaction:** On hover, interactive elements should not "lift" with shadows but rather shift in background tone or border color (e.g., border changing to Carbon or Gold).

## Shapes

The shape language is **Soft** but disciplined. 

- **Components:** Standard buttons and input fields use a `0.25rem` (4px) radius. This provides a hint of approachability without losing the industrial, "machined" feel.
- **Containers:** Larger containers like cards or code blocks use `0.5rem` (8px). 
- **Contextual:** Interactive chips or tags can utilize a `pill` shape to differentiate them from functional inputs, but primary actions should remain rectangular with soft corners.

## Components

- **Buttons:** Primary buttons use the Carbon (`#1A1A1A`) background with white text. Secondary buttons use a 1px Carbon border. The Gold color is reserved for "Star" or "Premium" actions only.
- **Input Fields:** Use a 1px neutral border. Upon focus, the border transitions to Carbon. No glow effects; use a sharp, 1px inset focus ring if necessary for accessibility.
- **Cards:** Clean, white surfaces with a 1px `#E5E5E5` border. No shadows. Use `headline-lg` for card titles.
- **Chat Bubbles:** In place of traditional bubbles, use "Content Blocks" separated by subtle horizontal dividers or slight tonal shifts in background. This mimics a manuscript or technical paper.
- **Code Blocks:** Use a slightly darker neutral background (`#111111` for dark code blocks) with `jetbrainsMono`. Ensure high contrast for syntax highlighting.
- **Chips:** Small, uppercase labels (`label-md`) with a subtle grey background. These act as "metadata tags" for technical categorization.