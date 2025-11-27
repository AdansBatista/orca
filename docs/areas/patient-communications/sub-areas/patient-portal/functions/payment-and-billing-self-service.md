# Payment and Billing Self-Service

Purpose & Summary
Allow patients to view invoices, make payments, setup payment methods, and manage payment plans from the portal.

API Endpoints
- `GET /api/v1/portal/invoices` — list invoices for authenticated patient
- `POST /api/v1/portal/payments` — create payment intent
  - Request: { "invoiceId":"uuid", "paymentMethodId":"token" }
  - Response: { "paymentId":"uuid", "status":"processing" }
- `POST /api/v1/portal/payment-methods` — add payment method (tokenized)

DB / Data Fields
- Invoice (id, patientId, amount, status, dueDate)
- Payment (id, invoiceId, amount, method, status, providerTransactionId)
- PaymentMethod (id, patientId, type, token, last4, expiry)

Sample Payloads
- Pay request: { "invoiceId":"inv_123", "paymentMethodId":"pm_456" }

UI Notes
- Billing tab with list of invoices, pay-now button, add payment method modal, payment history

Acceptance Criteria
- Payments tokenized and processed via gateway (no raw card data stored)
- Successful payments update invoice status and emit `billing.payment.completed` event
- Access controls ensure only invoice owner can view/pay

Integration Hooks
- Billing area for invoice generation and reconciliation
- Messaging Hub for payment receipts and reminders
