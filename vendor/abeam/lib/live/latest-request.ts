/**
 * Une seule requête en vol, et au plus la fenêtre la plus récente en attente.
 * La génération permet à l'appelant d'écarter un résultat périmé sans annuler
 * une recherche serveur dont le budget a peut-être déjà été consommé.
 */
export class LatestRequestQueue<T> {
  private generation = 0;
  private runner = 0;
  private busy = false;
  private activeGeneration: number | null = null;
  private pending: { generation: number; value: T } | null = null;

  enqueue(value: T): { generation: number; value: T; runner: number | null } {
    const generation = ++this.generation;
    if (this.busy) {
      this.pending = { generation, value };
      return { generation, value, runner: null };
    }
    this.busy = true;
    this.activeGeneration = generation;
    return { generation, value, runner: ++this.runner };
  }

  /** A paid request stays valid while a newer transcript window waits. */
  isActive(generation: number): boolean {
    return this.busy && generation === this.activeGeneration;
  }

  /** A scan may be skipped before it starts a paid provider request. */
  isCurrent(generation: number): boolean {
    return generation === this.generation;
  }

  next(runner: number): { generation: number; value: T } | null {
    if (runner !== this.runner) return null;
    if (this.pending) {
      const next = this.pending;
      this.pending = null;
      this.activeGeneration = next.generation;
      return next;
    }
    this.busy = false;
    this.activeGeneration = null;
    return null;
  }

  invalidate(): void {
    this.generation += 1;
    this.runner += 1;
    this.pending = null;
    this.busy = false;
    this.activeGeneration = null;
  }
}
