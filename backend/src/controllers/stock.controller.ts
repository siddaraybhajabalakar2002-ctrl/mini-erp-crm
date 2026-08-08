import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { stockAdjustmentSchema } from '../utils/validation';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const adjustStock = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = stockAdjustmentSchema.parse(req.body);

    const product = await prisma.product.findUnique({
      where: { id: data.productId },
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (data.movementType === 'OUT' && product.currentStock < data.quantityChanged) {
      return res.status(400).json({
        message: `Insufficient stock for product '${product.name}' (SKU: ${product.sku}). Current stock is ${product.currentStock}, but attempted to remove ${data.quantityChanged}. Stock cannot go negative.`,
      });
    }

    const newStock =
      data.movementType === 'IN'
        ? product.currentStock + data.quantityChanged
        : product.currentStock - data.quantityChanged;

    const result = await prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.product.update({
        where: { id: data.productId },
        data: { currentStock: newStock },
      });

      const log = await tx.stockLog.create({
        data: {
          productId: data.productId,
          quantityChanged: data.quantityChanged,
          movementType: data.movementType,
          reason: data.reason,
          createdBy: req.user?.name || 'System User',
        },
      });

      return { updatedProduct, log };
    });

    res.status(201).json({
      message: `Stock adjusted successfully (${data.movementType}: ${data.quantityChanged})`,
      product: result.updatedProduct,
      stockLog: result.log,
    });
  } catch (error) {
    next(error);
  }
};

export const getStockLogs = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 15;
    const productId = req.query.productId as string | undefined;
    const movementType = req.query.movementType as 'IN' | 'OUT' | undefined;

    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (productId) {
      whereClause.productId = productId;
    }

    if (movementType) {
      whereClause.movementType = movementType;
    }

    const [logs, total] = await Promise.all([
      prisma.stockLog.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              category: true,
              currentStock: true,
            },
          },
        },
      }),
      prisma.stockLog.count({ where: whereClause }),
    ]);

    res.json({
      logs,
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
