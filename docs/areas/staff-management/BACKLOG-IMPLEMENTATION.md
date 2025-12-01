# Staff Management - Implementation Backlog

> **Purpose**: Track remaining features to implement for Staff Management area  
> **Status**: Post-MVP Enhancements  
> **Last Updated**: 2024-11-30

---

## Overview

This backlog contains features that are documented but not yet implemented. These are enhancements that can be added incrementally based on priority.

**Note**: Core Staff Profiles/HR and Scheduling/Time Management features are complete and production-ready.

---

## Scheduling & Time Management

### Coverage Management

- [ ] Coverage requirement API endpoints
- [ ] Coverage gap detection logic
- [ ] Automated understaffing alerts
- [ ] Coverage management UI

### Overtime Tracking

- [ ] Overtime calculation logic
- [ ] Overtime API endpoints
- [ ] Overtime approval workflow UI
- [ ] Overtime reports

### Availability Management

- [ ] Staff availability API endpoints
- [ ] Recurring availability patterns
- [ ] Availability UI components

### Schedule Templates

- [ ] Template API endpoints
- [ ] Template library UI
- [ ] Template application workflow

### Scheduling Enhancements

- [ ] Drag-and-drop shift scheduling (UX enhancement)
- [ ] Schedule publication workflow
- [ ] PTO balance limits (currently unlimited PTO model)
- [ ] Bulk time-off for practice closures

---

## Roles & Permissions

### Role Management Enhancements

- [ ] Role hierarchy (level, parentRoleId fields)
- [ ] Role activate/deactivate endpoints
- [ ] Role settings (RoleSettings type)

### Custom Roles Advanced Features

- [ ] Clone role endpoint
- [ ] Role change history tracking
- [ ] Role export/import functionality
- [ ] Role validation endpoint

### Role Templates

- [ ] RoleTemplate model
- [ ] Template API endpoints
- [ ] Template UI components
- [ ] Industry-standard template library

### Multi-Location Access

- [ ] Location-specific role assignment UI
- [ ] Cross-location access management
- [ ] Location-based permission restrictions

### Access Audit

- [ ] Audit log viewing UI
- [ ] Audit reports and compliance dashboards

---

## Performance & Training

### Performance Metrics

- [ ] Performance metric tracking
- [ ] Role-specific KPI dashboards
- [ ] Performance trend analysis

### Goal Tracking

- [ ] Goal setting and monitoring
- [ ] Progress tracking
- [ ] Goal achievement reports

### Review Cycles

- [ ] Review cycle management
- [ ] Configurable review templates
- [ ] Review scheduling and reminders

### Training Records

- [ ] Training record tracking
- [ ] Training compliance monitoring
- [ ] Training assignment workflow

### CE Credit Management

- [ ] CE credit tracking for providers
- [ ] Expiration alerts
- [ ] CE requirement reports

### Recognition & Feedback

- [ ] Recognition system
- [ ] Peer feedback
- [ ] Performance feedback workflow

---

## Deferred Items

These items are intentionally deferred to other areas or require additional infrastructure:

- **File Upload Infrastructure** → Imaging Management area
- **PDF Generation** → Requires @react-pdf/renderer installation
- **Notification System** → Patient Communications integration

---

**Last Updated**: 2024-11-30
