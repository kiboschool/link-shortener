const { sql } = require('drizzle-orm');
const { int, sqliteTable, text } = require("drizzle-orm/sqlite-core");

module.exports = {
  urls: sqliteTable("urls", {
    id: int().primaryKey({ autoIncrement: true }),
    original: text().notNull(),
    shortened: text().notNull(),
    created_at: text('timestamp').notNull().default(sql`(current_timestamp)`),
  }),
}
