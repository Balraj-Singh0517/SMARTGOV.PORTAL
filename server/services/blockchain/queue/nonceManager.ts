import { ethers } from 'ethers';

/**
 * Sequential Nonce Manager with Async Mutex Locking.
 * Ensures concurrent transaction dispatches allocate consecutive nonces
 * without encountering NONCE_EXPIRED or REPLACEMENT_UNDERPRICED errors.
 */
export class NonceManager {
  private currentNonce: number | null = null;
  private mutex: Promise<void> = Promise.resolve();

  /**
   * Acquires the next sequential nonce for the given signer.
   * Serializes concurrent callers to guarantee zero nonce collisions.
   */
  public async acquireNonce(signer: ethers.Signer): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      this.mutex = this.mutex.then(async () => {
        try {
          const pendingNonce = await signer.getNonce('pending');
          if (this.currentNonce === null || this.currentNonce < pendingNonce) {
            this.currentNonce = pendingNonce;
          }
          const nonceToUse = this.currentNonce;
          this.currentNonce++;
          resolve(nonceToUse);
        } catch (err) {
          this.currentNonce = null;
          reject(err);
        }
      });
    });
  }

  /**
   * Resets the cached nonce to force an on-chain re-sync on next acquire.
   */
  public resetNonce(): void {
    this.currentNonce = null;
  }

  /**
   * Manually sets the current nonce to a known value.
   */
  public setNonce(nonce: number): void {
    this.currentNonce = nonce;
  }

  /**
   * Returns the current cached nonce, or null if not yet initialized.
   */
  public getCachedNonce(): number | null {
    return this.currentNonce;
  }
}

export const nonceManager = new NonceManager();
