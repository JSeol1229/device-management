import { sql } from "drizzle-orm";
import { pgTable, serial, varchar, timestamp, text, numeric, jsonb, boolean, integer, index } from "drizzle-orm/pg-core";
import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";

// 设备表
export const devices = pgTable(
  "devices",
  {
    id: serial().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    model: varchar("model", { length: 255 }),
    manufacturer: varchar("manufacturer", { length: 255 }).notNull(), // 厂家名称
    serial_number: varchar("serial_number", { length: 255 }),
    purchase_date: timestamp("purchase_date", { withTimezone: true }),
    status: varchar("status", { length: 50 }).default("正常").notNull(),
    description: text("description"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("devices_status_idx").on(table.status),
    index("devices_manufacturer_idx").on(table.manufacturer),
  ]
);

// 维修记录表
export const maintenance_records = pgTable(
  "maintenance_records",
  {
    id: serial().primaryKey(),
    device_id: integer("device_id").notNull().references(() => devices.id, { onDelete: "cascade" }),
    maintenance_type: varchar("maintenance_type", { length: 20 }).notNull(), // 本厂维修/非本厂维修
    description: text("description").notNull(),
    maintenance_date: timestamp("maintenance_date", { withTimezone: true }).notNull(),
    cost: numeric("cost", { precision: 10, scale: 2 }),
    technician: varchar("technician", { length: 255 }),
    photos: jsonb("photos").$type<string[]>(), // 照片URL数组
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("maintenance_records_device_id_idx").on(table.device_id),
    index("maintenance_records_maintenance_date_idx").on(table.maintenance_date),
    index("maintenance_records_maintenance_type_idx").on(table.maintenance_type),
  ]
);

// 保养记录表
export const service_records = pgTable(
  "service_records",
  {
    id: serial().primaryKey(),
    device_id: integer("device_id").notNull().references(() => devices.id, { onDelete: "cascade" }),
    service_type: varchar("service_type", { length: 20 }).notNull(), // 本厂保养/非本厂保养
    description: text("description").notNull(),
    service_date: timestamp("service_date", { withTimezone: true }).notNull(),
    technician: varchar("technician", { length: 255 }),
    photos: jsonb("photos").$type<string[]>(), // 照片URL数组
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("service_records_device_id_idx").on(table.device_id),
    index("service_records_service_date_idx").on(table.service_date),
    index("service_records_service_type_idx").on(table.service_type),
  ]
);

// 检测提醒表
export const inspection_reminders = pgTable(
  "inspection_reminders",
  {
    id: serial().primaryKey(),
    device_id: integer("device_id").notNull().references(() => devices.id, { onDelete: "cascade" }),
    reminder_date: timestamp("reminder_date", { withTimezone: true }).notNull(),
    description: text("description").notNull(),
    status: varchar("status", { length: 20 }).default("待提醒").notNull(), // 待提醒/已提醒/已完成
    is_notified: boolean("is_notified").default(false).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("inspection_reminders_device_id_idx").on(table.device_id),
    index("inspection_reminders_reminder_date_idx").on(table.reminder_date),
    index("inspection_reminders_status_idx").on(table.status),
  ]
);

export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});
