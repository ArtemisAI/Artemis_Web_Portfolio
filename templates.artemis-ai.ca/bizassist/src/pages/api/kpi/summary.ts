import type { NextApiResponse } from 'next';
import prisma from '@/lib/db'; // Import shared Prisma instance
import { authMiddleware, AuthenticatedRequest } from '@/lib/authMiddleware';

// const prisma = new PrismaClient(); // Remove per-file instantiation

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  // Ensure user is authenticated and user object is available
  if (!req.user || !req.user.tenant_id) {
    return res.status(401).json({ message: 'Authentication required.' });
  }
  const { tenant_id } = req.user;

  try {
    // Calculate total sales for the current month for the tenant
    const now = new Date();
    const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const currentMonthSales = await prisma.sale.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        tenantId: tenant_id,
        date: {
          gte: firstDayCurrentMonth,
          lte: lastDayCurrentMonth,
        },
      },
    });

    const totalSalesCurrentMonth = currentMonthSales._sum.amount || 0;

    // Calculate total sales for the previous month for the tenant for comparison
    const firstDayPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const previousMonthSales = await prisma.sale.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        tenantId: tenant_id,
        date: {
          gte: firstDayPreviousMonth,
          lte: lastDayPreviousMonth,
        },
      },
    });
    const totalSalesPreviousMonth = previousMonthSales._sum.amount || 0;

    // Calculate percentage change
    let salesChangePercentage = 0;
    if (totalSalesPreviousMonth > 0) {
      salesChangePercentage = ((totalSalesCurrentMonth - totalSalesPreviousMonth) / totalSalesPreviousMonth) * 100;
    } else if (totalSalesCurrentMonth > 0) {
      salesChangePercentage = 100; // Infinite growth if previous month was 0 and current is positive
    }
    
    // Query parameter for range (example, not fully implemented for complex ranges)
    const range = req.query.range === 'month' ? 'month' : 'all_time'; // Simplified range

    return res.status(200).json({
      totalSales: totalSalesCurrentMonth, // For the current month
      salesChangePercentage: parseFloat(salesChangePercentage.toFixed(2)), // Rounded to 2 decimal places
      range: range, // Reflecting the simplified range used for calculation
      previousMonthTotal: totalSalesPreviousMonth, // Optional: good for context
    });

  } catch (error) {
    console.error('KPI summary error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  } finally {
    // await prisma.$disconnect(); // Not needed here if using shared instance from lib/db.ts
                                 // Connection management is handled by the shared instance.
  }
};

export default authMiddleware(handler);
