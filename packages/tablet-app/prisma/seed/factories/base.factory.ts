import type { PrismaClient } from '@prisma/client';
import type { FactoryContext, FactoryOptions, IdTracker } from '../types';

/**
 * Abstract base factory providing common functionality for all model factories.
 *
 * @template TInput - The Prisma create input type
 * @template TOutput - The Prisma model output type
 */
export abstract class BaseFactory<TInput, TOutput> {
  protected ctx: FactoryContext;
  protected traits: Map<string, Partial<TInput>> = new Map();

  constructor(ctx: FactoryContext) {
    this.ctx = ctx;
  }

  // Convenience accessors
  protected get db(): PrismaClient {
    return this.ctx.db;
  }

  protected get clinicId(): string {
    return this.ctx.clinicId;
  }

  protected get createdBy(): string | undefined {
    return this.ctx.createdBy;
  }

  protected get idTracker(): IdTracker {
    return this.ctx.idTracker;
  }

  /**
   * Build a single record without persisting to database.
   * Useful for testing or preview.
   */
  abstract build(options?: FactoryOptions<TInput>): TInput;

  /**
   * Build multiple records without persisting.
   */
  buildMany(count: number, options?: FactoryOptions<TInput>): TInput[] {
    return Array.from({ length: count }, () => this.build(options));
  }

  /**
   * Create a single record in the database.
   */
  abstract create(options?: FactoryOptions<TInput>): Promise<TOutput>;

  /**
   * Create multiple records in the database.
   * Uses sequential creation to maintain proper ID tracking.
   */
  async createMany(
    count: number,
    options?: FactoryOptions<TInput>
  ): Promise<TOutput[]> {
    const results: TOutput[] = [];
    for (let i = 0; i < count; i++) {
      results.push(await this.create(options));
    }
    return results;
  }

  /**
   * Register a trait (named preset of field values).
   *
   * @example
   * factory.registerTrait('active', { isActive: true, status: 'ACTIVE' });
   * factory.registerTrait('inactive', { isActive: false, status: 'INACTIVE' });
   *
   * // Later use:
   * factory.create({ traits: ['active'] });
   */
  registerTrait(name: string, overrides: Partial<TInput>): this {
    this.traits.set(name, overrides);
    return this;
  }

  /**
   * Register multiple traits at once.
   */
  registerTraits(traits: Record<string, Partial<TInput>>): this {
    for (const [name, overrides] of Object.entries(traits)) {
      this.traits.set(name, overrides);
    }
    return this;
  }

  /**
   * Apply registered traits to base data.
   * Traits are applied in order, with later traits overriding earlier ones.
   */
  protected applyTraits(base: TInput, traitNames?: string[]): TInput {
    if (!traitNames?.length) return base;

    return traitNames.reduce((acc, traitName) => {
      const trait = this.traits.get(traitName);
      if (!trait) {
        console.warn(`Factory trait "${traitName}" not found`);
        return acc;
      }
      return { ...acc, ...trait };
    }, base);
  }

  /**
   * Merge base data with options (traits and overrides).
   */
  protected mergeOptions(
    base: TInput,
    options?: FactoryOptions<TInput>
  ): TInput {
    let result = base;

    // Apply traits first
    if (options?.traits) {
      result = this.applyTraits(result, options.traits);
    }

    // Then apply explicit overrides (highest priority)
    if (options?.overrides) {
      result = { ...result, ...options.overrides };
    }

    return result;
  }

  /**
   * Create a new factory context scoped to a different clinic.
   */
  withClinic(clinicId: string): this {
    const NewFactory = this.constructor as new (ctx: FactoryContext) => this;
    return new NewFactory({
      ...this.ctx,
      clinicId,
    });
  }

  /**
   * Create a new factory context with a different createdBy user.
   */
  withCreatedBy(userId: string): this {
    const NewFactory = this.constructor as new (ctx: FactoryContext) => this;
    return new NewFactory({
      ...this.ctx,
      createdBy: userId,
    });
  }
}

/**
 * Helper to generate MongoDB-style ObjectId strings.
 * Only use for testing - real IDs come from Prisma/MongoDB.
 */
export function generateObjectId(): string {
  const timestamp = Math.floor(Date.now() / 1000).toString(16);
  const random = Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  return timestamp + random;
}

/**
 * Create a factory context for use with factories.
 */
export function createFactoryContext(
  db: PrismaClient,
  idTracker: IdTracker,
  clinicId: string,
  createdBy?: string
): FactoryContext {
  return {
    db,
    clinicId,
    createdBy,
    idTracker,
  };
}
