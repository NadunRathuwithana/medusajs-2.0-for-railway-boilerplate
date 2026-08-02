import { loadEnv, Modules, defineConfig } from "@medusajs/utils";
import {
  ADMIN_CORS,
  AUTH_CORS,
  BACKEND_URL,
  COOKIE_SECRET,
  DATABASE_URL,
  JWT_SECRET,
  REDIS_URL,
  SHOULD_DISABLE_ADMIN,
  STORE_CORS,
  STRIPE_API_KEY,
  STRIPE_WEBHOOK_SECRET,
  ONEPAY_APP_ID,
  ONEPAY_TOKEN,
  ONEPAY_HASH_SALT,
  ONEPAY_BASE_URL,
  ONEPAY_REDIRECT_URL,
  KOKO_API_KEY,
  KOKO_MERCHANT_ID,
  KOKO_BASE_URL,
  KOKO_PRIVATE_KEY,
  KOKO_PUBLIC_KEY,
  KOKO_PLUGIN_NAME,
  KOKO_PLUGIN_VERSION,
  KOKO_RETURN_URL,
  KOKO_CANCEL_URL,
  KOKO_RESPONSE_URL,
  MINTPAY_MERCHANT_ID,
  MINTPAY_MERCHANT_SECRET,
  MINTPAY_ENV,
  MINTPAY_BASE_URL,
  MINTPAY_SUCCESS_URL,
  MINTPAY_FAIL_URL,
  WORKER_MODE,
  MINIO_ENDPOINT,
  MINIO_ACCESS_KEY,
  MINIO_SECRET_KEY,
  MINIO_BUCKET,
  MEILISEARCH_HOST,
  MEILISEARCH_ADMIN_KEY,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_SECURE,
  SMTP_FROM,
  SMTP_ADMIN_EMAIL,
  RESEND_API_KEY,
  RESEND_FROM_EMAIL,
} from "lib/constants";

loadEnv(process.env.NODE_ENV, process.cwd());

