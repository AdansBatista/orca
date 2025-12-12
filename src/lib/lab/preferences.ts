import { db } from '@/lib/db';

/**
 * Evaluate preference rules for a product/category
 * Returns the vendor ID that should be used based on priority rules
 */
export async function evaluatePreferences(
  clinicId: string,
  context: {
    productId?: string;
    productCategory?: string;
    isRush?: boolean;
    orderValue?: number;
  }
): Promise<string | null> {
  const rules = await db.labPreferenceRule.findMany({
    where: {
      clinicId,
      isActive: true,
    },
    include: {
      vendor: {
        select: { id: true, status: true },
      },
    },
    orderBy: { priority: 'asc' }, // Lower priority number = higher precedence
  });

  // Find first matching rule with active vendor
  for (const rule of rules) {
    if (rule.vendor?.status !== 'ACTIVE') {
      continue;
    }

    const conditions = rule.conditions as {
      productCategory?: string | null;
      productId?: string | null;
      isRush?: boolean | null;
      minOrderValue?: number | null;
      maxOrderValue?: number | null;
    } | null;

    // Check if rule matches all conditions
    let matches = true;

    if (conditions) {
      // Product ID match
      if (conditions.productId && conditions.productId !== context.productId) {
        matches = false;
      }

      // Category match
      if (conditions.productCategory && conditions.productCategory !== context.productCategory) {
        matches = false;
      }

      // Rush match
      if (conditions.isRush !== null && conditions.isRush !== undefined && conditions.isRush !== context.isRush) {
        matches = false;
      }

      // Order value range
      if (conditions.minOrderValue && context.orderValue && context.orderValue < conditions.minOrderValue) {
        matches = false;
      }
      if (conditions.maxOrderValue && context.orderValue && context.orderValue > conditions.maxOrderValue) {
        matches = false;
      }
    }

    if (matches) {
      return rule.vendorId;
    }
  }

  return null;
}
