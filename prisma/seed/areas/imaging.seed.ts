/**
 * Imaging Management seeder - Creates patient images, tags, and annotations
 *
 * This seeder creates sample imaging data for testing the Imaging Management area
 * including various image categories, tags, and annotations.
 *
 * Dependencies: core, patients, auth:users, staff
 */

import type { SeedContext } from '../types';
import { withSoftDelete } from '../utils/soft-delete';

// Image categories available
const IMAGE_CATEGORIES = [
  'EXTRAORAL_PHOTO',
  'INTRAORAL_PHOTO',
  'PANORAMIC_XRAY',
  'CEPHALOMETRIC_XRAY',
  'PERIAPICAL_XRAY',
  'CBCT',
  'SCAN_3D',
] as const;

// Annotation types (matches Prisma AnnotationType enum)
const ANNOTATION_TYPES = [
  'ARROW',
  'CIRCLE',
  'RECTANGLE',
  'LINE',
  'TEXT',
  'FREEHAND',
  'POLYGON',
] as const;

// Sample image configurations by category
const SAMPLE_IMAGES_CONFIG = {
  EXTRAORAL_PHOTO: [
    { subcategory: 'FRONTAL_RELAXED', description: 'Frontal view - relaxed lips' },
    { subcategory: 'FRONTAL_SMILE', description: 'Frontal view - smiling' },
    { subcategory: 'PROFILE_RIGHT', description: 'Profile view - right side' },
    { subcategory: 'PROFILE_LEFT', description: 'Profile view - left side' },
    { subcategory: 'THREE_QUARTER_RIGHT', description: '3/4 view - right side' },
    { subcategory: 'THREE_QUARTER_LEFT', description: '3/4 view - left side' },
  ],
  INTRAORAL_PHOTO: [
    { subcategory: 'UPPER_OCCLUSAL', description: 'Upper arch occlusal view' },
    { subcategory: 'LOWER_OCCLUSAL', description: 'Lower arch occlusal view' },
    { subcategory: 'FRONTAL_BITE', description: 'Frontal view - teeth together' },
    { subcategory: 'RIGHT_BUCCAL', description: 'Right side buccal view' },
    { subcategory: 'LEFT_BUCCAL', description: 'Left side buccal view' },
    { subcategory: 'OVERJET', description: 'Overjet measurement view' },
  ],
  PANORAMIC_XRAY: [
    { subcategory: 'STANDARD', description: 'Standard panoramic radiograph' },
  ],
  CEPHALOMETRIC_XRAY: [
    { subcategory: 'LATERAL', description: 'Lateral cephalometric radiograph' },
    { subcategory: 'PA', description: 'Posteroanterior cephalometric' },
  ],
  PERIAPICAL_XRAY: [
    { subcategory: 'ANTERIOR', description: 'Anterior periapical' },
    { subcategory: 'POSTERIOR', description: 'Posterior periapical' },
  ],
  CBCT: [
    { subcategory: 'FULL_VOLUME', description: 'Full volume CBCT scan' },
    { subcategory: 'LIMITED_FOV', description: 'Limited field of view CBCT' },
  ],
  SCAN_3D: [
    { subcategory: 'UPPER_ARCH', description: 'Upper arch intraoral scan' },
    { subcategory: 'LOWER_ARCH', description: 'Lower arch intraoral scan' },
    { subcategory: 'BITE_SCAN', description: 'Bite registration scan' },
  ],
};

// Sample placeholder image URLs (these would be actual dental images in production)
// Using placeholders for development - replace with actual anonymized samples
const PLACEHOLDER_IMAGES = {
  EXTRAORAL_PHOTO: 'https://placehold.co/800x1000/e2e8f0/64748b?text=Extraoral+Photo',
  INTRAORAL_PHOTO: 'https://placehold.co/800x600/e2e8f0/64748b?text=Intraoral+Photo',
  PANORAMIC_XRAY: 'https://placehold.co/2000x800/1e293b/94a3b8?text=Panoramic+X-Ray',
  CEPHALOMETRIC_XRAY: 'https://placehold.co/800x1000/1e293b/94a3b8?text=Cephalometric+X-Ray',
  PERIAPICAL_XRAY: 'https://placehold.co/400x500/1e293b/94a3b8?text=Periapical+X-Ray',
  CBCT: 'https://placehold.co/600x600/1e293b/94a3b8?text=CBCT+Scan',
  SCAN_3D: 'https://placehold.co/800x600/0ea5e9/ffffff?text=3D+Scan',
};

