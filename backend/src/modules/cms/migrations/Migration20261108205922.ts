import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261108205922 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "cms_setting" drop constraint if exists "cms_setting_key_unique";`);
    this.addSql(`create table if not exists "cms_banner" ("id" text not null, "placement" text check ("placement" in ('hero', 'page', 'creative')) not null default 'hero', "page_key" text null, "slot_key" text null, "eyebrow" text null, "title" text null, "body" text null, "cta_label" text null, "cta_href" text null, "alt" text null, "image_desktop" text null, "image_tablet" text null, "image_mobile" text null, "sort_order" integer not null default 0, "is_active" boolean not null default true, "starts_at" timestamptz null, "ends_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "cms_banner_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_cms_banner_deleted_at" ON "cms_banner" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "cms_setting" ("id" text not null, "key" text not null, "value" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "cms_setting_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_cms_setting_key_unique" ON "cms_setting" ("key") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_cms_setting_deleted_at" ON "cms_setting" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "cms_banner" cascade;`);

    this.addSql(`drop table if exists "cms_setting" cascade;`);
  }

}
