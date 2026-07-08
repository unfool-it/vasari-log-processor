import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config/index.js';
import { VasariService } from './services/UtilityService.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';

const app = express();
const vasariService = new VasariService();

// Enable if behind a reverse proxy to get correct IP
app.set('trust proxy', 1); 

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  referrerPolicy: { policy: 'no-referrer' },
}));

// Add CORS to allow your frontend to communicate with this bypass
app.use(cors({
  origin: config.ALLOWED_ORIGINS || '*', 
  methods: ['POST']
}));

app.use(express.json({ limit: '10kb' }));

/**
 * THE BYPASS ENDPOINT (Refactored)
 */
app.post('/bypass/collect', async (req, res, next) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const clientMetadata = {
      ip: req.ip || 'unknown',
      ua: req.headers['user-agent'] || 'unknown',
      receivedAt: new Date().toISOString()
    };

    // PASS THE SIGNAL: Ensure VasariService handles controller.signal
    const result = await vasariService.processInteraction(
      req.body, 
      clientMetadata, 
      { signal: controller.signal } 
    );
    
    res.status(202).json({
      status: 'accepted',
      correlationId: result.id
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      logger.warn('Request timed out at Vasari Corridor');
      return res.status(504).json({ error: 'Gateway Timeout' });
    }
    next(error);
  } finally {
    clearTimeout(timeoutId);
  }
});

app.use(errorHandler);

const server = app.listen(config.PORT, () => {
  logger.info(`🏛️ Vasari Corridor active on port ${config.PORT}`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Closing bypass gates...');
  server.close(() => {
    logger.info('Server closed.');
    process.exit(0);
  });
});
