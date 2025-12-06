# MedReport Insurance Advisor - Design Guidelines

## Design Approach

**System Foundation**: Material Design 3 principles with healthcare fintech adaptations - prioritizing clarity, trust, and data comprehension. Drawing from Stripe's restraint, Notion's information hierarchy, and healthcare dashboards' precision.

**Core Principle**: Transform complex medical and financial data into scannable, actionable insights while maintaining professional credibility.

---

## Typography System

**Font Family**: Inter (primary) via Google Fonts CDN, SF Mono (code/data values)

**Hierarchy**:
- Hero Headline: text-5xl md:text-6xl, font-bold, tracking-tight
- Section Headers: text-3xl md:text-4xl, font-semibold
- Subsection Titles: text-xl md:text-2xl, font-semibold
- Card Titles: text-lg font-semibold
- Body Text: text-base leading-relaxed
- Supporting Text: text-sm
- Medical Values/Data: text-base font-mono font-medium
- Captions/Disclaimers: text-xs leading-relaxed

---

## Layout & Spacing System

**Spacing Primitives**: Tailwind units of 2, 4, 6, 8, 12, 16, 24

**Container Strategy**:
- Landing page sections: max-w-7xl mx-auto px-6 md:px-8
- Application content: max-w-6xl mx-auto px-4 md:px-6
- Form containers: max-w-2xl
- Data tables: Full width within max-w-6xl parent

**Section Padding**: py-16 md:py-24 for landing, py-8 md:py-12 for application

---

## Landing Page Structure

**Hero Section** (h-[85vh] min-h-[600px]):
- Split layout: 50% content (left) / 50% visual demonstration (right) on desktop
- Left: Headline, subhead, dual CTAs (primary: "Upload Report", secondary: "Compare Policy"), trust indicators below
- Right: Mockup image of the one-page report or dashboard preview
- Background: Subtle gradient with medical-tech aesthetic
- Trust line positioned at bottom: privacy badge + "Demo uses synthetic data"

**Three-Tile Feature Section**:
- grid-cols-1 md:grid-cols-3 gap-8
- Each tile: Icon (top), title, 2-3 line description, minimal hover lift effect
- Icons from Heroicons CDN (document-text, scale, chart-bar)

**Process Flow Visualization**:
- Horizontal timeline on desktop (5 steps: Upload → Extract → Review → Recommendations → Download)
- Vertical on mobile
- Connected with dotted lines, numbered circles for each step

**FAQ Section**:
- Two-column layout (md:grid-cols-2)
- Accordion-style questions with expandable answers
- Privacy & security question featured prominently

**Footer**:
- Three-column grid: Quick links | Contact & support | Privacy policy + disclaimer
- Newsletter signup removed (not relevant for healthcare compliance)

---

## Application Interface Components

### Progress Stepper
- Horizontal bar at top of application area
- 5 steps with checkmark icons for completed, current step highlighted
- Mobile: Compressed to current step + progress percentage

### Upload Area
- Large dropzone: border-2 border-dashed, min-h-64
- Centered icon (cloud-upload), primary text "Drop medical report here", secondary text "PDF or image up to 10MB"
- File type badges below (PDF, JPG, PNG accepted)

### Extraction/Review Interface
- Split panel layout: Original document preview (left 40%) | Extracted fields (right 60%)
- Editable field cards: Label + value + edit icon, arranged in logical groups
- Color-coded indicators next to test values: border-l-4 with status indicator
- Normal ranges shown as text-sm below each medical value

### Health Summary Card
- Full-width card at top of review/recommendations
- Plain-language paragraph (text-lg) with key terms bolded
- Risk score badges: Inline pills showing "Short-term: High" "Long-term: Moderate"
- Contributing factors list below with mini explanations

### Policy Input Section
- Toggle: "I have existing policy" (default off)
- When enabled: Upload area OR manual entry form (tabbed interface)
- Parsed fields displayed in editable grid (2 columns on desktop)

### Plan Recommendation Cards
- Stacked vertically for top 3 plans
- Each card: Provider logo area | Plan name (text-2xl) | Match score (circular progress) | Key stats row | Savings badge (if positive) | Expand button
- Expanded state: Additional details table, coverage checklist, "Why recommended" explanation, CTA buttons
- Stats row uses icon + value pairs (gap-4)

### Comparison Table
- Sticky header row
- First column: Feature names (Premium, Sum Insured, Co-pay, Waiting Period, Annual Cost, Savings)
- Subsequent columns: Current policy + Top 3 plans
- Visual emphasis on savings row (slightly larger text, subtle background)
- Bar chart visualization above table showing Annual Cost comparison

### Budget & Priority Controls
- Slider component for budget (with input field for exact entry)
- Three toggle buttons for priorities: "Low Premium" | "High Coverage" | "Minimal Wait"
- Multiple selections allowed, arranged horizontally on desktop

### One-Page Report Layout (for PDF)
- Letter-size optimized (max-w-[8.5in])
- Header: Logo + report title + generated date
- Section 1 (¼ page): Health Summary box with risk labels
- Section 2 (¼ page): Key Medical Values table (3 columns: Test | Value | Reference)
- Section 3 (⅓ page): Top 3 Recommendations grid with savings
- Section 4: Cost comparison mini-chart
- Footer: Disclaimer + privacy statement

### Interactive Elements
- Primary button: px-8 py-4, text-base, rounded-lg, font-semibold
- Secondary button: Same sizing, outlined variant
- Buttons on images: backdrop-blur-md with semi-transparent background
- Input fields: px-4 py-3, text-base, rounded-md, border focus ring
- Tooltips: Appear on hover for medical terms, max-w-xs

### Trust & Privacy Indicators
- Privacy badge (shield icon + "Privacy-first"): Appears in header, hero, before upload
- Disclaimer cards: border-l-4 with info icon, text-sm, rounded-r-md
- Consent checkbox before processing: Larger text, clear terms link
- Auto-delete timer shown: "Report auto-deletes in 24 hours"

---

## Component Library

**Navigation**: Sticky header, max-h-16, logo left, minimal nav items (How it Works, Privacy, Contact), CTA button right

**Cards**: rounded-xl, p-6, shadow-sm, hover:shadow-md transition

**Badges**: rounded-full px-3 py-1, text-xs font-medium

**Icons**: Heroicons via CDN, consistent 24px size (w-6 h-6) unless specified

**Tables**: Bordered cells, alternating row backgrounds for readability, sticky headers for long tables

**Form Groups**: space-y-6 for vertical rhythm

**Modal Overlays**: For expanded plan details, max-w-3xl, centered, backdrop blur

---

## Responsive Behavior

- Landing hero: Stacked on mobile (image below text)
- Three-tile features: Single column mobile → 3 columns desktop
- Comparison table: Horizontal scroll on mobile with sticky first column
- Plan cards: Full width mobile, consistent across viewports
- Stepper: Compressed mobile view
- Forms: Single column mobile, 2-column on md+ where logical

---

## Images

**Hero Image**: Mockup of the one-page report showing health summary section and recommendation cards - professionally designed report preview with legible but anonymized data, placed on right 50% of hero on desktop, full-width below text on mobile

**Feature Icons**: Use Heroicons (document-text, adjustments-horizontal, currency-dollar) - not actual images

**Plan Provider Logos**: Placeholder areas in recommendation cards (80×40px), centered with object-fit contain

No decorative imagery - focus on functional UI clarity and data visualization.