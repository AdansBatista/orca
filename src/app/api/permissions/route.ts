import { NextResponse } from 'next/server';

import { withAuth } from '@/lib/auth/with-auth';

/**
 * All available permissions in the system
 * Organized by resource category
 */
const PERMISSION_CATEGORIES = {
  patients: {
    label: 'Patients',
    description: 'Patient records and information',
    permissions: [
      { code: 'patients:create', label: 'Create Patients', description: 'Create new patient records' },
      { code: 'patients:read', label: 'View Patients', description: 'View patient records' },
      { code: 'patients:update', label: 'Update Patients', description: 'Update patient information' },
      { code: 'patients:delete', label: 'Delete Patients', description: 'Delete patient records' },
      { code: 'patients:*', label: 'Full Patient Access', description: 'Full access to all patient operations' },
    ],
  },
  appointments: {
    label: 'Appointments',
    description: 'Scheduling and appointments',
    permissions: [
      { code: 'appointments:create', label: 'Create Appointments', description: 'Schedule new appointments' },
      { code: 'appointments:read', label: 'View Appointments', description: 'View appointment schedules' },
      { code: 'appointments:update', label: 'Update Appointments', description: 'Modify appointments' },
      { code: 'appointments:delete', label: 'Cancel Appointments', description: 'Cancel appointments' },
      { code: 'appointments:*', label: 'Full Appointment Access', description: 'Full access to scheduling' },
    ],
  },
  treatment: {
    label: 'Treatment',
    description: 'Treatment plans and clinical records',
    permissions: [
      { code: 'treatment:create', label: 'Create Treatments', description: 'Create treatment plans' },
      { code: 'treatment:read', label: 'View Treatments', description: 'View treatment records' },
      { code: 'treatment:update', label: 'Update Treatments', description: 'Modify treatment plans' },
      { code: 'treatment:delete', label: 'Delete Treatments', description: 'Delete treatment records' },
      { code: 'treatment:*', label: 'Full Treatment Access', description: 'Full access to treatments' },
    ],
  },
  billing: {
    label: 'Billing',
    description: 'Financial and billing operations',
    permissions: [
      { code: 'billing:create', label: 'Create Invoices', description: 'Create billing records' },
      { code: 'billing:read', label: 'View Billing', description: 'View financial information' },
      { code: 'billing:update', label: 'Update Billing', description: 'Modify billing records' },
      { code: 'billing:delete', label: 'Delete Billing', description: 'Delete billing records' },
      { code: 'billing:*', label: 'Full Billing Access', description: 'Full access to billing' },
    ],
  },
  insurance: {
    label: 'Insurance',
    description: 'Insurance claims and verification',
    permissions: [
      { code: 'insurance:create', label: 'Create Claims', description: 'Submit insurance claims' },
      { code: 'insurance:read', label: 'View Insurance', description: 'View insurance information' },
      { code: 'insurance:update', label: 'Update Insurance', description: 'Modify insurance records' },
      { code: 'insurance:delete', label: 'Delete Insurance', description: 'Delete insurance records' },
      { code: 'insurance:*', label: 'Full Insurance Access', description: 'Full insurance management' },
    ],
  },
  staff: {
    label: 'Staff',
    description: 'Staff management and profiles',
    permissions: [
      { code: 'staff:create', label: 'Create Staff', description: 'Add new staff members' },
      { code: 'staff:read', label: 'View Staff', description: 'View staff profiles' },
      { code: 'staff:update', label: 'Update Staff', description: 'Modify staff information' },
      { code: 'staff:delete', label: 'Delete Staff', description: 'Remove staff members' },
      { code: 'staff:*', label: 'Full Staff Access', description: 'Full staff management' },
    ],
  },
  roles: {
    label: 'Roles & Permissions',
    description: 'Role management and access control',
    permissions: [
      { code: 'roles:read', label: 'View Roles', description: 'View role definitions' },
      { code: 'roles:create', label: 'Create Roles', description: 'Create custom roles' },
      { code: 'roles:update', label: 'Update Roles', description: 'Modify role permissions' },
      { code: 'roles:delete', label: 'Delete Roles', description: 'Delete custom roles' },
      { code: 'roles:assign', label: 'Assign Roles', description: 'Assign roles to users' },
      { code: 'roles:*', label: 'Full Role Access', description: 'Full role management' },
    ],
  },
  settings: {
    label: 'Settings',
    description: 'System and clinic settings',
    permissions: [
      { code: 'settings:read', label: 'View Settings', description: 'View system settings' },
      { code: 'settings:manage', label: 'Manage Settings', description: 'Modify system settings' },
    ],
  },
  reports: {
    label: 'Reports',
    description: 'Analytics and reporting',
    permissions: [
      { code: 'reports:read', label: 'View Reports', description: 'View reports and analytics' },
      { code: 'reports:create', label: 'Create Reports', description: 'Generate custom reports' },
      { code: 'reports:export', label: 'Export Reports', description: 'Export report data' },
      { code: 'reports:*', label: 'Full Reports Access', description: 'Full reporting access' },
    ],
  },
  communications: {
    label: 'Communications',
    description: 'Messaging and notifications',
    permissions: [
      { code: 'communications:create', label: 'Send Messages', description: 'Send communications' },
      { code: 'communications:read', label: 'View Messages', description: 'View communication logs' },
      { code: 'communications:*', label: 'Full Communications', description: 'Full messaging access' },
    ],
  },
  leads: {
    label: 'Leads',
    description: 'Lead management and conversion',
    permissions: [
      { code: 'leads:create', label: 'Create Leads', description: 'Add new leads' },
      { code: 'leads:read', label: 'View Leads', description: 'View lead information' },
      { code: 'leads:update', label: 'Update Leads', description: 'Modify lead status' },
      { code: 'leads:delete', label: 'Delete Leads', description: 'Remove leads' },
      { code: 'leads:*', label: 'Full Leads Access', description: 'Full lead management' },
    ],
  },
  imaging: {
    label: 'Imaging',
    description: 'X-rays and imaging records',
    permissions: [
      { code: 'imaging:create', label: 'Upload Images', description: 'Upload imaging records' },
      { code: 'imaging:read', label: 'View Images', description: 'View imaging records' },
      { code: 'imaging:update', label: 'Update Images', description: 'Modify imaging records' },
      { code: 'imaging:delete', label: 'Delete Images', description: 'Remove imaging records' },
      { code: 'imaging:*', label: 'Full Imaging Access', description: 'Full imaging management' },
    ],
  },
  lab: {
    label: 'Lab',
    description: 'Lab orders and results',
    permissions: [
      { code: 'lab:create', label: 'Create Lab Orders', description: 'Submit lab orders' },
      { code: 'lab:read', label: 'View Lab Results', description: 'View lab information' },
      { code: 'lab:update', label: 'Update Lab Orders', description: 'Modify lab orders' },
      { code: 'lab:*', label: 'Full Lab Access', description: 'Full lab management' },
    ],
  },
  inventory: {
    label: 'Inventory',
    description: 'Supply and inventory management',
    permissions: [
      { code: 'inventory:read', label: 'View Inventory', description: 'View inventory levels' },
      { code: 'inventory:update', label: 'Update Inventory', description: 'Modify inventory' },
      { code: 'inventory:manage', label: 'Manage Inventory', description: 'Full inventory control' },
    ],
  },
  audit: {
    label: 'Audit',
    description: 'Audit logs and compliance',
    permissions: [
      { code: 'audit:read', label: 'View Audit Logs', description: 'View system audit trail' },
      { code: 'audit:export', label: 'Export Audit Logs', description: 'Export audit data' },
    ],
  },
  compliance: {
    label: 'Compliance',
    description: 'HIPAA and regulatory compliance',
    permissions: [
      { code: 'compliance:read', label: 'View Compliance', description: 'View compliance reports' },
      { code: 'compliance:manage', label: 'Manage Compliance', description: 'Compliance administration' },
    ],
  },
};

/**
 * GET /api/permissions
 * Get all available permissions organized by category
 */
export const GET = withAuth(
  async () => {
    // Flatten permissions for easy lookup
    const allPermissions: Array<{
      code: string;
      label: string;
      description: string;
      category: string;
      categoryLabel: string;
    }> = [];

    for (const [categoryKey, category] of Object.entries(PERMISSION_CATEGORIES)) {
      for (const permission of category.permissions) {
        allPermissions.push({
          ...permission,
          category: categoryKey,
          categoryLabel: category.label,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        categories: PERMISSION_CATEGORIES,
        allPermissions,
      },
    });
  },
  { permissions: ['roles:view', 'roles:edit', 'roles:full'] }
);
