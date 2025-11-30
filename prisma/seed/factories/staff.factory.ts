import type { Prisma, StaffProfile, Credential, Certification, EmergencyContact } from '@prisma/client';
import { BaseFactory } from './base.factory';
import type { FactoryContext, FactoryOptions } from '../types';
import { orthoGenerator } from '../generators';

// ============================================================================
// STAFF-SPECIFIC DATA
// ============================================================================

const DEPARTMENTS = ['Clinical', 'Front Office', 'Billing', 'Administration', 'Lab'];

const JOB_TITLES: Record<string, string[]> = {
  ORTHODONTIST: ['Orthodontist', 'Lead Orthodontist', 'Senior Orthodontist', 'Associate Orthodontist'],
  GENERAL_DENTIST: ['General Dentist', 'Associate Dentist'],
  HYGIENIST: ['Dental Hygienist', 'Lead Hygienist', 'Senior Hygienist'],
  DENTAL_ASSISTANT: ['Dental Assistant', 'Lead Dental Assistant', 'Senior Dental Assistant', 'Chairside Assistant'],
  EFDA: ['EFDA', 'Expanded Functions Dental Auxiliary'],
  OTHER: ['Treatment Coordinator', 'Patient Coordinator', 'Office Manager', 'Billing Specialist', 'Receptionist', 'Scheduling Coordinator'],
};

const CREDENTIAL_TYPES = [
  { type: 'STATE_LICENSE', name: 'State Dental License', authority: 'State Dental Board' },
  { type: 'DEA_REGISTRATION', name: 'DEA Registration', authority: 'Drug Enforcement Administration' },
  { type: 'NPI', name: 'National Provider Identifier', authority: 'CMS' },
  { type: 'BOARD_CERTIFICATION', name: 'Board Certification in Orthodontics', authority: 'American Board of Orthodontics' },
  { type: 'RADIOLOGY_LICENSE', name: 'Dental Radiology License', authority: 'State Radiation Control' },
];

const CERTIFICATION_TYPES = [
  { type: 'CPR_BLS', name: 'CPR/BLS Certification', org: 'American Heart Association' },
  { type: 'INVISALIGN', name: 'Invisalign Certified Provider', org: 'Align Technology' },
  { type: 'SURESMILE', name: 'SureSmile Certified', org: 'Dentsply Sirona' },
  { type: 'DAMON', name: 'Damon System Certified', org: 'Ormco Corporation' },
  { type: 'HIPAA', name: 'HIPAA Compliance Training', org: 'Healthcare Compliance Association' },
  { type: 'OSHA', name: 'OSHA Safety Training', org: 'OSHA Training Institute' },
  { type: 'INFECTION_CONTROL', name: 'Infection Control Certification', org: 'OSAP' },
  { type: 'NITROUS_OXIDE', name: 'Nitrous Oxide/Oxygen Sedation', org: 'State Dental Board' },
  { type: 'RADIOLOGY', name: 'Dental Radiology Certification', org: 'DANB' },
];

const RELATIONSHIPS = ['Spouse', 'Parent', 'Sibling', 'Child', 'Partner', 'Friend'];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function randomItem<T>(array: readonly T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateEmployeeNumber(index: number): string {
  return `EMP${String(index + 1000).padStart(5, '0')}`;
}

function generateNPI(): string {
  // Generate a valid NPI with correct Luhn checksum
  const prefix = '180840'; // NPI prefix for Luhn check
  const base = String(randomInt(1000000, 9999999));

  // Calculate Luhn check digit
  const digits = (prefix + base).split('').map(Number);
  let sum = 0;
  let alternate = true;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = digits[i];
    if (alternate) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    alternate = !alternate;
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  return base + checkDigit;
}

function generateDEA(): string {
  // DEA format: 2 letters + 6 digits + 1 check digit
  const letters = 'ABCDEFGHJKLMNPRSTUVWXYZ';
  const firstLetter = randomItem(['A', 'B', 'F', 'G', 'M', 'P', 'R']); // Registrant type
  const secondLetter = letters[randomInt(0, letters.length - 1)]; // First letter of last name
  const sixDigits = String(randomInt(100000, 999999));

  // Calculate check digit
  const digits = sixDigits.split('').map(Number);
  const sum1 = digits[0] + digits[2] + digits[4];
  const sum2 = (digits[1] + digits[3] + digits[5]) * 2;
  const checkDigit = (sum1 + sum2) % 10;

  return `${firstLetter}${secondLetter}${sixDigits}${checkDigit}`;
}

function generateLicenseNumber(state: string): string {
  return `${state}${randomInt(10000, 99999)}`;
}

function generateFutureDate(minDays: number, maxDays: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + randomInt(minDays, maxDays));
  return date;
}

