/**
 * Orthodontic-specific data generators
 * Generates realistic data for orthodontic practice scenarios
 */

import {
  APPOINTMENT_TYPES,
  TREATMENT_TYPES,
  BRACKET_SYSTEMS,
  CHIEF_COMPLAINTS,
  INSURANCE_PROVIDERS,
  REFERRAL_SOURCES,
} from '../fixtures';

// ============================================================================
// NAME DATA
// ============================================================================

const FIRST_NAMES_CHILD = [
  'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason',
  'Isabella', 'Jacob', 'Mia', 'William', 'Charlotte', 'James', 'Amelia',
  'Benjamin', 'Harper', 'Lucas', 'Evelyn', 'Henry', 'Luna', 'Alexander',
  'Ella', 'Daniel', 'Chloe', 'Michael', 'Penelope', 'Sebastian', 'Layla',
  'Jack', 'Riley', 'Owen', 'Zoey', 'Theodore', 'Nora', 'Aiden', 'Lily',
];

const FIRST_NAMES_ADULT = [
  'Jennifer', 'Michael', 'Sarah', 'David', 'Jessica', 'Christopher',
  'Ashley', 'Matthew', 'Amanda', 'Daniel', 'Stephanie', 'Andrew',
  'Nicole', 'Joshua', 'Elizabeth', 'Ryan', 'Megan', 'Brandon', 'Lauren',
  'Justin', 'Samantha', 'Kevin', 'Rachel', 'Brian', 'Katherine', 'Eric',
  'Michelle', 'Steven', 'Amber', 'Timothy', 'Heather', 'Mark', 'Melissa',
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
  'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson',
  'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee',
  'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez',
  'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright',
  'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams',
];

const STREET_NAMES = [
  'Main', 'Oak', 'Maple', 'Cedar', 'Pine', 'Elm', 'Washington', 'Lake',
  'Hill', 'Park', 'Forest', 'River', 'Spring', 'Valley', 'Sunset',
  'Highland', 'Church', 'School', 'Mill', 'Center', 'North', 'South',
];

const STREET_TYPES = ['St', 'Ave', 'Blvd', 'Dr', 'Ln', 'Ct', 'Way', 'Rd'];

