export { SYSTEM_ROLES, CUSTOM_ROLES, getRoleByCode, type RoleCode } from './roles.fixture';

export {
  PERMISSION_RESOURCES,
  PERMISSION_ACTIONS,
  ROLE_PERMISSIONS,
  getPermissionsForRole,
  generateAllPermissions,
  type PermissionResource,
  type PermissionAction,
} from './permissions.fixture';

export {
  APPOINTMENT_TYPES,
  TREATMENT_TYPES,
  BRACKET_SYSTEMS,
  WIRE_PROGRESSIONS,
  CDT_PROCEDURE_CODES,
  CHIEF_COMPLAINTS,
  INSURANCE_PROVIDERS,
  REFERRAL_SOURCES,
} from './ortho-data.fixture';

export {
  EQUIPMENT_TYPES,
  SUPPLIERS,
  SAMPLE_EQUIPMENT,
  MAINTENANCE_SCHEDULES,
  DEPRECIATION_SETTINGS,
  type EquipmentTypeFixture,
  type SupplierFixture,
  type SampleEquipment,
  type MaintenanceScheduleTemplate,
  type DepreciationSetting,
} from './equipment.fixture';

export {
  SAMPLE_ROOMS,
  SAMPLE_CHAIRS,
  ROOM_CAPABILITIES,
} from './rooms.fixture';

export {
  SAMPLE_INSTRUMENT_SETS,
  CYCLE_PARAMETERS,
  BI_BRANDS,
  BI_READER_TYPES,
  COMPLIANCE_LOG_TEMPLATES,
  CHEMICAL_INDICATOR_INFO,
  generateBILotNumber,
  getCycleParameters,
  getRandomBIBrand,
  getRandomBIReader,
  type InstrumentSetFixture,
  type CycleParameters,
  type ComplianceLogTemplate,
} from './sterilization.fixture';

export {
  INVENTORY_ITEMS,
  INVENTORY_SUPPLIERS,
  type InventoryItemFixture,
  type InventorySupplierFixture,
} from './inventory.fixture';

export {
  LAB_VENDORS,
  LAB_PRODUCTS,
  INSPECTION_CHECKLIST_ITEMS,
  REMAKE_REASONS,
  SHIPPING_CARRIERS,
  ORDER_STATUSES,
  WARRANTY_PERIODS,
  ATTACHMENT_TYPES,
  CONTRACT_TERMS,
  MESSAGE_TEMPLATES,
  generateTrackingNumber,
  getWarrantyEndDate,
  getInspectionChecklist,
  calculateInspectionScore,
  type LabVendorFixture,
  type LabProductFixture,
  type InspectionChecklistItem,
  type RemakeReason,
  type ShippingCarrier,
  type OrderStatus,
  type AttachmentType,
  type ContractTerms,
  type MessageTemplate,
} from './lab.fixture';

export {
  PROCEDURE_TEMPLATES,
  INVOICE_STATUS_DISTRIBUTION,
  PAYMENT_PLAN_TEMPLATES,
  pickRandomInvoiceStatus,
  getRandomProcedures,
  getRandomPaymentPlanTemplate,
  calculateDueDate,
  calculatePlanEndDate,
  generateAccountNumber,
  generateInvoiceNumber,
  generatePlanNumber,
  generateEstimateNumber,
  generateStatementNumber,
  type InvoiceItemData,
  type InvoiceStatusWeight,
  type PaymentPlanTemplate,
} from './billing.fixture';
