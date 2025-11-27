# Orca Brand Guide

> **Version**: 1.0  
> **Last Updated**: 2025-11-26  
> **Project**: Orca Orthodontic Practice Management System

---

## 🎯 Brand Identity

**Orca** represents intelligence, precision, and trust in orthodontic practice management. The brand identity draws inspiration from the orca whale—known for its intelligence, coordination, and effectiveness—combined with modern medical software aesthetics.

### Brand Attributes

- **Professional**: Medical-grade reliability and trust
- **Intelligent**: Smart, AI-powered features
- **Modern**: Contemporary design and technology
- **Precise**: Attention to detail in orthodontic care
- **Calm**: Ocean-inspired, stress-reducing interface

---

## 🎨 Color System

### Primary Palette

```css
/* Primary Colors */
--color-primary: #0a4b78; /* Deep Ocean Blue */
--color-primary-dark: #062a40; /* Dark Navy */
--color-accent: #00a8b5; /* Teal */
--color-accent-light: #e8f4f8; /* Light Blue */
```

| Color Name          | Hex       | RGB                | Usage                                          |
| ------------------- | --------- | ------------------ | ---------------------------------------------- |
| **Deep Ocean Blue** | `#0A4B78` | rgb(10, 75, 120)   | Primary brand color, headers, buttons, main UI |
| **Dark Navy**       | `#062A40` | rgb(6, 42, 64)     | Text, dark mode, emphasis                      |
| **Teal**            | `#00A8B5` | rgb(0, 168, 181)   | Accent color, links, interactive elements      |
| **Light Blue**      | `#E8F4F8` | rgb(232, 244, 248) | Backgrounds, hover states, subtle highlights   |

### Semantic Colors

```css
/* Semantic Colors */
--color-success: #10b981; /* Green */
--color-warning: #f59e0b; /* Orange */
--color-error: #ef4444; /* Red */
--color-info: #3b82f6; /* Blue */
```

| Color Name         | Hex       | Usage                                             |
| ------------------ | --------- | ------------------------------------------------- |
| **Success Green**  | `#10B981` | Success messages, confirmations, positive actions |
| **Warning Orange** | `#F59E0B` | Warnings, cautions, important notices             |
| **Error Red**      | `#EF4444` | Errors, critical alerts, destructive actions      |
| **Info Blue**      | `#3B82F6` | Information, tips, neutral notifications          |

### Neutral Colors

```css
/* Neutral Palette */
--color-gray-50: #f9fafb;
--color-gray-100: #f3f4f6;
--color-gray-200: #e5e7eb;
--color-gray-300: #d1d5db;
--color-gray-400: #9ca3af;
--color-gray-500: #6b7280;
--color-gray-600: #4b5563;
--color-gray-700: #374151;
--color-gray-800: #1f2937;
--color-gray-900: #111827;
```

---

## 📝 Typography

### Font Stack

**Primary Font**: Inter (recommended) or system fonts

```css
font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen",
  "Ubuntu", "Cantarell", sans-serif;
```

### Type Scale

| Element   | Size            | Weight         | Line Height | Usage              |
| --------- | --------------- | -------------- | ----------- | ------------------ |
| **H1**    | 32px (2rem)     | Bold (700)     | 1.2         | Page titles        |
| **H2**    | 24px (1.5rem)   | Semibold (600) | 1.3         | Section headers    |
| **H3**    | 20px (1.25rem)  | Semibold (600) | 1.4         | Subsection headers |
| **H4**    | 16px (1rem)     | Medium (500)   | 1.5         | Card titles        |
| **Body**  | 14px (0.875rem) | Regular (400)  | 1.5         | Body text          |
| **Small** | 12px (0.75rem)  | Regular (400)  | 1.4         | Captions, labels   |

### Font Weights

- **Regular**: 400 (body text)
- **Medium**: 500 (emphasis, labels)
- **Semibold**: 600 (headings, buttons)
- **Bold**: 700 (primary headings, strong emphasis)

---

## 🖼️ Logo Usage

### Primary Logo

![Orca Logo](/images/logo/orca-logo.png)

**Specifications**:

- Minimum width: 120px
- Clear space: 20px on all sides
- Available formats: PNG, SVG (recommended)

**Usage**:

- Application header
- Marketing materials
- Documentation
- Email signatures

**Don'ts**:

- ❌ Don't distort or stretch
- ❌ Don't change colors
- ❌ Don't add effects (shadows, gradients)
- ❌ Don't rotate or skew

### Icon Badge

![Orca Icon](/images/logo/orca-icon.png)

**Specifications**:

- Square format (1:1 ratio)
- Sizes: 16px, 32px, 64px, 128px, 256px, 512px

**Usage**:

- Favicon
- App icon
- Small UI elements
- Loading indicators

---

## 🎨 Icon System

### Style Guidelines

All icons follow a consistent style:

