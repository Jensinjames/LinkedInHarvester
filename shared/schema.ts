import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  linkedinAccessToken: text("linkedin_access_token"),
  linkedinRefreshToken: text("linkedin_refresh_token"),
  linkedinTokenExpiry: timestamp("linkedin_token_expiry"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  fileName: text("file_name").notNull(),
  status: text("status").notNull(), // 'pending', 'processing', 'completed', 'failed', 'paused'
  totalProfiles: integer("total_profiles").notNull(),
  processedProfiles: integer("processed_profiles").default(0),
  successfulProfiles: integer("successful_profiles").default(0),
  failedProfiles: integer("failed_profiles").default(0),
  retryingProfiles: integer("retrying_profiles").default(0),
  batchSize: integer("batch_size").default(50),
  errorBreakdown: jsonb("error_breakdown"), // JSON object with error types and counts
  filePath: text("file_path").notNull(),
  resultPath: text("result_path"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  estimatedCompletion: timestamp("estimated_completion"),
  processingRate: text("processing_rate"), // e.g., "12.3 profiles/min"
  createdAt: timestamp("created_at").defaultNow(),
});

export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(),
  linkedinUrl: text("linkedin_url").notNull(),
  status: text("status").notNull(), // 'pending', 'processing', 'success', 'failed', 'retrying'
  profileData: jsonb("profile_data"), // LinkedIn profile information
  errorType: text("error_type"), // 'captcha', 'not_found', 'access_restricted', 'rate_limit'
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").default(0),
  lastAttempt: timestamp("last_attempt"),
  extractedAt: timestamp("extracted_at"),
});

export const apiStats = pgTable("api_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  requestsUsed: integer("requests_used").default(0),
  requestsLimit: integer("requests_limit").default(1000),
  resetTime: timestamp("reset_time"),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertJobSchema = createInsertSchema(jobs).pick({
  userId: true,
  fileName: true,
  totalProfiles: true,
  batchSize: true,
  filePath: true,
});

export const insertProfileSchema = createInsertSchema(profiles).pick({
  jobId: true,
  linkedinUrl: true,
  status: true,
});

export const insertApiStatsSchema = createInsertSchema(apiStats).pick({
  userId: true,
  requestsUsed: true,
  requestsLimit: true,
  resetTime: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;

export type ApiStats = typeof apiStats.$inferSelect;
export type InsertApiStats = z.infer<typeof insertApiStatsSchema>;
