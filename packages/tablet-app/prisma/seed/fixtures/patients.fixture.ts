/**
 * Patient fixture data for seeding
 *
 * NOTE: This is a TEMPORARY basic patient seeder for testing booking functionality.
 * When the Patient Management area is implemented, this file should be:
 * 1. Moved to the patients area seeder
 * 2. Updated with full patient data (address, insurance, medical history, etc.)
 * 3. Integrated with the patient management module
 *
 * @see docs/areas/patients/README.md (when created)
 */

export interface PatientData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
}

/**
 * Base sample patients for development/testing
 * Using realistic orthodontic patient demographics
 */
const BASE_PATIENTS: PatientData[] = [
  // Children/Teens (typical ortho patients)
  {
    firstName: 'Emma',
    lastName: 'Thompson',
    email: 'emma.parent@example.com',
    phone: '(555) 123-4001',
    dateOfBirth: new Date('2012-03-15'),
  },
  {
    firstName: 'Liam',
    lastName: 'Rodriguez',
    email: 'rodriguez.family@example.com',
    phone: '(555) 123-4002',
    dateOfBirth: new Date('2010-07-22'),
  },
  {
    firstName: 'Sophia',
    lastName: 'Chen',
    email: 'chen.sophia@example.com',
    phone: '(555) 123-4003',
    dateOfBirth: new Date('2011-11-08'),
  },
  {
    firstName: 'Noah',
    lastName: 'Williams',
    email: 'williams.noah@example.com',
    phone: '(555) 123-4004',
    dateOfBirth: new Date('2009-05-30'),
  },
  {
    firstName: 'Olivia',
    lastName: 'Martinez',
    email: 'martinez.olivia@example.com',
    phone: '(555) 123-4005',
    dateOfBirth: new Date('2013-01-12'),
  },
  {
    firstName: 'Ethan',
    lastName: 'Brown',
    email: 'brown.family@example.com',
    phone: '(555) 123-4006',
    dateOfBirth: new Date('2008-09-25'),
  },
  {
    firstName: 'Ava',
    lastName: 'Davis',
    email: 'davis.ava@example.com',
    phone: '(555) 123-4007',
    dateOfBirth: new Date('2014-06-18'),
  },
  {
    firstName: 'Mason',
    lastName: 'Garcia',
    email: 'garcia.mason@example.com',
    phone: '(555) 123-4008',
    dateOfBirth: new Date('2010-12-03'),
  },
  // Young Adults (Invisalign demographic)
  {
    firstName: 'Isabella',
    lastName: 'Wilson',
    email: 'isabella.wilson@example.com',
    phone: '(555) 123-4009',
    dateOfBirth: new Date('2000-04-14'),
  },
  {
    firstName: 'James',
    lastName: 'Anderson',
    email: 'james.anderson@example.com',
    phone: '(555) 123-4010',
    dateOfBirth: new Date('1998-08-07'),
  },
  {
    firstName: 'Mia',
    lastName: 'Taylor',
    email: 'mia.taylor@example.com',
    phone: '(555) 123-4011',
    dateOfBirth: new Date('2001-02-28'),
  },
  {
    firstName: 'Alexander',
    lastName: 'Thomas',
    email: 'alex.thomas@example.com',
    phone: '(555) 123-4012',
    dateOfBirth: new Date('1999-10-19'),
  },
  // Adults
  {
    firstName: 'Charlotte',
    lastName: 'Jackson',
    email: 'charlotte.jackson@example.com',
    phone: '(555) 123-4013',
    dateOfBirth: new Date('1985-07-11'),
  },
  {
    firstName: 'Benjamin',
    lastName: 'White',
    email: 'ben.white@example.com',
    phone: '(555) 123-4014',
    dateOfBirth: new Date('1990-03-25'),
  },
  {
    firstName: 'Amelia',
    lastName: 'Harris',
    email: 'amelia.harris@example.com',
    phone: '(555) 123-4015',
    dateOfBirth: new Date('1988-11-02'),
  },
  // More teens
  {
    firstName: 'Lucas',
    lastName: 'Clark',
    email: 'clark.family@example.com',
    phone: '(555) 123-4016',
    dateOfBirth: new Date('2011-08-14'),
  },
  {
    firstName: 'Harper',
    lastName: 'Lewis',
    email: 'lewis.harper@example.com',
    phone: '(555) 123-4017',
    dateOfBirth: new Date('2012-05-07'),
  },
  {
    firstName: 'Henry',
    lastName: 'Robinson',
    email: 'robinson.family@example.com',
    phone: '(555) 123-4018',
    dateOfBirth: new Date('2009-12-21'),
  },
  {
    firstName: 'Evelyn',
    lastName: 'Walker',
    email: 'walker.evelyn@example.com',
    phone: '(555) 123-4019',
    dateOfBirth: new Date('2010-09-09'),
  },
  {
    firstName: 'Sebastian',
    lastName: 'Hall',
    email: 'hall.sebastian@example.com',
    phone: '(555) 123-4020',
    dateOfBirth: new Date('2013-04-16'),
  },
];

/**
 * Additional patient names for generating more patients per clinic.
 * These will be combined with clinic-specific email suffixes.
 */