function generatePastDate(minDays: number, maxDays: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - randomInt(minDays, maxDays));
  return date;
}

// ============================================================================
// STAFF FACTORY
// ============================================================================

type StaffCreateInput = Prisma.StaffProfileCreateInput;

export class StaffFactory extends BaseFactory<StaffCreateInput, StaffProfile> {
  private employeeCounter = 0;

  constructor(ctx: FactoryContext) {
    super(ctx);
    this.registerDefaultTraits();
  }

  private registerDefaultTraits() {
    this.registerTraits({
      provider: {
        isProvider: true,
        providerType: 'ORTHODONTIST',
      },
      orthodontist: {
        isProvider: true,
        providerType: 'ORTHODONTIST',
        department: 'Clinical',
      },
      hygienist: {
        isProvider: true,
        providerType: 'HYGIENIST',
        department: 'Clinical',
      },
      assistant: {
        isProvider: false,
        providerType: 'DENTAL_ASSISTANT',
        department: 'Clinical',
      },
      frontOffice: {
        isProvider: false,
        department: 'Front Office',
      },
      billing: {
        isProvider: false,
        department: 'Billing',
      },
      fullTime: {
        employmentType: 'FULL_TIME',
      },
      partTime: {
        employmentType: 'PART_TIME',
      },
      onLeave: {
        status: 'ON_LEAVE',
      },
      terminated: {
        status: 'TERMINATED',
        terminationDate: new Date(),
      },
    });
  }

