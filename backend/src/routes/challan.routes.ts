import { Router } from 'express';
import {
  createChallan,
  updateChallanStatus,
  getChallans,
  getChallanById,
  exportChallanPDF,
} from '../controllers/challan.controller';
import { authenticateJWT, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

router.get('/', requireRole(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']), getChallans);
router.get('/:id', requireRole(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']), getChallanById);
router.get('/:id/pdf', requireRole(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']), exportChallanPDF);
router.post('/', requireRole(['ADMIN', 'SALES']), createChallan);
router.put('/:id/status', requireRole(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']), updateChallanStatus);

export default router;
