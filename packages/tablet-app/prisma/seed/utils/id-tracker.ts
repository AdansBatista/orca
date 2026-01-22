import type { IdTracker as IIdTracker } from '../types';

/**
 * Tracks created record IDs during seeding to enable relationship building.
 *
 * IDs are stored both globally and by clinic to support:
 * - Cross-model relationships (User -> Patient)
 * - Multi-clinic data isolation (Patient belongs to Clinic)
 */
export class IdTracker implements IIdTracker {
  /** Global ID storage: model -> IDs */
  private ids: Map<string, string[]> = new Map();

  /** Clinic-scoped ID storage: model -> clinicId -> IDs */
  private clinicIds: Map<string, Map<string, string[]>> = new Map();

  /**
   * Add an ID to the tracker
   * @param model - Model name (e.g., 'User', 'Patient')
   * @param id - The created record's ID
   * @param clinicId - Optional clinic ID for scoped tracking
   */
  add(model: string, id: string, clinicId?: string): void {
    // Add to global list
    if (!this.ids.has(model)) {
      this.ids.set(model, []);
    }
    this.ids.get(model)!.push(id);

    // Add to clinic-scoped list if clinicId provided
    if (clinicId) {
      if (!this.clinicIds.has(model)) {
        this.clinicIds.set(model, new Map());
      }
      const modelClinicIds = this.clinicIds.get(model)!;
      if (!modelClinicIds.has(clinicId)) {
        modelClinicIds.set(clinicId, []);
      }
      modelClinicIds.get(clinicId)!.push(id);
    }
  }

  /**
   * Get all IDs for a model
   */
  getAll(model: string): string[] {
    return this.ids.get(model) ?? [];
  }

  /**
   * Get a random ID for a model
   * @throws Error if no IDs exist for the model
   */
  getRandom(model: string): string {
    const ids = this.getAll(model);
    if (ids.length === 0) {
      throw new Error(`No IDs registered for model: ${model}`);
    }
    return ids[Math.floor(Math.random() * ids.length)];
  }

  /**
   * Get the first ID for a model
   * @throws Error if no IDs exist for the model
   */
  getFirst(model: string): string {
    const ids = this.getAll(model);
    if (ids.length === 0) {
      throw new Error(`No IDs registered for model: ${model}`);
    }
    return ids[0];
  }

  /**
   * Get IDs filtered by clinic
   */
  getByClinic(model: string, clinicId: string): string[] {
    return this.clinicIds.get(model)?.get(clinicId) ?? [];
  }

  /**
   * Get a random ID for a model within a specific clinic
   * @throws Error if no IDs exist for the model in the clinic
   */
  getRandomByClinic(model: string, clinicId: string): string {
    const ids = this.getByClinic(model, clinicId);
    if (ids.length === 0) {
      throw new Error(
        `No IDs registered for model: ${model} in clinic: ${clinicId}`
      );
    }
    return ids[Math.floor(Math.random() * ids.length)];
  }

  /**
   * Check if any IDs exist for a model
   */
  has(model: string): boolean {
    return (this.ids.get(model)?.length ?? 0) > 0;
  }

  /**
   * Get count of IDs for a model
   */
  count(model: string): number {
    return this.ids.get(model)?.length ?? 0;
  }

  /**
   * Clear all tracked IDs
   */
  clear(): void {
    this.ids.clear();
    this.clinicIds.clear();
  }

  /**
   * Get a summary of tracked IDs (for debugging)
   */
  summary(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [model, ids] of this.ids) {
      result[model] = ids.length;
    }
    return result;
  }
}

/**
 * Create a new ID tracker instance
 */
export function createIdTracker(): IdTracker {
  return new IdTracker();
}