// System tags for images
const SYSTEM_TAGS = [
  { name: 'Initial Records', color: '#3b82f6', category: 'CLINICAL' },
  { name: 'Progress', color: '#22c55e', category: 'TREATMENT' },
  { name: 'Final Records', color: '#a855f7', category: 'CLINICAL' },
  { name: 'Crowding', color: '#ef4444', category: 'CLINICAL' },
  { name: 'Spacing', color: '#f97316', category: 'CLINICAL' },
  { name: 'Crossbite', color: '#ec4899', category: 'CLINICAL' },
  { name: 'Deep Bite', color: '#8b5cf6', category: 'CLINICAL' },
  { name: 'Open Bite', color: '#06b6d4', category: 'CLINICAL' },
  { name: 'Class II', color: '#eab308', category: 'CLINICAL' },
  { name: 'Class III', color: '#14b8a6', category: 'CLINICAL' },
  { name: 'Braces', color: '#6366f1', category: 'TREATMENT' },
  { name: 'Invisalign', color: '#0ea5e9', category: 'TREATMENT' },
  { name: 'Retainer', color: '#84cc16', category: 'TREATMENT' },
  { name: 'Good Quality', color: '#22c55e', category: 'QUALITY' },
  { name: 'Needs Retake', color: '#ef4444', category: 'QUALITY' },
];

/**
 * Seed Imaging data
 */
export async function seedImaging(ctx: SeedContext): Promise<void> {
  const { db, idTracker, logger } = ctx;
  const clinicIds = idTracker.getAll('Clinic');

  logger.startArea('Imaging');

  if (clinicIds.length === 0) {
    logger.warn('No clinics found, skipping Imaging seeding');
    logger.endArea('Imaging', 0);
    return;
  }

  let totalCreated = 0;

  // First, create system tags (no clinicId)
  logger.info('Creating system image tags...');
  for (const tagData of SYSTEM_TAGS) {
    const existingTag = await db.imageTag.findFirst({
      where: {
        name: tagData.name,
        clinicId: null,
      },
    });

    if (!existingTag) {
      await db.imageTag.create({
        data: {
          name: tagData.name,
          color: tagData.color,
          category: tagData.category as 'CLINICAL' | 'TREATMENT' | 'QUALITY' | 'CUSTOM',
          clinicId: null,
        },
      });
      totalCreated++;
    }
  }
  logger.info(`  Created ${SYSTEM_TAGS.length} system tags`);

  for (const clinicId of clinicIds) {
    const clinic = await db.clinic.findUnique({ where: { id: clinicId } });
    logger.info(`Seeding imaging data for clinic: ${clinic?.name || clinicId}`);

    // Get patients for this clinic (first 10 patients get images)
    const patients = await db.patient.findMany({
      where: withSoftDelete({ clinicId }),
      take: 10,
      orderBy: { createdAt: 'asc' },
    });

    // Get staff members for capturedBy
    const staffMembers = await db.staffProfile.findMany({
      where: withSoftDelete({ clinicId }),
      take: 5,
    });

    // Get existing system tags
    const systemTags = await db.imageTag.findMany({
      where: { clinicId: null },
    });

    // Create clinic-specific custom tags
    const clinicTags = [
      { name: 'Phase I', color: '#3b82f6' },
      { name: 'Phase II', color: '#8b5cf6' },
      { name: 'Review Needed', color: '#f97316' },
    ];

    for (const tagData of clinicTags) {
      const existingTag = await db.imageTag.findFirst({
        where: {
          clinicId,
          name: tagData.name,
        },
      });

      if (!existingTag) {
        await db.imageTag.create({
          data: {
            clinicId,
            name: tagData.name,
            color: tagData.color,
            category: 'CUSTOM',
          },
        });
        totalCreated++;
      }
    }

    let annotationCount = 0;

    // Create images for each patient
    for (let patientIndex = 0; patientIndex < patients.length; patientIndex++) {
      const patient = patients[patientIndex];
      const capturedBy = staffMembers[patientIndex % staffMembers.length];

      // Determine which categories to create based on patient index
      const categoriesToCreate = getPatientImageCategories(patientIndex);

      for (const category of categoriesToCreate) {
        const categoryConfig = SAMPLE_IMAGES_CONFIG[category as keyof typeof SAMPLE_IMAGES_CONFIG];
        if (!categoryConfig) continue;

        // Create 1-3 images per category based on patient
        const imageCount = Math.min(categoryConfig.length, patientIndex < 5 ? 3 : 1);

        for (let i = 0; i < imageCount; i++) {
          const config = categoryConfig[i];
          if (!config) continue;

          // Check if image already exists
          const existingImage = await db.patientImage.findFirst({
            where: {
              clinicId,
              patientId: patient.id,
              category: category as typeof IMAGE_CATEGORIES[number],
              subcategory: config.subcategory,
            },
          });

          if (existingImage) {
            idTracker.add('PatientImage', existingImage.id, clinicId);
            continue;
          }

          // Calculate capture date (records taken at various points)
          const daysAgo = patientIndex < 3
            ? Math.floor(Math.random() * 30) // Recent patients: 0-30 days ago
            : 30 + Math.floor(Math.random() * 180); // Older patients: 30-210 days ago

          const captureDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

          const fileName = `${patient.lastName.toLowerCase()}_${config.subcategory.toLowerCase()}_${captureDate.toISOString().split('T')[0]}.jpg`;

          // Ensure we have a staff member for createdBy (required field)
          if (!capturedBy?.id) continue;

          const image = await db.patientImage.create({
            data: {
              clinicId,
              patientId: patient.id,
              fileName,
              fileUrl: PLACEHOLDER_IMAGES[category as keyof typeof PLACEHOLDER_IMAGES] || PLACEHOLDER_IMAGES.EXTRAORAL_PHOTO,
              thumbnailUrl: PLACEHOLDER_IMAGES[category as keyof typeof PLACEHOLDER_IMAGES] || PLACEHOLDER_IMAGES.EXTRAORAL_PHOTO,
              fileSize: 500000 + Math.floor(Math.random() * 1500000), // 500KB - 2MB
              mimeType: 'image/jpeg',
              category: category as typeof IMAGE_CATEGORIES[number],
              subcategory: config.subcategory,
              captureDate,
              capturedById: capturedBy.id,
              description: config.description,
              notes: `Camera: Canon EOS 90D, Lens: EF 100mm f/2.8L Macro IS USM, ISO: 200`,
              isArchived: false,
              qualityScore: 70 + Math.floor(Math.random() * 30), // 70-100
              createdById: capturedBy.id, // Required field
            },
          });

          idTracker.add('PatientImage', image.id, clinicId);
          totalCreated++;

          // Add tags to images (randomly assign 1-3 tags)
          const availableTags = [...systemTags];
          const tagsToAdd = Math.floor(Math.random() * 3) + 1;
          const selectedTags = availableTags
            .sort(() => Math.random() - 0.5)
            .slice(0, tagsToAdd);

          for (const tag of selectedTags) {
            // Check if tag already assigned
            const existingAssignment = await db.imageTagAssignment.findFirst({
              where: {
                imageId: image.id,
                tagId: tag.id,
              },
            });

            if (!existingAssignment) {
              await db.imageTagAssignment.create({
                data: {
                  imageId: image.id,
                  tagId: tag.id,
                },
              });
              totalCreated++;
            }
          }
        }
      }

      // Create annotations for first 5 patients' X-rays (only if we have a staff member)
      if (patientIndex < 5 && capturedBy?.id) {
        const patientXrays = await db.patientImage.findMany({
          where: {
            clinicId,
            patientId: patient.id,
            category: { in: ['PANORAMIC_XRAY', 'CEPHALOMETRIC_XRAY'] },
          },
          take: 2,
        });

        for (const xray of patientXrays) {
          const annotations = generateImageAnnotations(xray.id, capturedBy.id);

          for (const annotationData of annotations) {
            await db.imageAnnotation.create({
              data: {
                image: { connect: { id: annotationData.imageId } },
                type: annotationData.type,
                geometry: annotationData.geometry,
                style: annotationData.style,
                label: annotationData.label,
                text: annotationData.text,
                createdBy: { connect: { id: annotationData.createdById } },
              },
            });
            annotationCount++;
            totalCreated++;
          }
        }
      }
    }

    logger.info(`  Created images, ${annotationCount} annotations`);
  }

  logger.success(`Imaging seeding complete: ${totalCreated} records created`);
  logger.endArea('Imaging', totalCreated);
}

