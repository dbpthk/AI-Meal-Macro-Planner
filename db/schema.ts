import {
  date,
  index,
  integer,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Users - authentication/identity
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email)]
);

// Profiles - user demographics and physical data (1:1 with users)
export const profiles = pgTable(
  "profiles",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" })
      .unique(),
    name: text("name"),
    birthDate: date("birth_date"),
    gender: text("gender"),
    heightCm: real("height_cm"),
    activityLevel: text("activity_level"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("profiles_user_id_idx").on(t.userId)]
);

// Macro targets - daily calorie/macro goals per user (1:many with users)
export const macroTargets = pgTable(
  "macro_targets",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    calories: real("calories"),
    proteinG: real("protein_g"),
    carbsG: real("carbs_g"),
    fatG: real("fat_g"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("macro_targets_user_id_idx").on(t.userId),
    index("macro_targets_user_created_idx").on(t.userId, t.createdAt),
  ]
);

// Foods - food items with nutrition data (global or user-created)
export const foods = pgTable(
  "foods",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    brand: text("brand"),
    servingSize: real("serving_size").notNull(),
    servingUnit: text("serving_unit").notNull(),
    caloriesPerServing: real("calories_per_serving").notNull(),
    proteinPerServing: real("protein_per_serving").notNull(),
    carbsPerServing: real("carbs_per_serving").notNull(),
    fatPerServing: real("fat_per_serving").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("foods_user_id_idx").on(t.userId),
    index("foods_name_idx").on(t.name),
    index("foods_user_name_idx").on(t.userId, t.name),
  ]
);

// Weight logs - user weight tracking over time (1:many with users)
export const weightLogs = pgTable(
  "weight_logs",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    weightKg: real("weight_kg").notNull(),
    loggedAt: date("logged_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("weight_logs_user_id_idx").on(t.userId),
    index("weight_logs_user_date_idx").on(t.userId, t.loggedAt),
    uniqueIndex("weight_logs_user_date_unique_idx").on(t.userId, t.loggedAt),
  ]
);

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles),
  macroTargets: many(macroTargets),
  weightLogs: many(weightLogs),
  foods: many(foods),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}));

export const macroTargetsRelations = relations(macroTargets, ({ one }) => ({
  user: one(users, {
    fields: [macroTargets.userId],
    references: [users.id],
  }),
}));

export const foodsRelations = relations(foods, ({ one }) => ({
  user: one(users, {
    fields: [foods.userId],
    references: [users.id],
  }),
}));

export const weightLogsRelations = relations(weightLogs, ({ one }) => ({
  user: one(users, {
    fields: [weightLogs.userId],
    references: [users.id],
  }),
}));
