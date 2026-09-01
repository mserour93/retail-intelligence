import { Router } from "express";
import { authMiddleware } from "../rbac/authMiddleware.js";
import { logIngestion } from "../ingestion/log.js";

export const ingestionRouter = Router();
ingestionRouter.use(authMiddleware);

/**
 * Data ingestion API stubs (spec §51). These validate shape, honor an
 * idempotency key, and log the attempt to the Data Control Center — they do
 * NOT currently write into the engines' in-memory dataset (see
 * docs/ROADMAP.md). Wiring a real POS/ERP feed here means replacing
 * data/generate.ts's static arrays with a repository this router writes to.
 */
function makeIngestEndpoint(name: string, requiredFields: string[]) {
  return (req: import("express").Request, res: import("express").Response) => {
    const body = req.body;
    const records: unknown[] = Array.isArray(body) ? body : body ? [body] : [];
    const idempotencyKey = req.header("idempotency-key") ?? undefined;
    const errors: string[] = [];

    if (records.length === 0) errors.push("Request body must be a record or a non-empty array of records.");
    records.forEach((r, i) => {
      if (typeof r !== "object" || r === null) {
        errors.push(`Record ${i}: must be an object.`);
        return;
      }
      for (const field of requiredFields) {
        if (!(field in (r as Record<string, unknown>))) errors.push(`Record ${i}: missing required field "${field}".`);
      }
    });

    const entry = logIngestion(`/api/v1/${name}`, records.length, idempotencyKey, errors.length ? errors : undefined);

    if (entry.status === "duplicate") {
      return res.status(200).json({ status: "duplicate", message: "Idempotency key already processed.", entry });
    }
    if (entry.status === "rejected") {
      return res.status(400).json({ status: "rejected", errors, entry });
    }
    res.status(202).json({ status: "accepted", recordCount: records.length, entry });
  };
}

ingestionRouter.post("/sales", makeIngestEndpoint("sales", ["storeId", "date", "netSales"]));
ingestionRouter.post("/transactions", makeIngestEndpoint("transactions", ["storeId", "date", "transactionId"]));
ingestionRouter.post("/inventory", makeIngestEndpoint("inventory", ["storeId", "productId", "stockUnits"]));
ingestionRouter.post("/products", makeIngestEndpoint("products", ["sku", "name", "categoryId"]));
ingestionRouter.post("/stores", makeIngestEndpoint("stores", ["code", "name", "areaId"]));
ingestionRouter.post("/categories", makeIngestEndpoint("categories", ["name"]));
ingestionRouter.post("/customers", makeIngestEndpoint("customers", ["customerId"]));
ingestionRouter.post("/promotions", makeIngestEndpoint("promotions", ["promotionId", "categoryId"]));
ingestionRouter.post("/purchases", makeIngestEndpoint("purchases", ["supplierId", "productId", "quantity"]));
ingestionRouter.post("/suppliers", makeIngestEndpoint("suppliers", ["name"]));
ingestionRouter.post("/employees", makeIngestEndpoint("employees", ["employeeId", "storeId"]));
ingestionRouter.post("/ecommerce/orders", makeIngestEndpoint("ecommerce/orders", ["orderId", "netSales"]));
ingestionRouter.post("/marketing", makeIngestEndpoint("marketing", ["campaignId", "spend"]));
