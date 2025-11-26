# Imaging Management - Features

## Feature List

### 1. Image Vault
Secure, encrypted storage for all patient images.
- [Details](./features/image-vault.md)

### 2. Advanced Image Viewer & Manipulation
Professional high-resolution image viewing with advanced manipulation tools.
- [Details](./features/advanced-image-viewer.md)

**Key Capabilities**:
- **High-resolution support** - handle 50+ megapixel images smoothly
- **GPU-accelerated rendering** for optimal performance
- **Advanced zoom & pan** - smooth controls with saved zoom levels
- **Image manipulation** - rotate, flip, brightness, contrast, saturation, sharpness
- **Save view states** - save custom zoom, pan position, and adjustments per image
- **Multiple saved views** - create named presets (e.g., "Full Arch", "Upper Right")
- **Reset to original** - one-click restore to unmodified state
- **Non-destructive editing** - original images never overwritten
- **Undo/Redo** for all manipulations
- **Progressive loading** for instant display of large images
- **Comparison modes** - side-by-side, overlay, before/after slider
- **Synchronized viewing** across multiple images
- **Full-screen mode** for detailed examination
- **Minimap navigator** for large image navigation

### 3. Image Capture & Upload
Multiple methods for adding images to patient records.
- [Details](./features/image-capture-upload.md)

### 4. Progress Photography
Standardized progress photos with timeline visualization.
- [Details](./features/progress-photography.md)

### 5. Image Annotations
Mark up and measure images with annotations.
- [Details](./features/image-annotations.md)

### 6. Before/After Gallery
Create compelling before/after treatment presentations.
- [Details](./features/before-after-gallery.md)

### 7. DICOM Support
Handle DICOM format for x-rays and scans.
- [Details](./features/dicom-support.md)

### 8. Image Collage & Template Builder
Create customizable photo/X-ray collages with clinic branding for patient presentations and referrals.
- [Details](./features/image-collage-template-builder.md)

**Key Capabilities**:
- **Template designer** - drag-and-drop layout builder with grid system
- **Pre-built templates** - common orthodontic layouts (progress report, referral letter, case presentation)
- **Dynamic placeholders** - slots for patient photos, X-rays, logo, patient info, dates
- **Clinic branding** - logo, colors, contact info applied automatically
- **Image slots** - pull images from patient's Image Vault or capture new
- **X-ray integration** - export snapshots from Cornerstone.js viewer
- **Text overlays** - add labels, annotations, clinical notes
- **Template library** - save and reuse custom templates across patients
- **PDF export** - high-quality PDF generation via Puppeteer
- **Print support** - optimized print layouts with CSS @media print
- **Batch generation** - generate reports for multiple patients

**AI-Powered Features**:
- **Smart report generation** - AI analyzes patient data and auto-selects best images for report type
- **Image quality scoring** - automatically pick sharpest, best-lit photos from each session
- **Before/after matching** - AI pairs comparable images across treatment timeline
- **Layout suggestions** - recommend optimal layout based on available images and report purpose
- **Auto-captioning** - generate descriptive labels for images based on metadata and AI analysis
- **Treatment summary generation** - draft clinical notes summarizing visible progress
- **Save AI output as template** - convert AI-generated reports into reusable templates

**Template Schema** (stored in MongoDB):
```json
{
  "name": "Progress Report",
  "layout": "2x3-grid",
  "elements": [
    { "type": "logo", "position": "top-left" },
    { "type": "patient-info", "position": "top-right" },
    { "type": "image-slot", "label": "Initial Photo", "position": "row1-col1" },
    { "type": "xray-slot", "label": "Initial Pano", "position": "row1-col2" },
    { "type": "image-slot", "label": "Current Photo", "position": "row2-col1" },
    { "type": "xray-slot", "label": "Current Pano", "position": "row2-col2" }
  ]
}
```

---

**Note**: Click on individual feature links for detailed specifications.
