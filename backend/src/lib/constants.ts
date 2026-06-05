import { loadEnv } from "@medusajs/framework/utils";

import { assertValue } from "utils/assert-value";

loadEnv(process.env.NODE_ENV || "development", process.cwd());

/**
 * Is development environment
 */
export const IS_DEV = process.env.NODE_ENV === "development";

/**
 * Public URL for the backend
 */
export const BACKEND_URL =
  process.env.BACKEND_PUBLIC_URL ??
  process.env.RAILWAY_PUBLIC_DOMAIN_VALUE ??
  "http://localhost:9000";

/**
 * Database URL for Postgres instance used by the backend
 */
export const DATABASE_URL = assertValue(
  process.env.DATABASE_URL,
  "Environment variable for DATABASE_URL is not set",
);

/**
 * (optional) Redis URL for Redis instance used by the backend
 */
export const REDIS_URL = process.env.REDIS_URL;

/**
 * Admin CORS origins
 */
export const ADMIN_CORS = process.env.ADMIN_CORS;

/**
 * Auth CORS origins
 */
export const AUTH_CORS = process.env.AUTH_CORS;

/**
 * Store/frontend CORS origins
 */
export const STORE_CORS = process.env.STORE_CORS;

/**
 * JWT Secret used for signing JWT tokens
 */
export const JWT_SECRET = assertValue(
  process.env.JWT_SECRET,
  "Environment variable for JWT_SECRET is not set",
);

/**
 * Cookie secret used for signing cookies
 */
export const COOKIE_SECRET = assertValue(
  process.env.COOKIE_SECRET,
  "Environment variable for COOKIE_SECRET is not set",
);

/**
 * (optional) Minio configuration for file storage
 */
export const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT;
export const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY;
export const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY;
export const MINIO_BUCKET = process.env.MINIO_BUCKET; // Optional, if not set bucket will be called: medusa-media

/**
 * (optional) Resend API Key and from Email - do not set if using SendGrid
 */
export const RESEND_API_KEY = process.env.RESEND_API_KEY;
export const RESEND_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || process.env.RESEND_FROM;

/**
 * (optionl) SendGrid API Key and from Email - do not set if using Resend
 */
export const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
export const SENDGRID_FROM_EMAIL =
  process.env.SENDGRID_FROM_EMAIL || process.env.SENDGRID_FROM;

/**
 * (optional) Stripe API key and webhook secret
 */
export const STRIPE_API_KEY = process.env.STRIPE_API_KEY;
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * (optional) OnePay Payment Gateway credentials
 * ONEPAY_APP_ID   — your unique application identifier from OnePay dashboard
 * ONEPAY_TOKEN    — API authorization token from OnePay dashboard
 * ONEPAY_HASH_SALT — secret used for SHA-256 hash generation (NEVER expose client-side)
 * ONEPAY_BASE_URL  — OnePay API base URL (defaults to live merchant API)
 * ONEPAY_REDIRECT_URL — URL to redirect customer back after payment
 */
export const ONEPAY_APP_ID = process.env.ONEPAY_APP_ID;
export const ONEPAY_TOKEN = process.env.ONEPAY_TOKEN;
export const ONEPAY_HASH_SALT = process.env.ONEPAY_HASH_SALT;
export const ONEPAY_BASE_URL =
  process.env.ONEPAY_BASE_URL || "https://merchant-api-live-v2.onepay.lk";
export const ONEPAY_REDIRECT_URL = process.env.ONEPAY_REDIRECT_URL;

/**
 * (optional) Koko Payment Gateway credentials
 * KOKO_API_KEY      — Merchant API Key
 * KOKO_API_SECRET   — Merchant API Secret for HMAC signature
 * KOKO_MERCHANT_ID  — Merchant ID
 * KOKO_BASE_URL     — API Base URL (defaults to sandbox)
 * KOKO_WEBHOOK_SECRET — Secret for webhook signature validation
 * KOKO_SUCCESS_URL  — URL to redirect customer back after payment
 * KOKO_CANCEL_URL   — URL to redirect customer back if payment is cancelled
 */
export const KOKO_API_KEY = process.env.KOKO_API_KEY;
export const KOKO_API_SECRET = process.env.KOKO_API_SECRET;
export const KOKO_MERCHANT_ID = process.env.KOKO_MERCHANT_ID;
export const KOKO_BASE_URL =
  process.env.KOKO_BASE_URL || "https://api-sandbox.paykoko.com";
export const KOKO_WEBHOOK_SECRET = process.env.KOKO_WEBHOOK_SECRET;
export const KOKO_SUCCESS_URL = process.env.KOKO_SUCCESS_URL;
export const KOKO_CANCEL_URL = process.env.KOKO_CANCEL_URL;

/**
 * (optional) Meilisearch configuration
 */
export const MEILISEARCH_HOST = process.env.MEILISEARCH_HOST;
export const MEILISEARCH_ADMIN_KEY = process.env.MEILISEARCH_ADMIN_KEY;

/**
 * Worker mode
 */
export const WORKER_MODE =
  (process.env.MEDUSA_WORKER_MODE as
    | "worker"
    | "server"
    | "shared"
    | undefined) ?? "shared";

/**
 * Disable Admin
 */
export const SHOULD_DISABLE_ADMIN = process.env.MEDUSA_DISABLE_ADMIN === "true";
