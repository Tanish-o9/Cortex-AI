import express from "express";
import { createOrder, verifyPayment } from "../controllers/billing.controller.js";
import { getEnterpriseAnalytics, exportAnalyticsCSV } from "../controllers/analytics.controller.js";

const router = express.Router();

router.post(
    "/create-order",
    createOrder
);
router.post(
    "/verify-payment",
    verifyPayment
);

// Analytics endpoints
router.get("/analytics", getEnterpriseAnalytics);
router.get("/analytics/export", exportAnalyticsCSV);

export default router;