const ADDITIONAL_NAMES: Array<{ firstName: string; lastName: string }> = [
  { firstName: 'Zoe', lastName: 'King' },
  { firstName: 'Daniel', lastName: 'Scott' },
  { firstName: 'Lily', lastName: 'Green' },
  { firstName: 'Jack', lastName: 'Baker' },
  { firstName: 'Grace', lastName: 'Adams' },
  { firstName: 'Owen', lastName: 'Nelson' },
  { firstName: 'Chloe', lastName: 'Carter' },
  { firstName: 'Logan', lastName: 'Mitchell' },
  { firstName: 'Aria', lastName: 'Perez' },
  { firstName: 'Aiden', lastName: 'Roberts' },
  { firstName: 'Riley', lastName: 'Turner' },
  { firstName: 'Jayden', lastName: 'Phillips' },
  { firstName: 'Scarlett', lastName: 'Campbell' },
  { firstName: 'Carter', lastName: 'Parker' },
  { firstName: 'Madison', lastName: 'Evans' },
  { firstName: 'Grayson', lastName: 'Edwards' },
  { firstName: 'Layla', lastName: 'Collins' },
  { firstName: 'Luke', lastName: 'Stewart' },
  { firstName: 'Penelope', lastName: 'Sanchez' },
  { firstName: 'Levi', lastName: 'Morris' },
  { firstName: 'Nora', lastName: 'Rogers' },
  { firstName: 'Isaac', lastName: 'Reed' },
  { firstName: 'Zoey', lastName: 'Cook' },
  { firstName: 'Lincoln', lastName: 'Morgan' },
  { firstName: 'Hannah', lastName: 'Bell' },
  { firstName: 'Asher', lastName: 'Murphy' },
  { firstName: 'Addison', lastName: 'Bailey' },
  { firstName: 'Leo', lastName: 'Rivera' },
  { firstName: 'Eleanor', lastName: 'Cooper' },
  { firstName: 'Mateo', lastName: 'Richardson' },
];

/**
 * Generate a random date of birth for different age groups
 */
function generateDateOfBirth(ageGroup: 'child' | 'teen' | 'youngAdult' | 'adult'): Date {
  const now = new Date();
  const year = now.getFullYear();

  switch (ageGroup) {
    case 'child':
      // 7-12 years old
      return new Date(year - 7 - Math.floor(Math.random() * 5), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
    case 'teen':
      // 13-17 years old
      return new Date(year - 13 - Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
    case 'youngAdult':
      // 18-25 years old
      return new Date(year - 18 - Math.floor(Math.random() * 7), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
    case 'adult':
      // 26-45 years old
      return new Date(year - 26 - Math.floor(Math.random() * 19), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
  }
}

/**
 * Generate patients for a specific clinic.
 * Each clinic gets unique patients with clinic-specific email suffixes.
 *
 * @param clinicIndex - The index of the clinic (0, 1, 2, etc.)
 * @param count - Number of patients to generate
 * @returns Array of patient data for the clinic
 */
export function generatePatientsForClinic(clinicIndex: number, count: number): PatientData[] {
  const patients: PatientData[] = [];
  const clinicSuffix = clinicIndex === 0 ? '' : `-clinic${clinicIndex + 1}`;
  const phonePrefix = `(555) ${100 + clinicIndex}`;

  // First, use base patients (with clinic-specific modifications)
  const basePatientsToUse = Math.min(count, BASE_PATIENTS.length);
  for (let i = 0; i < basePatientsToUse; i++) {
    const base = BASE_PATIENTS[i];
    // Make email unique per clinic
    const emailParts = base.email.split('@');
    patients.push({
      firstName: base.firstName,
      lastName: base.lastName,
      email: `${emailParts[0]}${clinicSuffix}@${emailParts[1]}`,
      phone: `${phonePrefix}-${4000 + i + 1}`,
      dateOfBirth: base.dateOfBirth,
    });
  }

  // If we need more patients, generate from additional names
  if (count > BASE_PATIENTS.length) {
    const additionalCount = Math.min(count - BASE_PATIENTS.length, ADDITIONAL_NAMES.length);
    const ageGroups: Array<'child' | 'teen' | 'youngAdult' | 'adult'> = ['child', 'teen', 'youngAdult', 'adult'];

    for (let i = 0; i < additionalCount; i++) {
      const name = ADDITIONAL_NAMES[i];
      const ageGroup = ageGroups[i % ageGroups.length];
      const emailBase = `${name.firstName.toLowerCase()}.${name.lastName.toLowerCase()}`;

      patients.push({
        firstName: name.firstName,
        lastName: name.lastName,
        email: `${emailBase}${clinicSuffix}@example.com`,
        phone: `${phonePrefix}-${5000 + i + 1}`,
        dateOfBirth: generateDateOfBirth(ageGroup),
      });
    }
  }

  return patients;
}

/**
 * Legacy export for backward compatibility.
 * Use generatePatientsForClinic() for multi-clinic support.
 * @deprecated Use generatePatientsForClinic() instead
 */
export const SAMPLE_PATIENTS = BASE_PATIENTS;
