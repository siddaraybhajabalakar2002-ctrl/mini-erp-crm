import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { productSchema } from '../utils/validation';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const createProduct = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = productSchema.parse(req.body);

    const existing = await prisma.product.findUnique({
      where: { sku: data.sku },
    });

    if (existing) {
      return res.status(400).json({ message: `Product with SKU '${data.sku}' already exists` });
    }

    const product = await prisma.product.create({
      data,
    });

    // Create initial stock log if stock > 0
    if (product.currentStock > 0) {
      await prisma.stockLog.create({
        data: {
          productId: product.id,
          quantityChanged: product.currentStock,
          movementType: 'IN',
          reason: 'Initial Product Setup Stock',
          createdBy: req.user?.name || 'System User',
        },
      });
    }

    res.status(201).json({
      message: 'Product created successfully',
      product,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = productSchema.parse(req.body);

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check SKU uniqueness if changed
    if (data.sku !== existing.sku) {
      const skuCheck = await prisma.product.findUnique({ where: { sku: data.sku } });
      if (skuCheck) {
        return res.status(400).json({ message: `SKU '${data.sku}' is already assigned to another product` });
      }
    }

    const updated = await prisma.product.update({
      where: { id },
      data,
    });

    res.json({
      message: 'Product updated successfully',
      product: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const getProducts = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const category = (req.query.category as string) || '';
    const lowStockOnly = req.query.lowStock === 'true';

    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { category: { contains: search } },
        { location: { contains: search } },
      ];
    }

    if (category) {
      whereClause.category = category;
    }

    const [productsRaw, total] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where: whereClause }),
    ]);

    let products = productsRaw.map((p) => ({
      ...p,
      isLowStock: p.currentStock <= p.minStockAlert,
    }));

    if (lowStockOnly) {
      products = products.filter((p) => p.isLowStock);
    }

    res.json({
      products,
      pagination: {
        total: lowStockOnly ? products.length : total,
        page,
        limit,
        totalPages: Math.ceil((lowStockOnly ? products.length : total) / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        stockLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({
      ...product,
      isLowStock: product.currentStock <= product.minStockAlert,
    });
  } catch (error) {
    next(error);
  }
};
