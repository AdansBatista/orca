# Vendor Payment Tracking

> **Sub-Area**: [Expense Management](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Vendor Payment Tracking manages all payments to vendors and suppliers for the orthodontic practice. This function tracks invoices, manages payment scheduling, records payment transactions, handles recurring expenses, and maintains 1099 tracking for year-end tax compliance.

---

## Core Requirements

- [ ] Enter and track vendor invoices with due dates and terms
- [ ] Schedule payments with due date reminders and cash flow consideration
- [ ] Record check/ACH/card payments with reference numbers
- [ ] Manage recurring expense templates (rent, utilities, subscriptions)
- [ ] Maintain vendor payment history with searchable records
- [ ] Track 1099-eligible vendors for year-end reporting
- [ ] Generate accounts payable aging reports

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/finance/vendors` | `finance:view_expenses` | List vendors with balances |
| GET | `/api/finance/vendors/:id` | `finance:view_expenses` | Get vendor details |
| GET | `/api/finance/vendors/:id/payments` | `finance:view_expenses` | Get vendor payment history |
| POST | `/api/finance/vendor-invoices` | `finance:manage_expenses` | Create vendor invoice |
| GET | `/api/finance/vendor-invoices` | `finance:view_expenses` | List pending invoices |
| POST | `/api/finance/vendor-invoices/:id/pay` | `finance:manage_expenses` | Record payment |
| GET | `/api/finance/accounts-payable/aging` | `finance:view_expenses` | AP aging report |
| GET | `/api/finance/1099-tracking` | `finance:view_expenses` | 1099 vendor summary |

---

## Data Model

```prisma
model VendorInvoice {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Vendor
  vendorId      String   @db.ObjectId
  vendorName    String

  // Invoice details
  invoiceNumber String
  invoiceDate   DateTime
  dueDate       DateTime
  terms         PaymentTerms @default(NET_30)

  // Amounts
  subtotal      Decimal
  taxAmount     Decimal  @default(0)
  totalAmount   Decimal

  // Categorization
  categoryId    String   @db.ObjectId
  description   String

  // Payment tracking
  paidAmount    Decimal  @default(0)
  balanceDue    Decimal
  status        InvoiceStatus @default(PENDING)

  // Documentation
  documentUrls  String[]
  notes         String?

  // Timestamps & Audit
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  createdBy     String   @db.ObjectId

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  payments      VendorPayment[]

  @@index([clinicId])
  @@index([vendorId])
  @@index([dueDate])
  @@index([status])
}

enum PaymentTerms {
  DUE_ON_RECEIPT
  NET_15
  NET_30
  NET_45
  NET_60
}

enum InvoiceStatus {
  PENDING
  PARTIAL
  PAID
  OVERDUE
  DISPUTED
  VOID
}

model VendorPayment {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  invoiceId     String?  @db.ObjectId

  // Payment details
  vendorId      String   @db.ObjectId
  paymentDate   DateTime
  amount        Decimal

  // Method
  paymentMethod VendorPaymentMethod
  referenceNumber String?
  checkNumber   String?
  bankAccountId String?  @db.ObjectId

  // 1099 tracking
  is1099Eligible Boolean @default(false)

  // Timestamps & Audit
  createdAt     DateTime @default(now())
  createdBy     String   @db.ObjectId

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  invoice       VendorInvoice? @relation(fields: [invoiceId], references: [id])

  @@index([clinicId])
  @@index([vendorId])
  @@index([paymentDate])
}

enum VendorPaymentMethod {
  CHECK
  ACH
  WIRE
  CARD
  CASH
}
```

---

## Business Rules

- Invoices past due date automatically flagged as OVERDUE
- Payment reminders sent 7 days and 1 day before due date
- 1099 threshold tracking ($600 annual limit triggers reporting)
- Partial payments update balance due automatically
- Void invoices require reason and supervisor approval
- Recurring expenses auto-generate invoices based on schedule
- Check numbers must be unique per bank account

---

## Dependencies

**Depends On:**
- Vendors Management (vendor records)
- Expense Categorization (expense categories)

**Required By:**
- Overhead Cost Management
- Financial Reports (P&L, cash flow)
- Tax Preparation (1099 reporting)

---

## Notes

- Track payment terms per vendor for cash flow planning
- Orthodontic practices commonly have recurring expenses for aligners, subscriptions
- Lab fees tracked separately but follow similar invoice patterns
- Consider early payment discounts when optimizing cash flow

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
