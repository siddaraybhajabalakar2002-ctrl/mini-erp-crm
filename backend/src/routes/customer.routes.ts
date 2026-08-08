import { Router } from 'express';
import {
  createCustomer,
  updateCustomer,
  getCustomers,
  getCustomerById,
  addFollowUpNote,
} from '../controllers/customer.controller';
import { authenticateJWT, requireRole, Role } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

router.get('/', requireRole(['ADMIN', 'SALES', 'ACCOUNTS', 'WAREHOUSE']), getCustomers);
router.get('/:id', requireRole(['ADMIN', 'SALES', 'ACCOUNTS', 'WAREHOUSE']), getCustomerById);
router.post('/', requireRole(['ADMIN', 'SALES']), createCustomer);
router.put('/:id', requireRole(['ADMIN', 'SALES']), updateCustomer);
router.post('/:id/notes', requireRole(['ADMIN', 'SALES']), addFollowUpNote);

export default router;
