import { MedusaApp } from "@medusajs/modules-sdk";
import { Modules } from "@medusajs/framework/utils";

async function run() {
  try {
    const { modules } = await MedusaApp({
      sharedResourcesConfig: {},
      modulesConfig: {
        [Modules.NOTIFICATION]: {
          resolve: "@medusajs/notification",
          options: {
            providers: [
              {
                resolve: "./src/modules/email-notifications",
                id: "resend",
                options: {
                  channels: ["email"],
                  api_key: "test",
                  from: "test@test.com",
                },
              },
            ],
          },
        },
      },
    });
    
    const notificationModule = modules[Modules.NOTIFICATION];
    await notificationModule.createNotifications({
      to: "test@test.com",
      channel: "email",
      template: "order.placed",
      data: {}
    });
    console.log("Success");
  } catch (err: any) {
    console.error("Error:", err);
  }
}
run();