  /**
   * Build staff data. IMPORTANT: userId must be provided in options.overrides
   * as it's a required field that links to a User account.
   */
  build(options?: FactoryOptions<StaffCreateInput>): StaffCreateInput {
    // userId is required - must be provided via overrides
    if (!options?.overrides?.userId) {
      throw new Error('StaffFactory.build requires userId in options.overrides');
    }

    const age = randomInt(25, 60);
    const { firstName, lastName } = orthoGenerator.patientName(age);
    const address = orthoGenerator.address();
    const isProvider = Math.random() < 0.3; // 30% are providers
    const providerType = isProvider
      ? randomItem(['ORTHODONTIST', 'HYGIENIST', 'DENTAL_ASSISTANT', 'EFDA'] as const)
      : null;

    const titleOptions = isProvider && providerType
      ? (JOB_TITLES[providerType] || JOB_TITLES.OTHER)
      : JOB_TITLES.OTHER;

    const hireDate = generatePastDate(30, 365 * 10); // Hired between 30 days and 10 years ago

    const base: StaffCreateInput = {
      userId: options.overrides.userId as string,
      employeeNumber: generateEmployeeNumber(this.employeeCounter++),
      firstName,
      lastName,
      preferredName: Math.random() < 0.2 ? randomItem(['Mike', 'Beth', 'Sam', 'Alex', 'Chris', 'Pat']) : null,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@clinic.local`,
      phone: orthoGenerator.phoneNumber(),
      mobilePhone: Math.random() < 0.8 ? orthoGenerator.phoneNumber() : null,
      dateOfBirth: orthoGenerator.dateOfBirth(age),
      address: address.street,
      city: address.city,
      state: address.state,
      postalCode: address.zip,
      country: 'US',
      employmentType: randomItem(['FULL_TIME', 'FULL_TIME', 'FULL_TIME', 'PART_TIME', 'CONTRACT'] as const),
      status: randomItem(['ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'ON_LEAVE'] as const),
      hireDate,
      department: randomItem(DEPARTMENTS),
      title: randomItem(titleOptions),
      isProvider,
      providerType,
      npiNumber: isProvider ? generateNPI() : null,
      deaNumber: isProvider && providerType === 'ORTHODONTIST' ? generateDEA() : null,
      stateLicenseNumber: isProvider ? generateLicenseNumber(address.state) : null,
      clinicId: this.clinicId,
      clinicIds: [this.clinicId],
      deletedAt: null, // Explicitly set for MongoDB compatibility
      createdBy: this.createdBy,
      updatedBy: this.createdBy,
    };

    return this.mergeOptions(base, options);
  }

  async create(options?: FactoryOptions<StaffCreateInput>): Promise<StaffProfile> {
    const data = this.build(options);

    const staff = await this.db.staffProfile.create({
      data,
    });

    this.idTracker.add('StaffProfile', staff.id, this.clinicId);
    return staff;
  }

  /**
   * Create a staff member with credentials
   */
  async createWithCredentials(
    credentialCount = 2,
    options?: FactoryOptions<StaffCreateInput>
  ): Promise<StaffProfile & { credentials: Credential[] }> {
    // Ensure this is a provider
    const staff = await this.create({
      ...options,
      traits: [...(options?.traits || []), 'provider'],
    });

    const credentials: Credential[] = [];
    const usedTypes = new Set<string>();

    for (let i = 0; i < credentialCount; i++) {
      let credType = randomItem(CREDENTIAL_TYPES);
      // Avoid duplicates
      while (usedTypes.has(credType.type) && usedTypes.size < CREDENTIAL_TYPES.length) {
        credType = randomItem(CREDENTIAL_TYPES);
      }
      usedTypes.add(credType.type);

      const issueDate = generatePastDate(365, 365 * 5);
      const expirationDate = generateFutureDate(30, 365 * 2);

      const credential = await this.db.credential.create({
        data: {
          staffProfileId: staff.id,
          type: credType.type as Prisma.CredentialCreateInput['type'],
          name: credType.name,
          number: `${credType.type.substring(0, 3)}${randomInt(100000, 999999)}`,
          issuingAuthority: credType.authority,
          issuingState: staff.state,
          issueDate,
          expirationDate,
          status: 'ACTIVE',
          clinicId: this.clinicId,
          createdBy: this.createdBy,
          updatedBy: this.createdBy,
        },
      });

      credentials.push(credential);
      this.idTracker.add('Credential', credential.id, this.clinicId);
    }

    return { ...staff, credentials };
  }

  /**
   * Create a staff member with certifications
   */
  async createWithCertifications(
    certificationCount = 3,
    options?: FactoryOptions<StaffCreateInput>
  ): Promise<StaffProfile & { certifications: Certification[] }> {
    const staff = await this.create(options);

    const certifications: Certification[] = [];
    const usedTypes = new Set<string>();

    for (let i = 0; i < certificationCount; i++) {
      let certType = randomItem(CERTIFICATION_TYPES);
      // Avoid duplicates
      while (usedTypes.has(certType.type) && usedTypes.size < CERTIFICATION_TYPES.length) {
        certType = randomItem(CERTIFICATION_TYPES);
      }
      usedTypes.add(certType.type);

      const issueDate = generatePastDate(30, 365 * 3);
      const expirationDate = certType.type === 'CPR_BLS'
        ? generateFutureDate(30, 365) // CPR expires yearly
        : generateFutureDate(365, 365 * 3);

      const certification = await this.db.certification.create({
        data: {
          staffProfileId: staff.id,
          type: certType.type as Prisma.CertificationCreateInput['type'],
          name: certType.name,
          issuingOrganization: certType.org,
          issueDate,
          expirationDate,
          status: 'ACTIVE',
          level: Math.random() < 0.3 ? randomItem(['Gold', 'Platinum', 'Premier']) : null,
          clinicId: this.clinicId,
          createdBy: this.createdBy,
          updatedBy: this.createdBy,
        },
      });

      certifications.push(certification);
      this.idTracker.add('Certification', certification.id, this.clinicId);
    }

    return { ...staff, certifications };
  }

  /**
   * Create a staff member with emergency contacts
   */
  async createWithEmergencyContacts(
    contactCount = 2,
    options?: FactoryOptions<StaffCreateInput>
  ): Promise<StaffProfile & { emergencyContacts: EmergencyContact[] }> {
    const staff = await this.create(options);

    const emergencyContacts: EmergencyContact[] = [];

    for (let i = 0; i < contactCount; i++) {
      const { firstName, lastName } = orthoGenerator.patientName(randomInt(30, 65));

      const contact = await this.db.emergencyContact.create({
        data: {
          staffProfileId: staff.id,
          name: `${firstName} ${lastName}`,
          relationship: randomItem(RELATIONSHIPS),
          phone: orthoGenerator.phoneNumber(),
          alternatePhone: Math.random() < 0.5 ? orthoGenerator.phoneNumber() : null,
          email: Math.random() < 0.7 ? `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com` : null,
          isPrimary: i === 0, // First contact is primary
          clinicId: this.clinicId,
        },
      });

      emergencyContacts.push(contact);
      this.idTracker.add('EmergencyContact', contact.id, this.clinicId);
    }

    return { ...staff, emergencyContacts };
  }

  /**
   * Create a complete staff member with all related data
   */
  async createComplete(options?: FactoryOptions<StaffCreateInput>): Promise<StaffProfile> {
    const isProvider = options?.traits?.includes('provider') ||
                       options?.traits?.includes('orthodontist') ||
                       options?.overrides?.isProvider === true ||
                       Math.random() < 0.3;

    const traits = options?.traits || [];
    if (isProvider && !traits.includes('provider')) {
      traits.push('provider');
    }

    const staff = await this.create({ ...options, traits });

    // Add credentials for providers
    if (staff.isProvider) {
      const credCount = randomInt(2, 4);
      const usedCredTypes = new Set<string>();

      for (let i = 0; i < credCount; i++) {
        let credType = randomItem(CREDENTIAL_TYPES);
        while (usedCredTypes.has(credType.type) && usedCredTypes.size < CREDENTIAL_TYPES.length) {
          credType = randomItem(CREDENTIAL_TYPES);
        }
        usedCredTypes.add(credType.type);

        const issueDate = generatePastDate(365, 365 * 5);
        const expirationDate = generateFutureDate(30, 365 * 2);

        await this.db.credential.create({
          data: {
            staffProfileId: staff.id,
            type: credType.type as Prisma.CredentialCreateInput['type'],
            name: credType.name,
            number: `${credType.type.substring(0, 3)}${randomInt(100000, 999999)}`,
            issuingAuthority: credType.authority,
            issuingState: staff.state,
            issueDate,
            expirationDate,
            status: 'ACTIVE',
            clinicId: this.clinicId,
            createdBy: this.createdBy,
            updatedBy: this.createdBy,
          },
        });
      }
    }

    // Add certifications for all staff
    const certCount = randomInt(2, 5);
    const usedCertTypes = new Set<string>();

    for (let i = 0; i < certCount; i++) {
      let certType = randomItem(CERTIFICATION_TYPES);
      while (usedCertTypes.has(certType.type) && usedCertTypes.size < CERTIFICATION_TYPES.length) {
        certType = randomItem(CERTIFICATION_TYPES);
      }
      usedCertTypes.add(certType.type);

      const issueDate = generatePastDate(30, 365 * 3);
      const expirationDate = certType.type === 'CPR_BLS'
        ? generateFutureDate(30, 365)
        : generateFutureDate(365, 365 * 3);

      await this.db.certification.create({
        data: {
          staffProfileId: staff.id,
          type: certType.type as Prisma.CertificationCreateInput['type'],
          name: certType.name,
          issuingOrganization: certType.org,
          issueDate,
          expirationDate,
          status: 'ACTIVE',
          clinicId: this.clinicId,
          createdBy: this.createdBy,
          updatedBy: this.createdBy,
        },
      });
    }

    // Add emergency contacts
    const contactCount = randomInt(1, 2);
    for (let i = 0; i < contactCount; i++) {
      const { firstName, lastName } = orthoGenerator.patientName(randomInt(30, 65));

      await this.db.emergencyContact.create({
        data: {
          staffProfileId: staff.id,
          name: `${firstName} ${lastName}`,
          relationship: randomItem(RELATIONSHIPS),
          phone: orthoGenerator.phoneNumber(),
          isPrimary: i === 0,
          clinicId: this.clinicId,
        },
      });
    }

    return staff;
  }
}

/**
 * Create a staff factory for the given context
 */
export function createStaffFactory(ctx: FactoryContext): StaffFactory {
  return new StaffFactory(ctx);
}
