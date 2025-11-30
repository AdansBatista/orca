# Development Backlog

> Deferred tasks and features to implement later

---

## File Upload Infrastructure

**Status:** Pending (waiting for Imaging Management implementation)

**Context:** Staff Documents feature currently uses URL-based file references. Actual file upload/storage infrastructure will be built during Imaging Management implementation.

### Tasks

- [ ] **Build file storage service** (during Imaging Management)
  - Local filesystem storage for on-premises deployment
  - File validation (type, size limits)
  - Secure file access with permission checks

- [ ] **Create reusable upload components** (during Imaging Management)
  - File picker component
  - Upload progress indicator
  - Drag-and-drop support
  - Preview for images/PDFs

- [ ] **Backport to Staff Documents**
  - Replace URL input with file upload in `DocumentUploadForm.tsx`
  - Update `POST /api/staff/[id]/documents` to handle file upload
  - Update `DELETE /api/staff/[id]/documents` to delete files from storage
  - Add file download endpoint

### Related Files
- `src/components/staff/DocumentUploadForm.tsx` - Currently accepts URL, needs file upload
- `src/components/staff/DocumentsList.tsx` - Download button opens URL directly
- `src/app/api/staff/[id]/documents/route.ts` - Needs file upload handling

### Notes
- Imaging Management will need more robust file handling (DICOM, large images, thumbnails)
- Staff Documents can use a simplified version of that infrastructure
- Consider file encryption at rest for HIPAA compliance

---

## Employment Records Gaps

**Status:** Pending (future enhancement)

**Context:** Current implementation provides core CRUD functionality. The following features are documented in specs but not yet implemented.

### Missing Features

- [ ] **Employment verification letter generation**
  - Generate official verification letters for employees
  - Include employment dates, title, status
  - PDF generation with clinic letterhead

- [ ] **Compensation tracking UI**
  - Schema fields exist (`previousSalary`, `newSalary`, `previousHourlyRate`, `newHourlyRate`)
  - Need UI components to view/edit compensation data
  - Permission-gated (HR/Management only)

- [ ] **Document attachments for records**
  - Attach supporting documents to employment records
  - Link to Document Management system

- [ ] **Supervisor tracking**
  - Add `supervisorId` field to track reporting relationships
  - Display supervisor in employment record details

### Business Rule Gaps

- [ ] **Automatic account deactivation on TERMINATION**
  - When employment record type is TERMINATION, automatically:
    - Set staff status to TERMINATED
    - Deactivate linked user account
    - Revoke system access

- [ ] **Compensation permission enforcement**
  - Only users with `staff:compensation` permission should see salary fields
  - Hide compensation data from general staff:view users

### Design Decisions

- **No UPDATE endpoint**: Employment records are intentionally immutable for audit trail integrity. To correct an error, create a new corrective record.

---

## Document Management Gaps

**Status:** Pending (future enhancement)

**Context:** Current implementation provides basic document metadata storage. Full document management features pending.

### Critical Missing Features

- [ ] **Expiration date tracking**
  - Add `expirationDate` field to StaffDocument model
  - Dashboard alerts for expiring documents
  - Automatic status updates (ACTIVE → EXPIRED)

- [ ] **Version history**
  - Track document versions when replaced
  - Ability to view/restore previous versions
  - Audit trail of who uploaded each version

### Missing Document Types

Current categories are basic. Add specialized HR document types:

- [ ] NDA (Non-Disclosure Agreement)
- [ ] I-9 (Employment Eligibility Verification)
- [ ] W-4 (Employee's Withholding Certificate)
- [ ] Direct Deposit Authorization
- [ ] Employee Handbook Acknowledgment
- [ ] Emergency Contact Form
- [ ] Benefits Enrollment
- [ ] Performance Improvement Plan (PIP)
- [ ] Written Warnings
- [ ] Commendations/Awards

### Missing Validations

- [ ] **File size limit enforcement**
  - Max file size validation (e.g., 25MB for documents)
  - Different limits by document type
  - User feedback on rejection

- [ ] **MIME type validation**
  - Server-side validation of actual file type
  - Prevent disguised file uploads
  - Security scanning integration point

- [ ] **Supported format restrictions**
  - Define allowed formats per category
  - Contracts: PDF only
  - ID Documents: PDF, JPG, PNG
  - Medical: PDF only

### Related to File Upload Infrastructure

These features depend on the File Upload Infrastructure backlog item being completed first.

---

## Other Backlog Items

*(Add future deferred items here)*

---

**Last Updated:** 2024-11-29
