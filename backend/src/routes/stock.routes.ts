import { Router } from 'express';
import { adjustStock, getStockLogs } from '../controllers/stock.controller';
import { authenticateJWT, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

router.get('/logs', requireRole(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']), getStockLogs);
router.post('/adjust', requireRole(['ADMIN', 'WAREHOUSE']), adjustStock);

export default router;
