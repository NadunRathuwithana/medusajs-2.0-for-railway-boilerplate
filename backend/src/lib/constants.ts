import { loadEnv } from "@medusajs/utils";

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
 * (optional) Koko Payment Gateway credentials (v1.05 — RSA form-POST API)
 * KOKO_API_KEY         — Merchant API Key
 * KOKO_MERCHANT_ID     — Merchant ID (_mId)
 * KOKO_BASE_URL        — API Base URL (QA: qaapi.paykoko.com, Prod: prodapi.paykoko.com)
 * KOKO_PRIVATE_KEY     — PEM RSA private key used to SIGN order requests
 * KOKO_PUBLIC_KEY      — PEM RSA public key from Koko, used to VERIFY webhook signatures
 * KOKO_PLUGIN_NAME     — Plugin identifier (e.g. cardle-medusa)
 * KOKO_PLUGIN_VERSION  — Plugin version (e.g. 1.0.0)
 * KOKO_RETURN_URL      — Browser redirect after successful payment
 * KOKO_CANCEL_URL      — Browser redirect if customer cancels
 * KOKO_RESPONSE_URL    — Server-to-server webhook URL Koko POSTs on payment completion
 */
export const KOKO_API_KEY = process.env.KOKO_API_KEY;
export const KOKO_MERCHANT_ID = process.env.KOKO_MERCHANT_ID;
export const KOKO_BASE_URL =
  process.env.KOKO_BASE_URL || "https://qaapi.paykoko.com";
export const KOKO_PRIVATE_KEY = process.env.KOKO_PRIVATE_KEY;
export const KOKO_PUBLIC_KEY = process.env.KOKO_PUBLIC_KEY;
export const KOKO_PLUGIN_NAME = process.env.KOKO_PLUGIN_NAME || "cardle-medusa";
export const KOKO_PLUGIN_VERSION = process.env.KOKO_PLUGIN_VERSION || "1.0.0";
export const KOKO_RETURN_URL = process.env.KOKO_RETURN_URL;
export const KOKO_CANCEL_URL = process.env.KOKO_CANCEL_URL;
export const KOKO_RESPONSE_URL = process.env.KOKO_RESPONSE_URL;

/**
 * (optional) Meilisearch configuration
 */
export const MEILISEARCH_HOST = process.env.MEILISEARCH_HOST;
export const MEILISEARCH_ADMIN_KEY = process.env.MEILISEARCH_ADMIN_KEY;

/**
 * (optional) Mintpay (Buy Now Pay Later) configuration
 *
 * MINTPAY_MERCHANT_ID     — Merchant ID obtained from Mintpay
 * MINTPAY_MERCHANT_SECRET — Merchant secret, sent as "Authorization: Token <secret>"
 * MINTPAY_ENV             — "sandbox" | "live" — selects the API base URL, defaults to "sandbox"
 * MINTPAY_SUCCESS_URL     — Browser redirect Mintpay sends the customer to after a successful payment
 * MINTPAY_FAIL_URL        — Browser redirect Mintpay sends the customer to after a failed/cancelled payment
 *
 * Neither redirect is trusted on its own — both return routes re-verify the
 * purchase status server-side via the status endpoint before marking an
 * order paid.
 */
export const MINTPAY_MERCHANT_ID = process.env.MINTPAY_MERCHANT_ID;
export const MINTPAY_MERCHANT_SECRET = process.env.MINTPAY_MERCHANT_SECRET;
export const MINTPAY_ENV =
  (process.env.MINTPAY_ENV as "sandbox" | "live" | undefined) ?? "sandbox";
export const MINTPAY_SUCCESS_URL = process.env.MINTPAY_SUCCESS_URL;
export const MINTPAY_FAIL_URL = process.env.MINTPAY_FAIL_URL;

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

/**
 * (optional) SMTP Email Configuration
 * SMTP_HOST     — SMTP server hostname (e.g. smtp.gmail.com)
 * SMTP_PORT     — SMTP port (465 for SSL, 587 for TLS)
 * SMTP_USER     — SMTP login username/email
 * SMTP_PASS     — SMTP login password or app password
 * SMTP_SECURE   — Use SSL/TLS (true for port 465)
 * SMTP_FROM     — Sender display address (defaults to SMTP_USER)
 * SMTP_ADMIN_EMAIL — Store admin email to receive contact form submissions
 */
export const SMTP_HOST = process.env.SMTP_HOST;
export const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 465;
export const SMTP_USER = process.env.SMTP_USER;
export const SMTP_PASS = process.env.SMTP_PASS;
export const SMTP_SECURE = process.env.SMTP_PORT === '465' || process.env.SMTP_SECURE?.toLowerCase() === 'true' || process.env.SMTP_SECURE === '1';
export const SMTP_FROM = process.env.SMTP_FROM || process.env.SMTP_USER;
export const SMTP_ADMIN_EMAIL = process.env.SMTP_ADMIN_EMAIL || process.env.SMTP_USER;

/**
 * ADMIN_EMAIL — Store admin inbox for receiving contact form submissions.
 * Provider-agnostic: works with both Resend and SMTP.
 * Set ADMIN_EMAIL in your environment variables.
 */
export const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL ||
  process.env.SMTP_ADMIN_EMAIL ||
  process.env.SMTP_USER ||
  "admin@cardle.lk";
