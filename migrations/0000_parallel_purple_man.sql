CREATE TABLE "clusters" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "criteria" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"group_id" varchar NOT NULL,
	"max_score" numeric(5, 2) NOT NULL,
	"display_order" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "criteria_groups" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"display_order" integer NOT NULL,
	"year" integer NOT NULL,
	"cluster_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evaluation_periods" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"year" integer NOT NULL,
	"cluster_id" varchar NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evaluations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"period_id" varchar NOT NULL,
	"unit_id" varchar NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"total_self_score" numeric(7, 2),
	"total_review1_score" numeric(7, 2),
	"total_review2_score" numeric(7, 2),
	"total_final_score" numeric(7, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "evaluations_period_id_unit_id_unique" UNIQUE("period_id","unit_id")
);
--> statement-breakpoint
CREATE TABLE "scores" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evaluation_id" varchar NOT NULL,
	"criteria_id" varchar NOT NULL,
	"self_score" numeric(5, 2),
	"self_score_file" text,
	"self_score_date" timestamp,
	"review1_score" numeric(5, 2),
	"review1_comment" text,
	"review1_file" text,
	"review1_date" timestamp,
	"review1_by" varchar,
	"explanation" text,
	"explanation_file" text,
	"explanation_date" timestamp,
	"review2_score" numeric(5, 2),
	"review2_comment" text,
	"review2_file" text,
	"review2_date" timestamp,
	"review2_by" varchar,
	"final_score" numeric(5, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "scores_evaluation_id_criteria_id_unique" UNIQUE("evaluation_id","criteria_id")
);
--> statement-breakpoint
CREATE TABLE "units" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"cluster_id" varchar NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"full_name" text NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"cluster_id" varchar,
	"unit_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "criteria" ADD CONSTRAINT "criteria_group_id_criteria_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."criteria_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "criteria_groups" ADD CONSTRAINT "criteria_groups_cluster_id_clusters_id_fk" FOREIGN KEY ("cluster_id") REFERENCES "public"."clusters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluation_periods" ADD CONSTRAINT "evaluation_periods_cluster_id_clusters_id_fk" FOREIGN KEY ("cluster_id") REFERENCES "public"."clusters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_period_id_evaluation_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."evaluation_periods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_evaluation_id_evaluations_id_fk" FOREIGN KEY ("evaluation_id") REFERENCES "public"."evaluations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_criteria_id_criteria_id_fk" FOREIGN KEY ("criteria_id") REFERENCES "public"."criteria"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_review1_by_users_id_fk" FOREIGN KEY ("review1_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_review2_by_users_id_fk" FOREIGN KEY ("review2_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_cluster_id_clusters_id_fk" FOREIGN KEY ("cluster_id") REFERENCES "public"."clusters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_cluster_id_clusters_id_fk" FOREIGN KEY ("cluster_id") REFERENCES "public"."clusters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE set null ON UPDATE no action;