const medusaConfig = {
  projectConfig: {
    databaseUrl: DATABASE_URL,
    databaseLogging: false,
    redisUrl: REDIS_URL,
    workerMode: WORKER_MODE,
    http: {
      adminCors: ADMIN_CORS,
      authCors: AUTH_CORS,
      storeCors: STORE_CORS,
      jwtSecret: JWT_SECRET,
      cookieSecret: COOKIE_SECRET,
    },
    build: {
      rollupOptions: {
        external: ["@medusajs/dashboard", "@medusajs/admin-shared"],
      },
    },
  },
  admin: {
    backendUrl: BACKEND_URL,
    disable: SHOULD_DISABLE_ADMIN,
  },
  modules: [
    {
      key: Modules.FILE,
      resolve: "@medusajs/file",
      options: {
        providers: [
          ...(MINIO_ENDPOINT && MINIO_ACCESS_KEY && MINIO_SECRET_KEY
            ? [
                {
                  resolve: "./src/modules/minio-file",
                  id: "minio",
                  options: {
                    endPoint: MINIO_ENDPOINT,
                    accessKey: MINIO_ACCESS_KEY,
                    secretKey: MINIO_SECRET_KEY,
                    bucket: MINIO_BUCKET, // Optional, default: medusa-media
                  },
                },
              ]
            : [
                {
                  resolve: "@medusajs/file-local",
                  id: "local",
                  options: {
                    upload_dir: "static",
                    backend_url: `${BACKEND_URL}/static`,
                  },
                },
              ]),
        ],
      },
    },
    ...(REDIS_URL
      ? [
          {
            key: Modules.EVENT_BUS,
            resolve: "@medusajs/event-bus-redis",
            options: {
              redisUrl: REDIS_URL,
            },
          },
          {
            key: Modules.WORKFLOW_ENGINE,
            resolve: "@medusajs/workflow-engine-redis",
            options: {
              redis: {
                url: REDIS_URL,
              },
            },
          },
        ]
      : []),
    // Notification module — the "local" provider handles the "feed" channel, which
    // powers the admin UI's in-app notifications (e.g. the order/product export
    // "download ready" notification). It must always be registered, regardless of
    // whether email credentials are configured, or those admin notifications break.
    {
      key: Modules.NOTIFICATION,
      resolve: "@medusajs/notification",
      options: {
        providers: [
          {
            resolve: "@medusajs/notification-local",
            id: "local",
            options: {
              name: "Local Notification Provider",
              channels: ["feed"],
            },
          },
          // Notification provider via Resend — only included when Resend credentials are set
          // TODO: MUST change onboarding@resend.dev to a verified cardle.lk address (e.g. hello@cardle.lk) before going live with real customers!
          ...(RESEND_API_KEY && RESEND_FROM_EMAIL
            ? [
                {
                  resolve: "./src/modules/email-notifications",
                  id: "resend",
                  options: {
                    channels: ["email"],
                    api_key: RESEND_API_KEY,
                    from: RESEND_FROM_EMAIL,
                  },
                },
              ]
            : []),
          // Notification provider via SMTP/Nodemailer — only included when SMTP credentials are set
          ...(!RESEND_API_KEY && SMTP_HOST && SMTP_USER && SMTP_PASS
            ? [
                {
                  resolve: "./src/modules/email-notifications",
                  id: "smtp",
                  options: {
                    channels: ["email"],
                    host: SMTP_HOST,
                    port: SMTP_PORT,
                    user: SMTP_USER,
                    pass: SMTP_PASS,
                    secure: SMTP_SECURE,
                    from: SMTP_FROM,
                    adminEmail: SMTP_ADMIN_EMAIL,
                  },
                },
              ]
            : []),
        ],
      },
    },
    // Payment providers (Stripe + OnePay) — only included when env vars are set
    ...(() => {
      const paymentProviders = [];

      if (STRIPE_API_KEY && STRIPE_WEBHOOK_SECRET) {
        paymentProviders.push({
          resolve: "@medusajs/payment-stripe",
          id: "stripe",
          options: {
            apiKey: STRIPE_API_KEY,
            webhookSecret: STRIPE_WEBHOOK_SECRET,
          },
        });
      }

      if (ONEPAY_APP_ID && ONEPAY_HASH_SALT && ONEPAY_TOKEN) {
        paymentProviders.push({
          resolve: "./src/modules/onepay-payment",
          id: "onepay",
          options: {
            appId: ONEPAY_APP_ID,
            token: ONEPAY_TOKEN,
            hashSalt: ONEPAY_HASH_SALT,
            baseUrl: ONEPAY_BASE_URL,
            redirectUrl: ONEPAY_REDIRECT_URL,
          },
        });
      }

      if (KOKO_API_KEY && KOKO_PRIVATE_KEY && KOKO_MERCHANT_ID) {
        paymentProviders.push({
          resolve: "./src/modules/koko-payment",
          id: "koko",
          options: {
            baseUrl: KOKO_BASE_URL,
            merchantId: KOKO_MERCHANT_ID,
            apiKey: KOKO_API_KEY,
            privateKey: KOKO_PRIVATE_KEY,
            kokoPublicKey: KOKO_PUBLIC_KEY,
            pluginName: KOKO_PLUGIN_NAME,
            pluginVersion: KOKO_PLUGIN_VERSION,
            returnUrl: KOKO_RETURN_URL,
            cancelUrl: KOKO_CANCEL_URL,
            responseUrl: KOKO_RESPONSE_URL,
          },
        });
      }

      if (MINTPAY_MERCHANT_ID && MINTPAY_MERCHANT_SECRET) {
        paymentProviders.push({
          resolve: "./src/modules/mintpay-payment",
          id: "mintpay",
          options: {
            merchantId: MINTPAY_MERCHANT_ID,
            merchantSecret: MINTPAY_MERCHANT_SECRET,
            env: MINTPAY_ENV,
            baseUrl: MINTPAY_BASE_URL,
            successUrl: MINTPAY_SUCCESS_URL,
            failUrl: MINTPAY_FAIL_URL,
          },
        });
      }

      if (paymentProviders.length === 0) {
        console.log("No payment providers were registered. Check if environment variables are set correctly.");
        return [];
      }

      console.log("Registered payment providers in config:", paymentProviders.map(p => p.id));

      return [
        {
          key: Modules.PAYMENT,
          resolve: "@medusajs/payment",
          options: {
            providers: paymentProviders,
          },
        },
      ];
    })(),
  ],
  plugins: [
    ...(MEILISEARCH_HOST && MEILISEARCH_ADMIN_KEY
      ? [
          {
            resolve: "@rokmohar/medusa-plugin-meilisearch",
            options: {
              config: {
                host: MEILISEARCH_HOST,
                apiKey: MEILISEARCH_ADMIN_KEY,
              },
              settings: {
                products: {
                  type: "products",
                  enabled: true,
                  fields: [
                    "id",
                    "title",
                    "description",
                    "handle",
                    "variant_sku",
                    "thumbnail",
                  ],
                  indexSettings: {
                    searchableAttributes: [
                      "title",
                      "description",
                      "variant_sku",
                    ],
                    displayedAttributes: [
                      "id",
                      "handle",
                      "title",
                      "description",
                      "variant_sku",
                      "thumbnail",
                    ],
                    filterableAttributes: ["id", "handle"],
                  },
                  primaryKey: "id",
                },
              },
            },
          },
        ]
      : []),
  ],
};

export default defineConfig(medusaConfig);
