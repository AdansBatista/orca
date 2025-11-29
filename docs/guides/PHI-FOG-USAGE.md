# PHI Fog Feature - Usage Guide

## Overview

The PHI (Protected Health Information) Fog feature allows you to hide sensitive patient data with a glass-fog effect. This is perfect for:

- **Demos and presentations** - Show the UI without exposing real patient data
- **Screenshots and marketing** - Capture the interface safely
- **Training environments** - Practice without real PHI
- **Development** - Test UI with fake data

## Quick Start

### 1. Setup Provider

Wrap your application with the `PhiFogProvider`:

```tsx
// app/layout.tsx
import { PhiFogProvider } from "@/contexts/phi-fog-context";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <PhiFogProvider>{children}</PhiFogProvider>
      </body>
    </html>
  );
}
```

### 2. Protect Sensitive Data

Use the `PhiProtected` component to wrap any sensitive information:

```tsx
import { PhiProtected } from "@/components/ui/phi-protected";

function PatientCard({ patient }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <PhiProtected fakeData="John Doe">{patient.name}</PhiProtected>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p>
          Email:{" "}
          <PhiProtected fakeData="patient@example.com">
            {patient.email}
          </PhiProtected>
        </p>
        <p>
          Phone:{" "}
          <PhiProtected fakeData="(555) 123-4567">{patient.phone}</PhiProtected>
        </p>
      </CardContent>
    </Card>
  );
}
```

### 3. Add Toggle Control

Add the toggle button to your header:

```tsx
import { PhiFogToggle, PhiFogBanner } from "@/components/phi-fog-toggle";

function Header() {
  return (
    <>
      <PhiFogBanner />
      <header>
        <nav>
          {/* Other nav items */}
          <PhiFogToggle />
        </nav>
      </header>
    </>
  );
}
```

## Component API

### PhiProtected

Main component for protecting inline text and data.

```tsx
<PhiProtected
  fog={boolean} // Override global setting
  fakeData={string} // Fake data to show when fogged
  blurIntensity={number} // Blur amount (1-10), default: 8
  showLockIcon={boolean} // Show lock icon, default: false
  className={string} // Additional CSS classes
>
  {children}
</PhiProtected>
```

**Examples:**

```tsx
// Basic usage (uses global fog setting)
<PhiProtected>{patient.name}</PhiProtected>

// With fake data
<PhiProtected fakeData="John Doe">{patient.name}</PhiProtected>

// Force fog on specific field
<PhiProtected fog={true}>{patient.ssn}</PhiProtected>

// With lock icon indicator
<PhiProtected showLockIcon>{patient.medicalRecord}</PhiProtected>

// Custom blur intensity
<PhiProtected blurIntensity={5}>{patient.notes}</PhiProtected>
```

### PhiProtectedInput

Protected input field component.

```tsx
<PhiProtectedInput
  fog={boolean} // Override global setting
  fakeValue={string} // Fake value to show when fogged
  // ...all standard input props
/>
```

**Example:**

```tsx
<PhiProtectedInput
  type="text"
  value={patient.name}
  fakeValue="John Doe"
  onChange={handleChange}
/>
```

### usePhiFog Hook

Access fog state in your components.

```tsx
import { usePhiFog } from "@/contexts/phi-fog-context";

function MyComponent() {
  const { isFogEnabled, toggleFog, enableFog, disableFog } = usePhiFog();

  return (
    <div>
      <p>Fog is {isFogEnabled ? "enabled" : "disabled"}</p>
      <button onClick={toggleFog}>Toggle</button>
    </div>
  );
}
```

## Using Fake Data Generator

Import the fake data utilities:

```tsx
import { getFakeData, getFakeName, getFakeEmail } from '@/lib/fake-data';

// Generate fake data by type
<PhiProtected fakeData={getFakeData('name')}>
  {patient.name}
</PhiProtected>

// Or use specific generators
<PhiProtected fakeData={getFakeName()}>
  {patient.name}
</PhiProtected>

<PhiProtected fakeData={getFakeEmail()}>
  {patient.email}
</PhiProtected>
```

