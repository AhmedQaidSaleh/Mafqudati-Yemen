import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  uuid,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const roleEnum = pgEnum("role", ["USER", "ADMIN"]);
export const reportTypeEnum = pgEnum("report_type", ["lost", "found"]);
export const reportStatusEnum = pgEnum("report_status", ["active", "resolved", "closed"]);

// Users Table (replaces public.profiles / auth.users)
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    firebase_uid: varchar("firebase_uid", { length: 128 }).notNull().unique(),
    email: varchar("email", { length: 255 }).notNull(),
    full_name: varchar("full_name", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 50 }),
    role: roleEnum("role").default("USER").notNull(),
    avatar_url: text("avatar_url"),
    fcm_token: text("fcm_token"),
    is_restricted: boolean("is_restricted").default(false).notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("firebase_uid_idx").on(table.firebase_uid)],
);

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  name_ar: varchar("name_ar", { length: 255 }).notNull(),
  name_en: varchar("name_en", { length: 255 }),
  icon: varchar("icon", { length: 100 }),
});

export const governorates = pgTable("governorates", {
  id: serial("id").primaryKey(),
  name_ar: varchar("name_ar", { length: 255 }).notNull(),
  name_en: varchar("name_en", { length: 255 }),
});

export const districts = pgTable("districts", {
  id: serial("id").primaryKey(),
  governorate_id: integer("governorate_id")
    .notNull()
    .references(() => governorates.id),
  name_ar: varchar("name_ar", { length: 255 }).notNull(),
  name_en: varchar("name_en", { length: 255 }),
});

export const reports = pgTable("reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id),
  type: reportTypeEnum("type").notNull(),
  status: reportStatusEnum("status").default("active").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category_id: integer("category_id")
    .notNull()
    .references(() => categories.id),
  governorate_id: integer("governorate_id")
    .notNull()
    .references(() => governorates.id),
  district_id: integer("district_id").references(() => districts.id),
  location_text: text("location_text"),
  latitude: varchar("latitude", { length: 50 }),
  longitude: varchar("longitude", { length: 50 }),
  incident_date: timestamp("incident_date"),
  brand: varchar("brand", { length: 255 }),
  color: varchar("color", { length: 100 }),
  keywords: text("keywords").array(),
  notes: text("notes"),
  contact_preference: varchar("contact_preference", { length: 50 }).default("in_app"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const reportImages = pgTable("report_images", {
  id: uuid("id").defaultRandom().primaryKey(),
  report_id: uuid("report_id")
    .notNull()
    .references(() => reports.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  public_id: varchar("public_id", { length: 255 }).notNull(),
  sort_order: integer("sort_order").default(0).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const savedReports = pgTable("saved_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  report_id: uuid("report_id")
    .notNull()
    .references(() => reports.id, { onDelete: "cascade" }),
  created_at: timestamp("created_at").defaultNow().notNull(),
}, (table) => [uniqueIndex("user_report_idx").on(table.user_id, table.report_id)]);

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  report_id: uuid("report_id")
    .notNull()
    .references(() => reports.id, { onDelete: "cascade" }),
  sender_id: uuid("sender_id")
    .notNull()
    .references(() => users.id),
  receiver_id: uuid("receiver_id")
    .notNull()
    .references(() => users.id),
  body: text("body").notNull(),
  read_at: timestamp("read_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  read_at: timestamp("read_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  reports: many(reports),
  savedReports: many(savedReports),
  sentMessages: many(messages, { relationName: "sender" }),
  receivedMessages: many(messages, { relationName: "receiver" }),
  notifications: many(notifications),
}));

export const reportsRelations = relations(reports, ({ one, many }) => ({
  author: one(users, {
    fields: [reports.user_id],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [reports.category_id],
    references: [categories.id],
  }),
  governorate: one(governorates, {
    fields: [reports.governorate_id],
    references: [governorates.id],
  }),
  district: one(districts, {
    fields: [reports.district_id],
    references: [districts.id],
  }),
  images: many(reportImages),
  savedBy: many(savedReports),
  messages: many(messages),
}));
export const reportImagesRelations = relations(reportImages, ({ one }) => ({
  report: one(reports, {
    fields: [reportImages.report_id],
    references: [reports.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  reports: many(reports),
}));

export const governoratesRelations = relations(governorates, ({ many }) => ({
  reports: many(reports),
  districts: many(districts),
}));

export const districtsRelations = relations(districts, ({ one, many }) => ({
  governorate: one(governorates, {
    fields: [districts.governorate_id],
    references: [governorates.id],
  }),
  reports: many(reports),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  report: one(reports, {
    fields: [messages.report_id],
    references: [reports.id],
  }),
  sender: one(users, {
    fields: [messages.sender_id],
    references: [users.id],
    relationName: "sender",
  }),
  receiver: one(users, {
    fields: [messages.receiver_id],
    references: [users.id],
    relationName: "receiver",
  }),
}));
