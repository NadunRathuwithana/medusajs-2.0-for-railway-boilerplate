import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261125000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`alter table if exists "cms_banner" add column if not exists "text_color" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "cms_banner" drop column if exists "text_color";`);
  }
}