- **Line weight**: 2px
- **Corners**: Rounded
- **Style**: Minimalist, geometric
- **Color**: Ocean Blue (#0A4B78) or Teal (#00A8B5)

### Icon Sets

**UI Icons** (`/images/icons/ui-icon-set.png`)

- 16 general-purpose icons
- Calendar, Patient, Tooth, Imaging, Lab, Billing, etc.

**Module Icons** (`/images/icons/module-icons.png`)

- 13 module-specific icons
- Auth, Booking, Treatment, Imaging, Lab Work, etc.

### Icon Sizes

| Context | Size | Usage                       |
| ------- | ---- | --------------------------- |
| Small   | 16px | Inline text, dense UI       |
| Medium  | 24px | Buttons, navigation         |
| Large   | 32px | Cards, feature highlights   |
| XLarge  | 48px | Empty states, illustrations |

---

## 🎭 Illustrations

### Empty States

![Empty State](/images/illustrations/empty-state.png)

**Usage**: No data, empty lists, first-time experiences

**Tone**: Friendly, encouraging, professional

**Examples**:

- "No patients yet. Add your first patient to get started."
- "Your calendar is clear. Schedule your first appointment."

### Loading States

![Loading](/images/illustrations/loading.png)

**Usage**: Loading screens, data fetching, processing

**Implementation**: Can be animated with CSS or Lottie

---

## 📐 Spacing System

Use an 8px base unit for consistent spacing:

```css
--spacing-xs: 4px; /* 0.25rem */
--spacing-sm: 8px; /* 0.5rem */
--spacing-md: 16px; /* 1rem */
--spacing-lg: 24px; /* 1.5rem */
--spacing-xl: 32px; /* 2rem */
--spacing-2xl: 48px; /* 3rem */
--spacing-3xl: 64px; /* 4rem */
```

---

## 🔲 Border Radius

```css
--radius-sm: 4px; /* Small elements, tags */
--radius-md: 6px; /* Buttons, inputs */
--radius-lg: 8px; /* Cards, panels */
--radius-xl: 12px; /* Modals, large containers */
--radius-full: 9999px; /* Pills, circular elements */
```

---

## 🎯 Component Patterns

### Buttons

**Primary Button**

```css
background: #0a4b78;
color: white;
padding: 8px 16px;
border-radius: 6px;
font-weight: 600;
```

**Secondary Button**

```css
background: transparent;
color: #0a4b78;
border: 1px solid #0a4b78;
padding: 8px 16px;
border-radius: 6px;
font-weight: 600;
```

### Cards

```css
background: white;
border: 1px solid #e5e7eb;
border-radius: 8px;
padding: 16px;
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
```

### Input Fields

```css
border: 1px solid #d1d5db;
border-radius: 6px;
padding: 8px 12px;
font-size: 14px;
```

**Focus State**:

```css
border-color: #00a8b5;
box-shadow: 0 0 0 3px rgba(0, 168, 181, 0.1);
```

---

## 📱 Responsive Design

### Breakpoints

```css
/* Mobile */
@media (max-width: 640px) {
}

/* Tablet */
@media (min-width: 641px) and (max-width: 1024px) {
}

/* Desktop */
@media (min-width: 1025px) {
}
```

### Logo Scaling

| Screen Size         | Logo Width | Show Icon Only |
| ------------------- | ---------- | -------------- |
| Mobile (<640px)     | 100px      | Yes (32px)     |
| Tablet (641-1024px) | 140px      | Optional       |
| Desktop (>1024px)   | 180px      | No             |

---

## ♿ Accessibility

### Color Contrast

All text must meet WCAG AA standards:

- **Normal text**: 4.5:1 contrast ratio
- **Large text**: 3:1 contrast ratio

### Tested Combinations

✅ **Pass**:

- White text on Deep Ocean Blue (#0A4B78)
- Dark Navy (#062A40) text on white
- White text on Teal (#00A8B5)

❌ **Fail**:

- Light Blue (#E8F4F8) text on white
- Teal (#00A8B5) text on white

### Focus Indicators

All interactive elements must have visible focus states:

```css
:focus {
  outline: 2px solid #00a8b5;
  outline-offset: 2px;
}
```

---

## 🎨 Design Principles

### 1. Clarity Over Cleverness

- Use clear, descriptive labels
- Avoid jargon where possible
- Prioritize readability

### 2. Consistency

- Use the same patterns throughout
- Maintain visual hierarchy
- Follow established conventions

### 3. Professional Aesthetic

- Clean, modern design
- Appropriate for medical context
- Trustworthy and reliable

### 4. User-Focused

- Design for daily users (staff, doctors)
- Minimize clicks and cognitive load
- Provide helpful feedback

### 5. Accessible by Default

- High contrast
- Clear focus states
- Keyboard navigable

---

## 📦 Asset Checklist

### Required Formats

- [ ] Logo: PNG (transparent), SVG (vector)
- [ ] Icon Badge: PNG (multiple sizes), ICO (favicon)
- [ ] UI Icons: SVG (scalable), PNG (24px, 32px)
- [ ] Module Icons: SVG, PNG (48px, 64px)
- [ ] Illustrations: PNG, WebP (optimized)

### Optimization

- [ ] Compress PNGs (use TinyPNG or similar)
- [ ] Create WebP versions for web
- [ ] Generate favicon.ico from icon badge
- [ ] Create SVG versions for scalability

---

## 🚀 Implementation

### CSS Variables Setup

```css
:root {
  /* Colors */
  --color-primary: #0a4b78;
  --color-primary-dark: #062a40;
  --color-accent: #00a8b5;
  --color-accent-light: #e8f4f8;

  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 12px;

  /* Typography */
  --font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
}
```

### Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0A4B78",
          dark: "#062A40",
          light: "#E8F4F8",
        },
        accent: {
          DEFAULT: "#00A8B5",
          light: "#33BCC7",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
};
```

---

## 📞 Support

For questions about brand usage or additional assets:

- Review this guide first
- Check `/images/README.md` for asset details
- Maintain consistency with existing patterns

---

**Brand Guide Version**: 1.0  
**Last Updated**: 2025-11-26  
**Maintained By**: Development Team