Available generators:

- `getFakeName()` - Random fake name
- `getFakeEmail()` - Random fake email
- `getFakePhone()` - Random fake phone
- `getFakeAddress()` - Random fake address
- `getFakeSSN()` - Masked SSN
- `getFakeDOB()` - Random date of birth
- `getFakePatientId()` - Random patient ID
- `getFakeData(type)` - Get fake data by type

## Environment Configuration

### Enable fog by default

Set in `.env.local`:

```bash
NEXT_PUBLIC_PHI_FOG=true
```

### Enable fog programmatically

```tsx
// In your app initialization
if (process.env.NODE_ENV === "development") {
  localStorage.setItem("phi-fog", "true");
}
```

## Best Practices

### 1. Always provide fake data

```tsx
// ✅ Good - provides realistic fake data
<PhiProtected fakeData="John Doe">{patient.name}</PhiProtected>

// ❌ Avoid - just blurs, looks unprofessional
<PhiProtected>{patient.name}</PhiProtected>
```

### 2. Use consistent fake data

```tsx
// ✅ Good - use fake data generator for consistency
import { getFakeName } from "@/lib/fake-data";

<PhiProtected fakeData={getFakeName()}>{patient.name}</PhiProtected>;
```

### 3. Protect all PHI fields

Wrap all sensitive data:

- Patient names
- Email addresses
- Phone numbers
- Addresses
- SSN/ID numbers
- Medical record numbers
- Dates of birth
- Medical notes
- Treatment details

### 4. Test both states

Always test your UI with fog both enabled and disabled:

```tsx
// In your tests
it("displays patient name when fog is disabled", () => {
  render(<PatientCard patient={mockPatient} />);
  expect(screen.getByText(mockPatient.name)).toBeInTheDocument();
});

it("displays fake name when fog is enabled", () => {
  // Enable fog in test
  localStorage.setItem("phi-fog", "true");
  render(<PatientCard patient={mockPatient} />);
  expect(screen.queryByText(mockPatient.name)).not.toBeInTheDocument();
});
```

## Styling Customization

The fog effect uses these CSS classes:

```css
/* Glass fog overlay */
.phi-fog-overlay {
  background: linear-gradient(
    to right,
    rgba(255, 255, 255, 0.4),
    rgba(255, 255, 255, 0.6),
    rgba(255, 255, 255, 0.4)
  );
  backdrop-filter: blur(4px);
}
```

Customize in your global CSS or Tailwind config.

## Accessibility

The component includes proper ARIA attributes:

- `aria-hidden="true"` on fogged content
- Screen reader text: "Protected health information (hidden)"
- Maintains semantic HTML structure

## Security Notes

⚠️ **Important**: This feature is for **UI/UX purposes only**. It does NOT provide security:

- Real data is still in the DOM (just visually hidden)
- Real data is still sent from the backend
- This is NOT a replacement for proper access controls
- Use only for demos, screenshots, and training

For actual security:

- Implement proper backend authorization
- Use role-based access control (RBAC)
- Audit data access
- Follow HIPAA compliance guidelines

## Troubleshooting

### Fog not working

1. Check provider is set up:

   ```tsx
   <PhiFogProvider>{children}</PhiFogProvider>
   ```

2. Check environment variable:

   ```bash
   NEXT_PUBLIC_PHI_FOG=true
   ```

3. Check localStorage:
   ```js
   console.log(localStorage.getItem("phi-fog"));
   ```

### Fake data not showing

Make sure you're passing the `fakeData` prop:

```tsx
<PhiProtected fakeData="Fake Name">{realData}</PhiProtected>
```

### Styling issues

The component uses `inline-block` display. Wrap in a block element if needed:

```tsx
<div>
  <PhiProtected>{data}</PhiProtected>
</div>
```

## Examples

See complete examples in:

- `src/app/examples/phi-fog-demo/page.tsx`
- `src/components/examples/patient-card-demo.tsx`
