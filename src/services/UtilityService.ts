import { SecuritySuite } from '../utils/security.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../middleware/errorHandler.js';

export interface InteractionPayload {
  [key: string]: unknown;
}

export interface TransitOptions {
  signal?: AbortSignal;
}

export class VasariService {
  /**
   * Process and isolate the interaction.
   * RECTIFIED: Added options parameter and awaited asynchronous cryptographic ID generation.
   */
  async processInteraction(
    payload: InteractionPayload, 
    clientMetadata: { ip: string; ua: string },
    options?: TransitOptions
  ): Promise<{ id: string; status: string }> {
    try {
      // Respect the abort signal before heavy processing
      if (options?.signal?.aborted) {
        throw new Error('AbortError');
      }

      const { ip, ua } = clientMetadata;
      
      const cleanPayload = SecuritySuite.scrubPII(payload);
      
      // RECTIFIED: Await the scrypt-based ID generation
      const ephemeralId = await SecuritySuite.generatePseudoID(ua, ip);

      logger.info({
        event: 'TRANSIT_ISOLATED',
        ephemeralId,
        interaction: cleanPayload,
        anonymizedIP: SecuritySuite.anonymizeIP(ip)
      });

      return { id: ephemeralId, status: 'success' };
    } catch (error) {
      if (error.name === 'AbortError') throw error;
      
      logger.error({ event: 'TRANSIT_FAILURE', error: error.message });
      // RECTIFIED: Throw a typed AppError for the middleware to handle
      throw new AppError(500, 'Internal Processing Isolation Error', false);
    }
  }
}
