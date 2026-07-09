import { MedusaApp } from "@medusajs/modules-sdk";
import { Modules } from "@medusajs/framework/utils";

async function run() {
  const { modules } = await MedusaApp({
    sharedResourcesConfig: {
      database: {
        clientUrl: process.env.DATABASE_URL || "postgres://postgres:password@127.0.0.1:5432/cardle_db",
      },
    },
    modulesConfig: {
      [Modules.ORDER]: { resolve: "@medusajs/order" },
    }
  });

  const orderModuleService = modules[Modules.ORDER] as any;
  
  // Find any order ID first
  const [orders] = await orderModuleService.listOrders({}, { take: 1 });
  if (!orders || orders.length === 0) {
    console.log("No orders found");
    return;
  }
  
  try {
    const order = await orderModuleService.retrieveOrder(orders[0].id, {
      relations: [
        "items",
        "summary",
        "shipping_address",
        "payment_collections",
        "payment_collections.payments",
      ],
    });
    console.log("Success:", !!order);
  } catch (err: any) {
    console.error("Error retrieving order:", err.message);
    if (err.stack) console.error(err.stack);
  }
}
run();
