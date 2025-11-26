# Lab Work Management - Requirements

## Overview
The Lab Work Management module handles the complete lifecycle of lab work orders including retainers, appliances, aligners, and other orthodontic devices manufactured by external labs.

## Goals
- Eliminate paper-based lab work tracking
- Streamline lab order creation and submission
- Track lab work status in real-time
- Manage multiple lab vendor relationships
- Ensure quality control and timely delivery
- Integrate lab work with treatment plans
- Reduce errors and improve turnaround time

## Requirements

### Lab Vendor Management

#### Vendor Directory
- [ ] **Lab vendor database** with contact information
- [ ] **Vendor specialties** and capabilities catalog
- [ ] **Turnaround time tracking** per vendor and item type
- [ ] **Quality ratings** and performance history
- [ ] **Pricing information** per item type
- [ ] **Vendor communication preferences**
- [ ] **Shipping methods** and costs
- [ ] **Account numbers** and billing information

#### Vendor Performance Tracking
- [ ] **On-time delivery rate** tracking
- [ ] **Quality acceptance rate**
- [ ] **Average turnaround time** per vendor
- [ ] **Remake/redo frequency**
- [ ] **Cost comparison** across vendors
- [ ] **Vendor scorecards**
- [ ] **Preferred vendor** designation

### Lab Work Order Creation

#### Order Types
- [ ] **Retainers** (Hawley, Essix, fixed)
- [ ] **Removable appliances** (expanders, space maintainers)
- [ ] **Aligners** (clear aligner series)
- [ ] **Bite splints** and TMJ appliances
- [ ] **Custom brackets** and bands
- [ ] **Study models** and diagnostic casts
- [ ] **Surgical guides**
- [ ] **Other custom orthodontic devices**

#### Order Information
- [ ] **Patient association** and demographics
- [ ] **Appliance specifications** and requirements
- [ ] **Shade/color selection** (when applicable)
- [ ] **Material preferences**
- [ ] **Special instructions** and notes
- [ ] **Rush order** designation
- [ ] **Expected delivery date**
- [ ] **Cost estimate**

#### Order Creation Workflow
- [ ] **Quick order templates** for common items
- [ ] **Digital prescription forms** per vendor
- [ ] **Attachment of diagnostic images** or scans
- [ ] **Attachment of treatment photos**
- [ ] **Integration with treatment plan** (auto-trigger orders)
- [ ] **Multi-item orders** for single patient
- [ ] **Bulk ordering** for multiple patients

### Order Submission & Tracking

#### Submission Methods
- [ ] **Email submission** to lab
- [ ] **Portal integration** (direct lab portal submission)
- [ ] **Print-friendly order forms**
- [ ] **Fax submission** (legacy support)
- [ ] **Submission confirmation** tracking

#### Order Status Tracking
- [ ] **Submitted** - order sent to lab
- [ ] **Received** - lab confirmed receipt
- [ ] **In Production** - lab is fabricating
- [ ] **Quality Check** - lab internal review
- [ ] **Shipped** - order en route
- [ ] **Delivered** - received at practice
- [ ] **Accepted** - quality approved by practice
- [ ] **Rejected/Remake** - quality issues requiring redo

#### Status Notifications
- [ ] **Automatic status update emails/SMS**
- [ ] **Expected delivery date alerts**
- [ ] **Delayed order warnings**
- [ ] **Shipping notifications** with tracking numbers
- [ ] **Delivery confirmation**

### Lab Work Reception & Quality Control

#### Receiving Workflow
- [ ] **Scan/log received items**
- [ ] **Associate with patient** and order
- [ ] **Quality inspection checklist**
- [ ] **Photo documentation** of received item
- [ ] **Acceptance or rejection** decision
- [ ] **Patient notification** of arrival

#### Quality Control
- [ ] **Quality criteria checklist** per item type
- [ ] **Visual inspection** requirements
- [ ] **Fit and function** testing
- [ ] **Documentation of defects**
- [ ] **Quality rating** submission to lab
- [ ] **Quality trend tracking** per vendor

#### Remake/Redo Management
- [ ] **Remake request creation**
- [ ] **Reason for remake** documentation
- [ ] **Photo evidence** of issue
- [ ] **Remake tracking** as new order
- [ ] **Cost adjustment** (no-charge remake)
- [ ] **Remake turnaround time** tracking

### Lab Work Calendar Integration

#### Delivery Scheduling
- [ ] **Expected delivery dates** on calendar
- [ ] **Lab work due date** visibility
- [ ] **Appointment scheduling** based on lab work arrival
- [ ] **Automatic appointment reminders** when lab work arrives
- [ ] **Delivery date conflicts** with appointments

### Treatment Plan Integration

#### Automated Order Triggers
- [ ] **Treatment plan milestones** trigger lab orders
- [ ] **Automatic order suggestions** based on treatment phase
- [ ] **Order templates** linked to treatment procedures
- [ ] **Pre-planned order sequences** for full treatment
- [ ] **Order readiness checks** before submission

#### Treatment Documentation
- [ ] **Link lab work to treatment records**
- [ ] **Lab work cost posting** to treatment plan
- [ ] **Treatment delay tracking** due to lab work issues
- [ ] **Lab work delivery** as treatment milestone

### Lab Work Inventory

#### Received Items Tracking
- [ ] **In-house lab work inventory**
- [ ] **Item location tracking** (storage location)
- [ ] **Aging analysis** (how long in inventory)
- [ ] **Pending delivery** to patient tracking
- [ ] **Lost/misplaced item** alerts

### Financial Management

#### Cost Tracking
- [ ] **Lab work costs** per order
- [ ] **Cost allocation** to patient accounts
- [ ] **Lab work budget** tracking
- [ ] **Vendor payment** integration
- [ ] **Cost per item type** analytics

#### Billing Integration
- [ ] **Automatic charge creation** for patient billing
- [ ] **Insurance billing** for lab work (if applicable)
- [ ] **Lab fee markup** calculation
- [ ] **Cost of goods sold** tracking

### Reporting & Analytics

#### Lab Work Reports
- [ ] **Orders by status** summary
- [ ] **Pending orders** aging report
- [ ] **Vendor performance** comparison
- [ ] **Turnaround time** analysis
- [ ] **Cost analysis** by vendor and item type
- [ ] **Quality issues** tracking report
- [ ] **Remake rate** analysis

#### Operational Metrics
- [ ] **Average turnaround time** per item type
- [ ] **On-time delivery percentage**
- [ ] **Quality acceptance rate**
- [ ] **Cost per case** for lab work
- [ ] **Vendor utilization** distribution

### Communication & Collaboration

#### Lab Communication
- [ ] **Direct messaging** with lab contacts
- [ ] **Order clarification** requests
- [ ] **Rush order requests**
- [ ] **Issue escalation** workflow
- [ ] **Delivery coordination**

#### Internal Communication
- [ ] **Staff notifications** for lab work arrivals
- [ ] **Doctor alerts** for quality issues
- [ ] **Team coordination** for lab work pickup

## Features
See [features.md](./features.md) for detailed feature specifications.

---

**Status**: Draft
**Last Updated**: 2025-11-26
