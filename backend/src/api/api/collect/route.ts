import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules, PaymentWebhookEvents } from "@medusajs/framework/utils"

async function processPaymentCollect(req: MedusaRequest) {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER) || console;
  
  const logData = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    headers: req.headers,
    query: req.query,
    body: req.body,
    params: req.params,
  };

  logger.info("Incoming request to collect: " + JSON.stringify(logData, null, 2));

  const transactionId = ((req.body as any)?.transaction_id || req.query?.transaction_id) as string | undefined;
  const appId = process.env.ONEPAY_APP_ID;
  const onepayToken = process.env.ONEPAY_TOKEN;

  let queryResult: any = null;

  if (transactionId && appId && onepayToken) {
    logger.info(`Querying OnePay transaction status for transaction_id: ${transactionId}`);

    try {
      const response = await fetch("https://api.onepay.lk/v3/transaction/status/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": onepayToken,
        },
        body: JSON.stringify({
          app_id: appId,
          onepay_transaction_id: transactionId,
        }),
      });

      const responseData = await response.json();
      logger.info("OnePay Transaction Status Response: " + JSON.stringify(responseData, null, 2));

      if (responseData.status === 200 && responseData.data?.status === true) {
        queryResult = responseData.data;

        // Resolve Medusa Payment Module
        const paymentModuleService = req.scope.resolve(Modules.PAYMENT);
        
        // Find matching payment session (since Payment record is only created post-capture)
        const allSessions = await paymentModuleService.listPaymentSessions({}, {
          take: 100
        });

        const session = allSessions.find((s: any) => s.data?.ipg_transaction_id === transactionId);

        if (session) {
          logger.info(`Found Medusa payment session with ID: ${session.id}`);

          // Emit the WebhookReceived event to let Medusa process it natively
          const eventBus = req.scope.resolve(Modules.EVENT_BUS);
          await eventBus.emit({
            name: PaymentWebhookEvents.WebhookReceived,
            data: {
              provider: "pp_onepay_onepay",
              payload: {
                data: {
                  ...req.body,
                  additional_data: session.id,
                },
                rawData: JSON.stringify({
                  ...req.body,
                  additional_data: session.id,
                }),
                headers: req.headers as Record<string, unknown>,
              },
            },
          });
          logger.info(`Emitted WebhookReceived event for session: ${session.id}`);
        } else {
          // Check if already captured/completed as a Payment
          const allPayments = await paymentModuleService.listPayments({}, {
            take: 100
          });
          const payment = allPayments.find((p: any) => p.data?.ipg_transaction_id === transactionId);

          if (payment) {
            logger.info(`Payment already completed/captured for transaction ID: ${transactionId}`);
          } else {
            logger.warn(`No payment or payment session found in Medusa matching transaction ID: ${transactionId}`);
          }
        }
      }
    } catch (error: any) {
      logger.error("Error processing OnePay transaction status update: " + error.message);
    }
  }

  return { transactionId, queryResult };
}

function renderSuccessPage(transactionId: string, amount: string, currency: string, dateTime: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Successful</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0b0f19;
      --card-bg: rgba(255, 255, 255, 0.03);
      --card-border: rgba(255, 255, 255, 0.08);
      --primary: #10b981;
      --primary-glow: rgba(16, 185, 129, 0.2);
      --text: #ffffff;
      --text-muted: #94a3b8;
    }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: 'Outfit', sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      backdrop-filter: blur(20px);
      border-radius: 24px;
      padding: 40px;
      width: 100%;
      max-width: 480px;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0,0,0,0.3);
      animation: fadeIn 0.6s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .icon-wrapper {
      width: 80px;
      height: 80px;
      background: var(--primary-glow);
      border: 2px solid var(--primary);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      color: var(--primary);
      box-shadow: 0 0 20px var(--primary-glow);
    }
    .icon-wrapper svg {
      width: 40px;
      height: 40px;
    }
    h1 {
      margin: 0 0 8px;
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    p.subtitle {
      color: var(--text-muted);
      margin: 0 0 32px;
      font-size: 16px;
      line-height: 1.5;
    }
    .details {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 32px;
      text-align: left;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
      font-size: 14px;
    }
    .detail-row:last-child {
      margin-bottom: 0;
    }
    .detail-label {
      color: var(--text-muted);
    }
    .detail-value {
      font-weight: 600;
    }
    .btn {
      display: inline-block;
      width: 100%;
      background: var(--primary);
      color: #000000;
      text-decoration: none;
      padding: 16px;
      border-radius: 14px;
      font-weight: 600;
      font-size: 16px;
      transition: all 0.2s;
      box-shadow: 0 4px 12px var(--primary-glow);
      box-sizing: border-box;
    }
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px var(--primary-glow);
      filter: brightness(1.1);
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon-wrapper">
      <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"></path>
      </svg>
    </div>
    <h1>Payment Successful</h1>
    <p class="subtitle">Thank you for your purchase! Your order is being processed.</p>
    
    <div class="details">
      <div class="detail-row">
        <span class="detail-label">Transaction ID</span>
        <span class="detail-value">${transactionId}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Amount Paid</span>
        <span class="detail-value">${amount} ${currency}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Date & Time</span>
        <span class="detail-value">${dateTime}</span>
      </div>
    </div>
    
    <a href="/" class="btn">Return to Store</a>
  </div>
</body>
</html>`;
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  await processPaymentCollect(req);
  res.status(200).json({ success: true, message: "Data logged and processed successfully" });
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { transactionId, queryResult } = await processPaymentCollect(req);

  const amount = queryResult?.amount ? String(queryResult.amount) : "N/A";
  const currency = queryResult?.currency ? String(queryResult.currency) : "LKR";
  const dateTime = queryResult?.paid_on ? String(queryResult.paid_on) : new Date().toLocaleString();

  const successHtml = renderSuccessPage(
    transactionId || "N/A",
    amount,
    currency,
    dateTime
  );

  res.setHeader("Content-Type", "text/html");
  res.status(200).send(successHtml);
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  await processPaymentCollect(req);
  res.status(200).json({ success: true, message: "Data logged and processed successfully" });
}

export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  await processPaymentCollect(req);
  res.status(200).json({ success: true, message: "Data logged and processed successfully" });
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  await processPaymentCollect(req);
  res.status(200).json({ success: true, message: "Data logged and processed successfully" });
}