const CITIES = [
  { city: 'Springfield', state: 'IL', zip: '62701' },
  { city: 'Riverside', state: 'CA', zip: '92501' },
  { city: 'Franklin', state: 'TN', zip: '37064' },
  { city: 'Madison', state: 'WI', zip: '53703' },
  { city: 'Georgetown', state: 'TX', zip: '78626' },
  { city: 'Bristol', state: 'CT', zip: '06010' },
  { city: 'Fairfield', state: 'OH', zip: '45014' },
  { city: 'Salem', state: 'OR', zip: '97301' },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function randomItem<T>(array: readonly T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 1): number {
  const value = Math.random() * (max - min) + min;
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

// ============================================================================
// GENERATORS
// ============================================================================

export const orthoGenerator = {
  /**
   * Generate a patient age weighted toward orthodontic demographics
   * 70% children/teens (8-18), 30% adults (19-55)
   */
  patientAge(): number {
    const isChild = Math.random() < 0.7;
    if (isChild) {
      return randomInt(8, 18);
    }
    return randomInt(19, 55);
  },

  /**
   * Generate patient name based on age
   */
  patientName(age?: number): { firstName: string; lastName: string } {
    const actualAge = age ?? this.patientAge();
    const isChild = actualAge < 18;
    const firstNames = isChild ? FIRST_NAMES_CHILD : FIRST_NAMES_ADULT;
    return {
      firstName: randomItem(firstNames),
      lastName: randomItem(LAST_NAMES),
    };
  },

  /**
   * Generate date of birth for a given age
   */
  dateOfBirth(age: number): Date {
    const today = new Date();
    const year = today.getFullYear() - age;
    const month = randomInt(0, 11);
    const day = randomInt(1, 28);
    return new Date(year, month, day);
  },

  /**
   * Generate a complete patient profile
   */
  patientProfile() {
    const age = this.patientAge();
    const { firstName, lastName } = this.patientName(age);
    const dob = this.dateOfBirth(age);
    const gender = Math.random() < 0.5 ? 'male' : 'female';

    return {
      firstName,
      lastName,
      dateOfBirth: dob,
      age,
      gender,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomInt(1, 999)}@example.com`,
      phone: this.phoneNumber(),
      address: this.address(),
    };
  },

  /**
   * Generate a US phone number
   */
  phoneNumber(): string {
    const areaCode = randomInt(200, 999);
    const prefix = randomInt(200, 999);
    const line = randomInt(1000, 9999);
    return `(${areaCode}) ${prefix}-${line}`;
  },

  /**
   * Generate a US address
   */
  address(): {
    street: string;
    city: string;
    state: string;
    zip: string;
  } {
    const streetNumber = randomInt(100, 9999);
    const streetName = randomItem(STREET_NAMES);
    const streetType = randomItem(STREET_TYPES);
    const location = randomItem(CITIES);

    return {
      street: `${streetNumber} ${streetName} ${streetType}`,
      city: location.city,
      state: location.state,
      zip: location.zip,
    };
  },

  /**
   * Generate chief complaint
   */
  chiefComplaint(): string {
    return randomItem(CHIEF_COMPLAINTS);
  },

  /**
   * Generate multiple chief complaints
   */
  chiefComplaints(count = 2): string[] {
    const complaints: string[] = [];
    const available = [...CHIEF_COMPLAINTS];

    for (let i = 0; i < count && available.length > 0; i++) {
      const index = randomInt(0, available.length - 1);
      complaints.push(available[index]);
      available.splice(index, 1);
    }

    return complaints;
  },

  /**
   * Generate treatment type
   */
  treatmentType() {
    return randomItem(TREATMENT_TYPES);
  },

  /**
   * Generate treatment duration based on type (in months)
   */
  treatmentDuration(treatmentTypeCode?: string): number {
    const type = treatmentTypeCode
      ? TREATMENT_TYPES.find((t) => t.code === treatmentTypeCode)
      : this.treatmentType();

    if (!type) return 24;

    const variance = Math.floor(type.typicalDurationMonths * 0.25);
    return randomInt(
      type.typicalDurationMonths - variance,
      type.typicalDurationMonths + variance
    );
  },

  /**
   * Generate treatment fee based on type
   */
  treatmentFee(treatmentTypeCode?: string): number {
    const type = treatmentTypeCode
      ? TREATMENT_TYPES.find((t) => t.code === treatmentTypeCode)
      : this.treatmentType();

    if (!type) return 5500;

    const fee = randomInt(type.minFee, type.maxFee);
    return Math.round(fee / 100) * 100; // Round to nearest $100
  },

  /**
   * Generate appointment time during business hours
   */
  appointmentTime(date: Date): Date {
    const hour = randomInt(8, 17); // 8 AM - 5 PM
    const minute = randomItem([0, 15, 30, 45]);
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      hour,
      minute
    );
  },

  /**
   * Generate a future appointment date (within next 6 months)
   */
  futureAppointmentDate(): Date {
    const today = new Date();
    const daysAhead = randomInt(1, 180);
    const date = new Date(today);
    date.setDate(date.getDate() + daysAhead);

    // Skip weekends
    while (date.getDay() === 0 || date.getDay() === 6) {
      date.setDate(date.getDate() + 1);
    }

    return this.appointmentTime(date);
  },

  /**
   * Generate a past appointment date (within last 2 years)
   */
  pastAppointmentDate(): Date {
    const today = new Date();
    const daysAgo = randomInt(1, 730);
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);

    // Skip weekends
    while (date.getDay() === 0 || date.getDay() === 6) {
      date.setDate(date.getDate() - 1);
    }

    return this.appointmentTime(date);
  },

  /**
   * Generate appointment type
   */
  appointmentType() {
    return randomItem(APPOINTMENT_TYPES);
  },

  /**
   * Generate clinical measurements
   */
  clinicalMeasurements(): {
    overjet: number;
    overbite: number;
    crowdingUpper: number;
    crowdingLower: number;
    spacing: number;
    midlineDeviation: number;
  } {
    return {
      overjet: randomFloat(1, 10),
      overbite: randomFloat(-5, 100), // Can be negative for open bite
      crowdingUpper: randomFloat(0, 12),
      crowdingLower: randomFloat(0, 12),
      spacing: randomFloat(0, 8),
      midlineDeviation: randomFloat(0, 4),
    };
  },

  /**
   * Generate insurance information
   */
  insuranceInfo(): {
    provider: (typeof INSURANCE_PROVIDERS)[number];
    groupNumber: string;
    memberId: string;
    maxBenefit: number;
    usedBenefit: number;
    remainingBenefit: number;
  } {
    const provider = randomItem(INSURANCE_PROVIDERS);
    const maxBenefit = provider.orthoMaxBenefit;
    const usedBenefit = randomInt(0, maxBenefit);

    return {
      provider,
      groupNumber: `GRP${randomInt(100000, 999999)}`,
      memberId: `MEM${randomInt(1000000, 9999999)}`,
      maxBenefit,
      usedBenefit,
      remainingBenefit: maxBenefit - usedBenefit,
    };
  },

  /**
   * Generate bracket system
   */
  bracketSystem() {
    return randomItem(BRACKET_SYSTEMS);
  },

  /**
   * Generate referral source
   */
  referralSource() {
    return randomItem(REFERRAL_SOURCES);
  },

  /**
   * Generate a referring dentist name
   */
  referringDentist(): {
    name: string;
    practice: string;
    phone: string;
  } {
    const firstName = randomItem(FIRST_NAMES_ADULT);
    const lastName = randomItem(LAST_NAMES);
    const suffix = randomItem(['DDS', 'DMD']);

    return {
      name: `Dr. ${firstName} ${lastName}, ${suffix}`,
      practice: `${lastName} Family Dentistry`,
      phone: this.phoneNumber(),
    };
  },

  /**
   * Generate patient number
   */
  patientNumber(): string {
    return `P-${randomInt(10000, 99999)}`;
  },

  /**
   * Generate treatment start date (past)
   */
  treatmentStartDate(): Date {
    const monthsAgo = randomInt(1, 24);
    const date = new Date();
    date.setMonth(date.getMonth() - monthsAgo);
    return date;
  },

  /**
   * Generate estimated treatment end date
   */
  treatmentEndDate(startDate: Date, durationMonths: number): Date {
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + durationMonths);
    return endDate;
  },

  /**
   * Generate progress note content
   */
  progressNoteContent(): string {
    const notes = [
      'Patient tolerating treatment well. Wire change performed.',
      'Adjusted wire. Patient reports no discomfort. Good oral hygiene.',
      'Upper wire change. Powerchain placed from 3-3.',
      'Lower wire change. Patient compliance improving.',
      'Checked aligner tracking. IPR performed on lower anteriors.',
      'Bonded brackets #7, #10. Patient given wax for comfort.',
      'Adjustment completed. Patient reminded about rubber band wear.',
      'Treatment progressing well. Spaces closing as expected.',
      'Minor crowding remaining. Continue with current mechanics.',
      'Crossbite corrected. Begin preparation for debond.',
    ];

    return randomItem(notes);
  },
};

export default orthoGenerator;