/**
 * Determine which image categories to create for a patient
 */
function getPatientImageCategories(patientIndex: number): string[] {
  // First 5 patients get full record sets
  if (patientIndex < 5) {
    return [
      'EXTRAORAL_PHOTO',
      'INTRAORAL_PHOTO',
      'PANORAMIC_XRAY',
      'CEPHALOMETRIC_XRAY',
    ];
  }

  // Next 3 patients get basic records
  if (patientIndex < 8) {
    return ['EXTRAORAL_PHOTO', 'INTRAORAL_PHOTO', 'PANORAMIC_XRAY'];
  }

  // Remaining patients get minimal records
  return ['EXTRAORAL_PHOTO', 'PANORAMIC_XRAY'];
}

/**
 * Generate annotations for X-ray images
 */
function generateImageAnnotations(imageId: string, createdById: string) {
  const annotations = [
    {
      imageId,
      type: 'ARROW' as const,
      geometry: {
        startX: 200,
        startY: 150,
        endX: 250,
        endY: 200,
      },
      style: { color: '#ef4444', strokeWidth: 2 },
      label: 'Crowding',
      text: 'Moderate crowding in anterior region',
      createdById,
    },
    {
      imageId,
      type: 'LINE' as const,
      geometry: {
        startX: 300,
        startY: 100,
        endX: 350,
        endY: 100,
      },
      style: { color: '#3b82f6', strokeWidth: 2 },
      label: 'Overjet - 4.5mm',
      text: 'Overjet measurement',
      createdById,
    },
    {
      imageId,
      type: 'CIRCLE' as const,
      geometry: {
        centerX: 450,
        centerY: 250,
        radius: 30,
      },
      style: { color: '#f97316', strokeWidth: 2, fill: 'transparent' },
      label: 'Area of concern',
      text: 'Monitor root resorption',
      createdById,
    },
  ];

  return annotations;
}

/**
 * Clear Imaging data
 */
export async function clearImaging(ctx: SeedContext): Promise<void> {
  const { db, logger } = ctx;

  logger.info('Clearing Imaging data...');

  // Delete in reverse dependency order
  await db.imageAnnotation.deleteMany({});
  await db.imageTagAssignment.deleteMany({});
  await db.patientImage.deleteMany({});
  await db.imageTag.deleteMany({});

  logger.info('  Imaging data cleared');
}
