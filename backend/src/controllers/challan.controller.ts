import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { createChallanSchema, updateChallanStatusSchema } from '../utils/validation';
import { AuthRequest } from '../middleware/auth';
import { generateChallanPDF } from '../services/pdf.service';
import { deductStockTransaction } from '../services/stock.service';

const prisma = new PrismaClient();

// Helper to generate unique Challan Number
const generateChallanNumber = async (): Promise<string> => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await prisma.challan.count();
  const sequence = (count + 1).toString().padStart(4, '0');
  return `CHLN-${dateStr}-${sequence}`;
};

export const createChallan = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = createChallanSchema.parse(req.body);

    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId },
    });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Fetch product details for snapshot
    const productIds = data.items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Validate all products exist
    for (const item of data.items) {
      if (!productMap.has(item.productId)) {
        return res.status(404).json({ message: `Product ID '${item.productId}' not found` });
      }
    }

    // Build snapshot items
    let totalQuantity = 0;
    let totalAmount = 0;

    const challanItemsData = data.items.map((item) => {
      const p = productMap.get(item.productId)!;
      const subtotal = p.unitPrice * item.quantity;
      totalQuantity += item.quantity;
      totalAmount += subtotal;

      return {
        productId: p.id,
        productName: p.name,
        productSku: p.sku,
        unitPrice: p.unitPrice,
        quantity: item.quantity,
        subtotal,
      };
    });

    // Transaction to create Challan and reduce stock if confirmed
    const result = await prisma.$transaction(async (tx) => {
      if (data.status === 'CONFIRMED') {
        const challanNumber = await generateChallanNumber();
        await deductStockTransaction(
          tx,
          data.items,
          challanNumber,
          req.user?.name || 'System User'
        );
      }

      const challanNumber = await generateChallanNumber();

      const newChallan = await tx.challan.create({
        data: {
          challanNumber,
          customerId: data.customerId,
          totalQuantity,
          totalAmount,
          status: data.status,
          createdBy: req.user?.name || 'System User',
          items: {
            create: challanItemsData,
          },
        },
        include: {
          customer: true,
          items: true,
        },
      });

      return newChallan;
    });

    res.status(201).json({
      message: `Sales Challan created successfully (${result.status})`,
      challan: result,
    });
  } catch (error: any) {
    if (error.name === 'InsufficientStockError') {
      return res.status(409).json({
        message: error.message,
        errors: error.errors,
      });
    }
    next(error);
  }
};

export const updateChallanStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = updateChallanStatusSchema.parse(req.body);

    const challan = await prisma.challan.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!challan) {
      return res.status(404).json({ message: 'Challan not found' });
    }

    if (challan.status === (status as string)) {
      return res.status(400).json({ message: `Challan is already in '${status}' status` });
    }

    if (challan.status === 'CANCELLED') {
      return res.status(400).json({ message: 'Cannot update status of a cancelled challan' });
    }

    // Transition: DRAFT -> CONFIRMED
    if (challan.status === 'DRAFT' && status === 'CONFIRMED') {
      const updatedChallan = await prisma.$transaction(async (tx) => {
        await deductStockTransaction(
          tx,
          challan.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          challan.challanNumber,
          req.user?.name || 'System User'
        );

        const resChallan = await tx.challan.update({
          where: { id },
          data: { status: 'CONFIRMED' },
          include: { customer: true, items: true },
        });

        return resChallan;
      });

      return res.json({
        message: 'Challan status updated to CONFIRMED and stock reduced',
        challan: updatedChallan,
      });
    }

    // Transition: DRAFT or CONFIRMED -> CANCELLED
    if (status === 'CANCELLED') {
      const updatedChallan = await prisma.$transaction(async (tx) => {
        const resChallan = await tx.challan.update({
          where: { id },
          data: { status: 'CANCELLED' },
          include: { customer: true, items: true },
        });

        // If it was already confirmed, restore stock!
        if (challan.status === 'CONFIRMED') {
          for (const item of challan.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: { currentStock: { increment: item.quantity } },
            });

            await tx.stockLog.create({
              data: {
                productId: item.productId,
                quantityChanged: item.quantity,
                movementType: 'IN',
                reason: `Sales Challan cancelled: ${challan.challanNumber} (Stock restored)`,
                createdBy: req.user?.name || 'System User',
              },
            });
          }
        }

        return resChallan;
      });

      return res.json({
        message: 'Challan cancelled successfully',
        challan: updatedChallan,
      });
    }

    res.status(400).json({ message: 'Invalid status transition' });
  } catch (error) {
    next(error);
  }
};

export const getChallans = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const status = req.query.status as string | undefined;

    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { challanNumber: { contains: search } },
        { customer: { name: { contains: search } } },
        { customer: { businessName: { contains: search } } },
      ];
    }

    if (status) {
      whereClause.status = status;
    }

    const [challans, total] = await Promise.all([
      prisma.challan.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              businessName: true,
              mobile: true,
              email: true,
            },
          },
          items: true,
        },
      }),
      prisma.challan.count({ where: whereClause }),
    ]);

    res.json({
      challans,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getChallanById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const challan = await prisma.challan.findUnique({
      where: { id },
      include: {
        customer: true,
        items: true,
      },
    });

    if (!challan) {
      return res.status(404).json({ message: 'Challan not found' });
    }

    res.json(challan);
  } catch (error) {
    next(error);
  }
};

export const exportChallanPDF = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const challan = await prisma.challan.findUnique({
      where: { id },
      include: {
        customer: true,
        items: true,
      },
    });

    if (!challan) {
      return res.status(404).json({ message: 'Challan not found' });
    }

    const pdfBuffer = await generateChallanPDF(challan);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${challan.challanNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};
