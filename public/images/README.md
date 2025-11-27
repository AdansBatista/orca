# Orca Image Assets

This folder contains all visual assets for the Orca orthodontic practice management system.

## 📁 Folder Structure

```
images/
├── logo/                   # Brand logos and icons
│   ├── orca-logo.png      # Primary logo with text
│   └── orca-icon.png      # Icon badge (for favicon, app icon)
│
├── icons/                  # UI and module icons
│   ├── ui-icon-set.png    # 16 general UI icons
│   └── module-icons.png   # 13 module-specific icons
│
├── illustrations/          # Illustrations for various states
│   ├── empty-state.png    # Empty state illustration
│   └── loading.png        # Loading animation illustration
│
└── backgrounds/            # Background images
    └── header-banner.png  # Header/hero banner
```

## 🎨 Brand Colors

- **Primary**: `#0A4B78` (Deep Ocean Blue)
- **Accent**: `#00A8B5` (Teal)
- **Success**: `#10B981` (Green)
- **Warning**: `#F59E0B` (Orange)
- **Error**: `#EF4444` (Red)

## 📦 Asset Details

### Logo Assets

**orca-logo.png**

- Primary brand logo with orca icon and "ORCA" text
- Use for: Headers, marketing materials, documentation
- Minimum width: 120px
- Clear space: 20px on all sides

**orca-icon.png**

- Simplified icon badge (circular)
- Use for: Favicon, app icons, small UI elements
- Recommended sizes: 16px, 32px, 64px, 128px, 256px

### Icon Sets

**ui-icon-set.png**

- Contains 16 general-purpose UI icons
- Icons: Calendar, Patient, Tooth, Imaging, Lab, Billing, Analytics, Chat, Treatment, Staff, Alert, Settings, Documents, Compliance, Camera, Medical
- Style: Line art, 2px stroke, rounded corners
- Color: Ocean Blue (#0A4B78)

**module-icons.png**

- Contains 13 module-specific icons for main application areas
- Modules: Auth, Booking, Treatment, Imaging, Lab Work, Dashboard, Staff, Resources, CRM, Communications, Billing, Financial, Compliance
- Style: Consistent with UI icons
- Use for: Main navigation, module cards

### Illustrations

**empty-state.png**

- Friendly illustration for empty data states
- Use for: Empty lists, no appointments, no messages
- Professional, encouraging tone

**loading.png**

- Loading state illustration
- Use for: Loading screens, data fetching
- Can be animated with CSS

### Backgrounds

**header-banner.png**

- Wide banner with gradient and geometric patterns
- Use for: Dashboard header, login page, hero sections
- Aspect ratio: 16:4 (wide format)

## 🔧 Usage Examples

### HTML - Favicon

```html
<link rel="icon" type="image/png" href="/images/logo/orca-icon.png" />
```

### HTML - Logo

```html
<img src="/images/logo/orca-logo.png" alt="Orca" width="180" />
```

### Next.js - Image Component

```jsx
import Image from "next/image";

<Image src="/images/logo/orca-logo.png" alt="Orca" width={180} height={60} />;
```

### CSS - Background

```css
.hero {
  background-image: url("/images/backgrounds/header-banner.png");
  background-size: cover;
  background-position: center;
}
```

## 📝 Next Steps

To complete the asset library:

1. **Create SVG versions** of logos and icons for better scalability
2. **Generate favicon.ico** from orca-icon.png (use online converter)
3. **Extract individual icons** from icon sets for separate use
4. **Optimize images** for web (compress PNGs, create WebP versions)
5. **Create dark mode variants** if needed

## 🎯 Asset Guidelines

### Do's ✅

- Maintain consistent brand colors
- Use appropriate asset for context
- Ensure sufficient contrast for accessibility
- Keep designs clean and professional

### Don'ts ❌

- Don't distort or stretch logos
- Don't use colors outside brand palette
- Don't mix different icon styles
- Don't use low-resolution versions

## 📞 Need More Assets?

For additional custom icons or illustrations:

- Maintain the same color palette
- Use consistent line weight (2px for icons)
- Keep rounded corners and minimalist style
- Follow the professional medical software aesthetic

---

**Last Updated**: 2025-11-26  
**Maintained By**: Development Team
