import { Request, Response } from "express";
import { asyncHandler } from "../utils/ayncHnadler";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import { prisma } from "../db";

/**
 * Ensure wallet exists for a farmer.
 */
async function ensureWallet(farmerId: string, tenantId: string) {
  let wallet = await prisma.wallet.findUnique({ where: { farmerId } });
  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: { farmerId, tenantId, balance: "0" },
    });
  }
  return wallet;
}

// GET /wallet/me
export const getMyWallet = asyncHandler(async (req: Request, res: Response) => {
  const farmerId = (req as any).user?.id as string | undefined;
  const tenantId = ((req as any).user?.tenantId as string | undefined) ?? "default";
  const wallet = await ensureWallet(farmerId, tenantId);
  const txs = await prisma.walletTransaction.findMany({
    where: { walletId: wallet.walletId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return res.status(200).json(
    new ApiResponse(200, { wallet, transactions: txs }, "Wallet fetched")
  );
});

// POST /admin/wallet/topup  { farmerId? | email? | username?, amount }
export const adminTopupWallet = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = ((req as any).user?.tenantId as string | undefined) ?? "default";
  const { farmerId, email, username, amount } = req.body as {
    farmerId?: string;
    email?: string;
    username?: string;
    amount?: string | number;
  };

  if (amount === undefined) throw new ApiError(400, "amount is required");

  const farmer =
    farmerId
      ? await prisma.farmer.findUnique({ where: { farmerId } })
      : email
      ? await prisma.farmer.findUnique({ where: { email } })
      : username
      ? await prisma.farmer.findFirst({ where: { username } })
      : null;

  if (!farmer) {
    throw new ApiError(400, "Provide a valid farmerId, email, or username");
  }

  const wallet = await ensureWallet(farmer.farmerId, tenantId);

  const updated = await prisma.$transaction(async (tx) => {
    const w = await tx.wallet.update({
      where: { walletId: wallet.walletId },
      data: { balance: { increment: String(amount) } },
    });

    await tx.walletTransaction.create({
      data: {
        walletId: wallet.walletId,
        tenantId,
        type: "CREDIT",
        amount: String(amount),
        referenceType: "ADMIN_TOPUP",
        referenceId: (req as any).user?.id,
      },
    });
    return w;
  });

  return res.status(200).json(new ApiResponse(200, updated, "Wallet topped up"));
});

// GET /admin/farmers?query=...  (search by id/username/email)
export const adminSearchFarmers = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = ((req as any).user?.tenantId as string | undefined) ?? "default";
  const q = String((req.query as any)?.query ?? "").trim();

  const farmers = await prisma.farmer.findMany({
    where: {
      tenantId,
      ...(q
        ? {
            OR: [
              { farmerId: { contains: q, mode: "insensitive" } },
              { username: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: { farmerId: true, username: true, email: true, fullName: true },
    take: 25,
    orderBy: { createdAt: "desc" },
  });

  return res.status(200).json(new ApiResponse(200, farmers, "Farmers fetched"));
});

// GET /admin/wallet/transactions?query=...  (filter by farmerId/username/email)
export const adminGetWalletTransactions = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = ((req as any).user?.tenantId as string | undefined) ?? "default";
  const q = String((req.query as any)?.query ?? "").trim();

  let farmerIds: string[] | undefined = undefined;
  if (q) {
    const farmers = await prisma.farmer.findMany({
      where: {
        tenantId,
        OR: [
          { farmerId: { contains: q, mode: "insensitive" } },
          { username: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { farmerId: true },
      take: 50,
    });
    farmerIds = farmers.map((f) => f.farmerId);
  }

  // WalletTransaction is linked to Wallet; Wallet links to farmerId.
  const txs = await prisma.walletTransaction.findMany({
    where: {
      tenantId,
      ...(farmerIds
        ? { wallet: { farmerId: { in: farmerIds } } }
        : {}),
    },
    include: {
      wallet: {
        select: {
          farmerId: true,
          farmer: { select: { username: true, email: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return res.status(200).json(new ApiResponse(200, txs, "Wallet transactions fetched"));
});
