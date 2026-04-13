import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import { requireAdmin } from "../middlewares/admin.middleware";
import {
  approveLease,
  createTenant,
  getAdminDashboard,
  getPendingLeases,
  rejectLease,
  setUserRole,
  getApprovedLeases,
  getAllLeasesAdmin,
  updateLeaseStatusAdmin,
  updateLeaseAdmin,
  deleteLeaseAdmin,
} from "../controllers/admin.controller";
import { adminGetWalletTransactions, adminSearchFarmers, adminTopupWallet } from "../controllers/wallet.controller";
import { deleteOrderAdmin, getAllOrdersAdmin, getOrderByIdAdmin, updateOrderAdmin, updateOrderStatusAdmin } from "../controllers/order.controller";
import { adminCreateCrop, adminDeleteCrop, adminListCrops, adminUpdateCrop } from "../controllers/admin.crop.controller";

const router = Router();

router.use(verifyJWT, requireAdmin);

router.get("/dashboard", getAdminDashboard);

router.get("/leases/pending", getPendingLeases);
router.get("/leases/approved", getApprovedLeases);
router.get("/leases", getAllLeasesAdmin);
router.post("/leases/:leaseId/approve", approveLease);
router.post("/leases/:leaseId/reject", rejectLease);
router.patch("/leases/:leaseId/status", updateLeaseStatusAdmin);
router.put("/leases/:leaseId", updateLeaseAdmin);
router.delete("/leases/:leaseId", deleteLeaseAdmin);

router.post("/wallet/topup", adminTopupWallet);
router.get("/farmers", adminSearchFarmers);
router.get("/wallet/transactions", adminGetWalletTransactions);

router.get("/orders", getAllOrdersAdmin);
router.get("/orders/:orderId", getOrderByIdAdmin);
router.patch("/orders/:orderId/status", updateOrderStatusAdmin);
router.put("/orders/:orderId", updateOrderAdmin);
router.delete("/orders/:orderId", deleteOrderAdmin);

// Crop management (admin)
router.get("/crops", adminListCrops);
router.post("/crops", adminCreateCrop);
router.patch("/crops/:cropId", adminUpdateCrop);
router.delete("/crops/:cropId", adminDeleteCrop);

// Crops (Admin CRUD)
router.get("/crops", adminListCrops);
router.post("/crops", adminCreateCrop);
router.patch("/crops/:cropId", adminUpdateCrop);
router.delete("/crops/:cropId", adminDeleteCrop);

router.post("/users/:farmerId/role", setUserRole);
router.post("/tenants", createTenant);

export default router;
