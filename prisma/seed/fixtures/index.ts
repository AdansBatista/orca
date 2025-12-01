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
