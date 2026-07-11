import { MedusaApp } from "@medusajs/modules-sdk";
import { Modules } from "@medusajs/framework/utils";
import orderPlacedHandler from "./src/subscribers/order-placed";

async function run() {
  const { modules } = await MedusaApp({
    sharedResourcesConfig: {},
    modulesConfig: {
      [Modules.ORDER]: { resolve: "@medusajs/order" },
      [Modules.NOTIFICATION]: {
        resolve: "@medusajs/notification",
        options: {
          providers: [
            {
              resolve: "./src/modules/email-notifications",
              id: "resend",
              options: { channels: ["email"], api_key: "test", from: "test" }
            }
          ]
        }
      }
    }
  });

  const container = {
    resolve: (name: string) => {
      return modules[name];
    }
  };

  try {
    await orderPlacedHandler({ event: { data: { id: "test" }, name: "order.placed" }, container } as any);
  } catch (err: any) {
    console.error("Subscriber Error:", err);
  }
}
run();
