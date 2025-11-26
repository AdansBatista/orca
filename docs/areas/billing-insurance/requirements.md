# Billing & Insurance Management - Requirements

## Overview
The Billing & Insurance Management module handles patient billing, insurance claims processing, payment tracking, and multi-party payment coordination.

## Goals
- Streamline billing processes
- Maximize insurance reimbursement
- Reduce billing errors
- Improve collections
- Support flexible payment arrangements

## Requirements

### Patient Billing
- [ ] Generate patient statements
- [ ] Treatment cost estimates
- [ ] Payment plan creation and management
- [ ] Multiple payment methods support
- [ ] Automatic recurring billing
- [ ] Family account management

### Insurance Claims
- [ ] Electronic claims submission
- [ ] Claims status tracking
- [ ] Claims denial management
- [ ] Resubmission workflows
- [ ] Insurance payment posting
- [ ] EOB (Explanation of Benefits) processing

### Payment Processing

#### Payment Gateway Integration
- [ ] **Stripe integration** for credit card processing
- [ ] **Square integration** as alternative payment gateway
- [ ] **Interac e-Transfer** support (Canadian practices)
- [ ] **ACH/Direct Debit** for automatic recurring payments
- [ ] **Digital wallet support** (Apple Pay, Google Pay)
- [ ] PCI-DSS compliance through gateway (no card data stored locally)
- [ ] Payment gateway failover/backup options

#### Card-Present Transactions (POS Replacement)
- [ ] Integrated card readers (Stripe Terminal, Square Reader)
- [ ] **Chip card (EMV)** processing
- [ ] **Tap/Contactless (NFC)** processing
- [ ] **Swipe (magnetic stripe)** as fallback
- [ ] PIN debit support
- [ ] Bluetooth/USB reader connectivity
- [ ] Multi-reader support for multiple checkout stations
- [ ] Offline payment mode with later sync

#### Card-Not-Present Transactions
- [ ] Manual card entry for phone payments
- [ ] **Payment links** via email/SMS for remote payments
- [ ] **QR code payments** for patient self-service
- [ ] Secure online payment portal for patients
- [ ] Saved payment methods (tokenized cards)
- [ ] CVV verification for card-not-present security

#### Payment Methods
- [ ] **Credit Cards**: Visa, Mastercard, Amex, Discover
- [ ] **Debit Cards**: Interac (Canada), PIN debit (US)
- [ ] **Cash**: Manual cash entry with receipt
- [ ] **Check/Cheque**: Check number tracking and reconciliation
- [ ] **E-Transfer (Interac)**: Email-based transfers (Canada)
- [ ] **ACH/EFT**: Bank account direct debit
- [ ] **Payment Plans**: Automated recurring charges
- [ ] **Split Payments**: Multiple payment methods per transaction
- [ ] **Gift Cards/Credits**: Practice credit balance application

#### Payment Processing Features
- [ ] **Real-time payment authorization** and capture
- [ ] **Automatic posting** to patient accounts
- [ ] **Digital receipts** via email/SMS/print
- [ ] **Refund processing** through original payment method
- [ ] **Partial refunds** and adjustments
- [ ] **Void transactions** (same-day cancellation)
- [ ] **Payment holds/pre-authorization** for large treatments
- [ ] **Recurring billing** for payment plans
- [ ] **Failed payment retry** logic with notifications
- [ ] **3D Secure (3DS)** for enhanced card security

#### Payment Reconciliation
- [ ] **Automatic reconciliation** with payment gateway
- [ ] **Daily settlement reports** from gateway
- [ ] **Bank deposit matching** and tracking
- [ ] **Dispute/chargeback management**
- [ ] **Fee tracking** (gateway fees, transaction fees)
- [ ] **Payout schedule** visibility (when funds hit bank account)
- [ ] **Multi-currency support** (if needed for border practices)

#### Payment Security & Compliance
- [ ] **PCI-DSS compliance** (gateway handles card data)
- [ ] **End-to-end encryption** for card transactions
- [ ] **Tokenization** for storing payment methods securely
- [ ] **Fraud detection** via gateway intelligence
- [ ] **Address verification (AVS)** for card-not-present
- [ ] **Velocity checks** to prevent abuse
- [ ] **Audit logging** of all payment transactions
- [ ] **Role-based permissions** for refunds/voids

#### Payment Plan Automation
- [ ] Payment plan tracking
- [ ] **Automatic recurring charges** on schedule
- [ ] **Payment plan reminders** before charge
- [ ] **Failed payment notifications** to patient and staff
- [ ] **Auto-retry logic** for failed payments (smart retry schedule)
- [ ] **Payment plan modifications** (skip, reschedule, adjust amount)
- [ ] **Early payoff** calculations and processing

#### Patient Payment Experience
- [ ] Payment reminders (email/SMS)
- [ ] Late payment tracking and notifications
- [ ] **Self-service payment portal** for patients
- [ ] **Saved payment methods** for convenience
- [ ] **Payment history** visibility for patients
- [ ] **Upcoming payment schedule** visibility
- [ ] **Text-to-pay** capability
- [ ] **Email invoice with pay button**

#### Reporting & Analytics
- [ ] **Daily payment reports** by method
- [ ] **Gateway fee analysis**
- [ ] **Payment success/failure rates**
- [ ] **Refund and chargeback tracking**
- [ ] **Payment method preferences** analysis
- [ ] **Collections rate improvement** tracking
- [ ] **Cash flow impact** of payment gateway

#### Staff Workflow Integration
- [ ] **Quick checkout** from appointment completion
- [ ] **Payment terminal at reception**
- [ ] **Mobile payment processing** (tablet/phone)
- [ ] **Payment during treatment** (chairside payment)
- [ ] **Receipt printing** or digital delivery
- [ ] **Tip handling** (if applicable for hybrid practices)

#### Credit Balance Handling
- [ ] Credit balance tracking
- [ ] Refund management to original payment method
- [ ] **Credit balance application** to future invoices
- [ ] **Credit transfer** between family members
- [ ] **Gift card/credit voucher** issuance

### Insurance Management
- [ ] Insurance company database
- [ ] Patient insurance information
- [ ] Eligibility verification
- [ ] Coverage estimation
- [ ] Pre-authorization tracking
- [ ] Coordination of benefits

### Multi-Party Billing
- [ ] Primary and secondary insurance billing
- [ ] Family member payment responsibility
- [ ] Employer/school payment coordination
- [ ] Third-party payment arrangements

### Collections
- [ ] Aging reports (30/60/90/120+ days)
- [ ] Collection workflows
- [ ] Payment reminders and notices
- [ ] Collections agency integration
- [ ] Bad debt write-off management

### AI-Powered Features
- [ ] Automated data extraction from insurance faxes/letters
- [ ] Intelligent reconciliation with patient records
- [ ] Claims optimization suggestions
- [ ] Payment pattern prediction

## Features
See [features.md](./features.md) for detailed feature specifications.

---

**Status**: Draft
**Last Updated**: 2025-11-25
