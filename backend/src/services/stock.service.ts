import { Prisma, PrismaClient } from '@prisma/client';

export class InsufficientStockError extends Error {
  public statusCode = 409;
  public errors: string[];

  constructor(message: string, errors: string[]) {
    super(message);
    this.name = 'InsufficientStockError';
    this.errors = errors;
  }
}

export interface StockDeductionItem {
  productId: string;
  quantity: number;
}

/**
 * Isolated, transactional service to validate and deduct product inventory
 * Writes immutable OUT movements to StockLog inside a Prisma transaction.
 */
export const deductStockTransaction = async (
  tx: Prisma.TransactionClient,
  items: StockDeductionItem[],
  challanNumber: string,
  operatorName: string
) => {
  const productIds = items.map((i) => i.productId);
  const products = await tx.product.findMany({
    where: { id: { in: productIds } },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));
  const stockErrors: string[] = [];

  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) {
      stockErrors.push(`Product ID '${item.productId}' not found`);
      continue;
    }
    if (product.currentStock < item.quantity) {
      stockErrors.push(
        `Product '${product.name}' (SKU: ${product.sku}) current stock is ${product.currentStock}, but requested ${item.quantity}`
      );
    }
  }

  if (stockErrors.length > 0) {
    throw new InsufficientStockError(
      'Insufficient stock to confirm sales challan. Stock cannot go negative.',
      stockErrors
    );
  }

  for (const item of items) {
    const product = productMap.get(item.productId)!;
    await tx.product.update({
      where: { id: product.id },
      data: { currentStock: { decrement: item.quantity } },
    });

    await tx.stockLog.create({
      data: {
        productId: product.id,
        quantityChanged: item.quantity,
        movementType: 'OUT',
        reason: `Sales Challan confirmed: ${challanNumber}`,
        createdBy: operatorName,
      },
    });
  }
};
