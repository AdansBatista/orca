/**
 * Fake Data Generator for PHI Fogging
 * 
 * Generates realistic-looking fake data for demo mode.
 */

const fakeNames = [
	'John Smith', 'Jane Doe', 'Michael Johnson', 'Emily Davis',
	'Robert Brown', 'Sarah Wilson', 'David Martinez', 'Lisa Anderson',
	'James Taylor', 'Mary Thomas', 'William Garcia', 'Patricia Rodriguez',
];

const fakeEmails = [
	'patient@example.com', 'user@demo.com', 'contact@sample.org',
	'demo@test.com', 'example@mail.com', 'sample@email.com',
];

const fakePhones = [
	'(555) 123-4567', '(555) 234-5678', '(555) 345-6789',
	'(555) 456-7890', '(555) 567-8901', '(555) 678-9012',
];

const fakeAddresses = [
	'123 Main St, Anytown, ST 12345',
	'456 Oak Ave, Somewhere, ST 23456',
	'789 Pine Rd, Nowhere, ST 34567',
	'321 Elm Dr, Anywhere, ST 45678',
];

const fakeSSNs = [
	'***-**-1234', '***-**-5678', '***-**-9012',
	'***-**-3456', '***-**-7890', '***-**-2345',
];

/**
 * Get a random fake name
 */
export function getFakeName(): string {
	return fakeNames[Math.floor(Math.random() * fakeNames.length)];
}

/**
 * Get a random fake email
 */
export function getFakeEmail(): string {
	return fakeEmails[Math.floor(Math.random() * fakeEmails.length)];
}

/**
 * Get a random fake phone number
 */
export function getFakePhone(): string {
	return fakePhones[Math.floor(Math.random() * fakePhones.length)];
}

/**
 * Get a random fake address
 */
export function getFakeAddress(): string {
	return fakeAddresses[Math.floor(Math.random() * fakeAddresses.length)];
}

/**
 * Get a fake SSN (partially masked)
 */
export function getFakeSSN(): string {
	return fakeSSNs[Math.floor(Math.random() * fakeSSNs.length)];
}

/**
 * Get a fake date of birth
 */
export function getFakeDOB(): string {
	const year = 1950 + Math.floor(Math.random() * 50);
	const month = String(1 + Math.floor(Math.random() * 12)).padStart(2, '0');
	const day = String(1 + Math.floor(Math.random() * 28)).padStart(2, '0');
	return `${month}/${day}/${year}`;
}

/**
 * Get a fake patient ID
 */
export function getFakePatientId(): string {
	return `P-${Math.floor(10000 + Math.random() * 90000)}`;
}

/**
 * Mask a string with asterisks, keeping first and last characters
 */
export function maskString(str: string, keepChars: number = 2): string {
	if (str.length <= keepChars * 2) {
		return '*'.repeat(str.length);
	}
	const start = str.slice(0, keepChars);
	const end = str.slice(-keepChars);
	const middle = '*'.repeat(str.length - keepChars * 2);
	return `${start}${middle}${end}`;
}

/**
 * Generate fake data based on field type
 */
export function getFakeData(fieldType: 'name' | 'email' | 'phone' | 'address' | 'ssn' | 'dob' | 'patientId'): string {
	switch (fieldType) {
		case 'name':
			return getFakeName();
		case 'email':
			return getFakeEmail();
		case 'phone':
			return getFakePhone();
		case 'address':
			return getFakeAddress();
		case 'ssn':
			return getFakeSSN();
		case 'dob':
			return getFakeDOB();
		case 'patientId':
			return getFakePatientId();
		default:
			return '••••••••';
	}
}
