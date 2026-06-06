import { loadEnv, Modules, defineConfig } from "@medusajs/utils";
import {
  ADMIN_CORS,
  AUTH_CORS,
  BACKEND_URL,
  COOKIE_SECRET,
  DATABASE_URL,
  JWT_SECRET,
  REDIS_URL,
  RESEND_API_KEY,
  RESEND_FROM_EMAIL,
  SENDGRID_API_KEY,
  SENDGRID_FROM_EMAIL,
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
  KOKO_API_SECRET,
  KOKO_MERCHANT_ID,
  KOKO_BASE_URL,
  KOKO_WEBHOOK_SECRET,
  KOKO_SUCCESS_URL,
  KOKO_CANCEL_URL,
  WORKER_MODE,
  MINIO_ENDPOINT,
  MINIO_ACCESS_KEY,
  MINIO_SECRET_KEY,
  MINIO_BUCKET,
  MEILISEARCH_HOST,
  MEILISEARCH_ADMIN_KEY,
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
    ...((SENDGRID_API_KEY && SENDGRID_FROM_EMAIL) ||
    (RESEND_API_KEY && RESEND_FROM_EMAIL)
      ? [
          {
            key: Modules.NOTIFICATION,
            resolve: "@medusajs/notification",
            options: {
              providers: [
                ...(SENDGRID_API_KEY && SENDGRID_FROM_EMAIL
                  ? [
                      {
                        resolve: "@medusajs/notification-sendgrid",
                        id: "sendgrid",
                        options: {
                          channels: ["email"],
                          api_key: SENDGRID_API_KEY,
                          from: SENDGRID_FROM_EMAIL,
                        },
                      },
                    ]
                  : []),
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
              ],
            },
          },
        ]
      : []),
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

      if (KOKO_API_KEY && KOKO_API_SECRET && KOKO_MERCHANT_ID) {
        paymentProviders.push({
          resolve: "./src/modules/koko-payment",
          id: "koko",
          options: {
            apiKey: KOKO_API_KEY,
            apiSecret: KOKO_API_SECRET,
            merchantId: KOKO_MERCHANT_ID,
            baseUrl: KOKO_BASE_URL,
            webhookSecret: KOKO_WEBHOOK_SECRET,
            successUrl: KOKO_SUCCESS_URL,
            cancelUrl: KOKO_CANCEL_URL,
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
