import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261108212445 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "addon_product" drop constraint if exists "addon_product_addon_id_product_id_unique";`);
    this.addSql(`create table if not exists "addon" ("id" text not null, "name" text not null, "description" text null, "price" integer not null default 0, "image" text null, "is_active" boolean not null default true, "sort_order" integer not null default 0, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "addon_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_addon_deleted_at" ON "addon" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "addon_product" ("id" text not null, "addon_id" text not null, "product_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "addon_product_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_addon_product_deleted_at" ON "addon_product" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_addon_product_addon_id_product_id_unique" ON "addon_product" ("addon_id", "product_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_addon_product_product_id" ON "addon_product" ("product_id") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "packing_option" ("id" text not null, "name" text not null, "description" text null, "price" integer not null default 0, "image" text null, "is_default" boolean not null default false, "is_active" boolean not null default true, "sort_order" integer not null default 0, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "packing_option_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_packing_option_deleted_at" ON "packing_option" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "addon" cascade;`);

    this.addSql(`drop table if exists "addon_product" cascade;`);

    this.addSql(`drop table if exists "packing_option" cascade;`);
  }

}
