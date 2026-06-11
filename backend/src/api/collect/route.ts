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
    logger.info(JSON.stringify(logData, null, 2));
  } else {
    console.log(JSON.stringify(logData, null, 2));
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
