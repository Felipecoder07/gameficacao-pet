import { integer, sqliteTable, text, real, uniqueIndex } from "drizzle-orm/sqlite-core";

export const members = sqliteTable("members", {
  id: text("id").primaryKey(), authId: text("auth_id").unique(), name: text("name").notNull(), email: text("email").notNull().unique(),
  role: text("role").notNull().default("member"), active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
});
export const months = sqliteTable("months", {
  id: text("id").primaryKey(), status: text("status").notNull().default("test"),
  validationDeadline: text("validation_deadline"), closedAt: text("closed_at"), winnerIds: text("winner_ids"),
});
export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(), familyId: text("family_id").notNull(), name: text("name").notNull(),
  description: text("description").notNull().default(""), difficulty: text("difficulty").notNull(),
  points: integer("points").notNull(), deliverable: text("deliverable").notNull(),
  proofType: text("proof_type").notNull().default("link"), repeatType: text("repeat_type").notNull().default("none"),
  repeatLimit: integer("repeat_limit").notNull().default(1), groupAllowed: integer("group_allowed", { mode: "boolean" }).notNull().default(false),
  effectiveMonth: text("effective_month").notNull(), active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
});
export const activities = sqliteTable("activities", {
  id: text("id").primaryKey(), memberId: text("member_id").notNull().references(() => members.id),
  taskId: text("task_id").notNull().references(() => tasks.id), monthId: text("month_id").notNull().references(() => months.id),
  activityDate: text("activity_date").notNull(), description: text("description").notNull(), proof: text("proof").notNull(),
  status: text("status").notNull().default("pending"), pointsGranted: real("points_granted"),
  difficultySnapshot: text("difficulty_snapshot"), validatorId: text("validator_id"), validatedAt: text("validated_at"),
  reason: text("reason"), repeatKey: text("repeat_key"), createdAt: text("created_at").notNull(),
});
export const participations = sqliteTable("participations", {
  id: text("id").primaryKey(), activityId: text("activity_id").notNull().references(() => activities.id),
  memberId: text("member_id").notNull().references(() => members.id), role: text("role").notNull(),
  share: real("share").notNull(), ownDeliverable: text("own_deliverable").notNull(),
}, (table) => [uniqueIndex("participation_unique").on(table.activityId, table.memberId)]);
export const taskRequests = sqliteTable("task_requests", {
  id: text("id").primaryKey(), memberId: text("member_id").notNull().references(() => members.id),
  name: text("name").notNull(), description: text("description").notNull(), deliverable: text("deliverable").notNull(),
  status: text("status").notNull().default("pending"), createdAt: text("created_at").notNull(),
});
export const appeals = sqliteTable("appeals", {
  id: text("id").primaryKey(), activityId: text("activity_id").notNull().references(() => activities.id).unique(),
  memberId: text("member_id").notNull().references(() => members.id), reason: text("reason").notNull(),
  status: text("status").notNull().default("pending"), reviewerId: text("reviewer_id"),
  decision: text("decision"), createdAt: text("created_at").notNull(),
});
export const audit = sqliteTable("audit", {
  id: text("id").primaryKey(), actorId: text("actor_id").notNull(), action: text("action").notNull(),
  targetId: text("target_id").notNull(), detail: text("detail").notNull().default(""), createdAt: text("created_at").notNull(),
});
