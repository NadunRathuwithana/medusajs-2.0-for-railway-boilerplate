import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

async function logRequest(req: MedusaRequest) {
  let logger;
  try {
    logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
  } catch (error) {
    try {
      logger = req.scope.resolve("logger");
    } catch (e) {
      logger = console;
    }
  }

  const logData = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    headers: req.headers,
    query: req.query,
    body: req.body,
    params: req.params,
  };

  if (logger && typeof logger.info === "function") {
    logger.info("Incoming request: " + JSON.stringify(logData, null, 2));
  } else {
    console.log("Incoming request: " + JSON.stringify(logData, null, 2));
  }

  // Check if this is a OnePay callback and has a transaction_id
  const transactionId = req.body?.transaction_id;
  const appId = process.env.ONEPAY_APP_ID;

  if (transactionId && appId) {
    if (logger && typeof logger.info === "function") {
      logger.info(`Querying OnePay transaction status for transaction_id: ${transactionId}`);
    } else {
      console.log(`Querying OnePay transaction status for transaction_id: ${transactionId}`);
    }

    try {
      const response = await fetch("https://api.onepay.lk/v3/transaction/status/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          app_id: appId,
          onepay_transaction_id: transactionId,
        }),
      });

      const responseData = await response.json();

      if (logger && typeof logger.info === "function") {
        logger.info("OnePay Transaction Status Response: " + JSON.stringify(responseData, null, 2));
      } else {
        console.log("OnePay Transaction Status Response: " + JSON.stringify(responseData, null, 2));
      }
    } catch (error) {
      if (logger && typeof logger.error === "function") {
        logger.error("Error querying OnePay transaction status: " + error.message);
      } else {
        console.error("Error querying OnePay transaction status:", error);
      }
    }
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  await logRequest(req)
  res.status(200).json({ success: true, message: "Data logged successfully" })
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  await logRequest(req)
  res.status(200).json({ success: true, message: "Data logged successfully" })
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  await logRequest(req)
  res.status(200).json({ success: true, message: "Data logged successfully" })
}

export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  await logRequest(req)
  res.status(200).json({ success: true, message: "Data logged successfully" })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  await logRequest(req)
  res.status(200).json({ success: true, message: "Data logged successfully" })
}
