CREATE SCHEMA "ai";
--> statement-breakpoint
CREATE SCHEMA "finance";
--> statement-breakpoint
CREATE SCHEMA "identity";
--> statement-breakpoint
CREATE SCHEMA "reference";
--> statement-breakpoint
CREATE SCHEMA "workspace";
--> statement-breakpoint
CREATE TYPE "identity"."canvas_invitation_status" AS ENUM('pending', 'accepted', 'declined', 'cancelled', 'expired');--> statement-breakpoint
CREATE TYPE "finance"."budget_period_type" AS ENUM('weekly', 'monthly', 'yearly');--> statement-breakpoint
CREATE TYPE "finance"."recurrence_frequency" AS ENUM('daily', 'weekly', 'monthly', 'yearly');--> statement-breakpoint
CREATE TYPE "finance"."savings_goal_status" AS ENUM('active', 'achieved', 'dropped');--> statement-breakpoint
CREATE TYPE "finance"."transaction_status" AS ENUM('pending', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "workspace"."whiteboard_entity_type" AS ENUM('wallet', 'income', 'expense');--> statement-breakpoint
CREATE TYPE "ai"."ai_chat_message_role" AS ENUM('user', 'assistant');--> statement-breakpoint
CREATE TYPE "ai"."ai_insight_profile_status" AS ENUM('draft', 'completed');--> statement-breakpoint
CREATE TABLE "reference"."asset_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"is_systematic" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" integer,
	"last_modified_at" timestamp with time zone DEFAULT now(),
	"last_modified_by" integer
);
--> statement-breakpoint
CREATE TABLE "reference"."currencies" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(10) NOT NULL,
	"name" varchar(100) NOT NULL,
	"symbol" varchar(10) NOT NULL,
	"decimals" integer DEFAULT 2,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"last_modified_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "currencies_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "reference"."exchange_rates" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_currency_id" integer NOT NULL,
	"to_currency_id" integer NOT NULL,
	"rate" numeric(20, 8) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "exchange_rates_from_currency_id_to_currency_id_unique" UNIQUE("from_currency_id","to_currency_id")
);
--> statement-breakpoint
CREATE TABLE "reference"."expense_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"last_modified_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reference"."income_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"last_modified_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reference"."roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"permissions" jsonb,
	"is_system_role" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" integer,
	"last_modified_at" timestamp with time zone DEFAULT now(),
	"last_modified_by" integer,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "reference"."wallet_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"last_modified_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "identity"."canvas_invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"canvas_id" integer NOT NULL,
	"invitee_user_id" integer NOT NULL,
	"invitee_email" varchar(255) NOT NULL,
	"role_id" integer NOT NULL,
	"invited_by" integer NOT NULL,
	"status" "identity"."canvas_invitation_status" DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone,
	"responded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"last_modified_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "canvas_invitations_canvas_invitee_unique" UNIQUE("canvas_id","invitee_user_id")
);
--> statement-breakpoint
CREATE TABLE "identity"."canvas_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"canvas_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"role_id" integer,
	"is_owner" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"last_modified_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "canvas_members_canvas_id_user_id_unique" UNIQUE("canvas_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "identity"."canvases" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"photo_url" text,
	"canvas_type" varchar(50),
	"base_currency_id" integer,
	"is_archived" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" integer,
	"last_modified_at" timestamp with time zone DEFAULT now(),
	"last_modified_by" integer
);
--> statement-breakpoint
CREATE TABLE "identity"."notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "identity"."user_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"timezone" varchar(100) DEFAULT 'UTC',
	"language" varchar(10) DEFAULT 'en',
	"date_format" varchar(50) DEFAULT 'YYYY-MM-DD',
	"default_currency_id" integer,
	"notification_enabled" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"last_modified_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "user_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "identity"."users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"photo_url" text,
	"age" integer,
	"phone" varchar(50),
	"email_verified" boolean DEFAULT false,
	"password_hash" varchar(255),
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" integer,
	"last_modified_at" timestamp with time zone DEFAULT now(),
	"last_modified_by" integer,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "age_check" CHECK ("identity"."users"."age" > 0)
);
--> statement-breakpoint
CREATE TABLE "finance"."asset_volumes" (
	"id" serial PRIMARY KEY NOT NULL,
	"asset_id" integer NOT NULL,
	"quantity" numeric(20, 8) NOT NULL,
	"unit_price" numeric(20, 8) NOT NULL,
	"recorded_at" timestamp with time zone NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" integer NOT NULL,
	CONSTRAINT "asset_volume_quantity_nonzero_check" CHECK ("finance"."asset_volumes"."quantity" <> 0),
	CONSTRAINT "asset_volume_unit_price_check" CHECK ("finance"."asset_volumes"."unit_price" >= 0)
);
--> statement-breakpoint
CREATE TABLE "finance"."assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"canvas_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"asset_category_id" integer NOT NULL,
	"currency_id" integer NOT NULL,
	"photo_url" text,
	"description" jsonb,
	"is_archived" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" integer NOT NULL,
	"last_modified_at" timestamp with time zone DEFAULT now(),
	"last_modified_by" integer
);
--> statement-breakpoint
CREATE TABLE "finance"."attachments" (
	"id" serial PRIMARY KEY NOT NULL,
	"attachable_type" varchar(100),
	"attachable_id" integer,
	"file_name" varchar(255) NOT NULL,
	"file_path" varchar(500) NOT NULL,
	"file_size" bigint,
	"mime_type" varchar(100),
	"uploaded_by" integer,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "finance"."budget_lines" (
	"id" serial PRIMARY KEY NOT NULL,
	"budget_id" integer NOT NULL,
	"expense_category_id" integer NOT NULL,
	"amount_limit" numeric(20, 8) NOT NULL,
	"alert_threshold_percent" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	"last_modified_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "budget_lines_budget_category_unique" UNIQUE("budget_id","expense_category_id"),
	CONSTRAINT "budget_line_amount_check" CHECK ("finance"."budget_lines"."amount_limit" >= 0),
	CONSTRAINT "budget_line_alert_threshold_check" CHECK ("finance"."budget_lines"."alert_threshold_percent" IS NULL OR ("finance"."budget_lines"."alert_threshold_percent" >= 1 AND "finance"."budget_lines"."alert_threshold_percent" <= 100))
);
--> statement-breakpoint
CREATE TABLE "finance"."budgets" (
	"id" serial PRIMARY KEY NOT NULL,
	"canvas_id" integer NOT NULL,
	"currency_id" integer NOT NULL,
	"period_type" "finance"."budget_period_type" NOT NULL,
	"period_start" date NOT NULL,
	"total_limit" numeric(20, 8) NOT NULL,
	"alert_threshold_percent" integer DEFAULT 80 NOT NULL,
	"alerts_enabled" boolean DEFAULT true NOT NULL,
	"name" varchar(255),
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" integer NOT NULL,
	"last_modified_at" timestamp with time zone DEFAULT now(),
	"last_modified_by" integer,
	CONSTRAINT "budgets_canvas_currency_period_unique" UNIQUE("canvas_id","currency_id","period_type"),
	CONSTRAINT "budget_total_limit_check" CHECK ("finance"."budgets"."total_limit" >= 0),
	CONSTRAINT "budget_alert_threshold_check" CHECK ("finance"."budgets"."alert_threshold_percent" >= 1 AND "finance"."budgets"."alert_threshold_percent" <= 100)
);
--> statement-breakpoint
CREATE TABLE "finance"."expense_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"expense_id" integer NOT NULL,
	"source_wallet_id" integer NOT NULL,
	"amount" numeric(20, 8) NOT NULL,
	"due_date" timestamp with time zone,
	"paid_date" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" integer,
	"last_modified_at" timestamp with time zone DEFAULT now(),
	"last_modified_by" integer,
	CONSTRAINT "expense_payment_amount_check" CHECK ("finance"."expense_payments"."amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "finance"."expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"canvas_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"expense_category_id" integer NOT NULL,
	"currency_id" integer NOT NULL,
	"wallet_id" integer,
	"is_recurring" boolean DEFAULT false,
	"recurrence_pattern" jsonb,
	"status" "finance"."transaction_status" DEFAULT 'pending',
	"description" jsonb,
	"photo_url" text,
	"is_archived" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" integer NOT NULL,
	"last_modified_at" timestamp with time zone DEFAULT now(),
	"last_modified_by" integer
);
--> statement-breakpoint
CREATE TABLE "finance"."income_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"income_id" integer NOT NULL,
	"destination_wallet_id" integer NOT NULL,
	"amount" numeric(20, 8) NOT NULL,
	"expected_date" timestamp with time zone,
	"received_date" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" integer,
	"last_modified_at" timestamp with time zone DEFAULT now(),
	"last_modified_by" integer,
	CONSTRAINT "income_entry_amount_check" CHECK ("finance"."income_entries"."amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "finance"."incomes" (
	"id" serial PRIMARY KEY NOT NULL,
	"canvas_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"currency_id" integer NOT NULL,
	"wallet_id" integer,
	"amount" integer NOT NULL,
	"income_category_id" integer NOT NULL,
	"is_recurring" boolean DEFAULT false,
	"recurrence_pattern" jsonb,
	"status" "finance"."transaction_status" DEFAULT 'pending',
	"photo_url" text,
	"description" jsonb,
	"is_archived" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" integer NOT NULL,
	"last_modified_at" timestamp with time zone DEFAULT now(),
	"last_modified_by" integer
);
--> statement-breakpoint
CREATE TABLE "finance"."price_points" (
	"id" serial PRIMARY KEY NOT NULL,
	"asset_id" integer NOT NULL,
	"unit_price" numeric(20, 8) NOT NULL,
	"recorded_at" timestamp with time zone NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" integer NOT NULL,
	CONSTRAINT "price_point_unit_price_check" CHECK ("finance"."price_points"."unit_price" >= 0)
);
--> statement-breakpoint
CREATE TABLE "finance"."recurrence_patterns" (
	"id" serial PRIMARY KEY NOT NULL,
	"frequency" "finance"."recurrence_frequency" NOT NULL,
	"interval" integer DEFAULT 1,
	"start_date" date,
	"end_date" date,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "finance"."savings_goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"canvas_id" integer NOT NULL,
	"currency_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"target_amount" numeric(20, 8) NOT NULL,
	"target_date" date,
	"photo_url" text,
	"linked_wallet_id" integer,
	"alert_threshold_percent" integer DEFAULT 80 NOT NULL,
	"status" "finance"."savings_goal_status" DEFAULT 'active' NOT NULL,
	"is_archived" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" integer NOT NULL,
	"last_modified_at" timestamp with time zone DEFAULT now(),
	"last_modified_by" integer,
	CONSTRAINT "savings_goal_target_check" CHECK ("finance"."savings_goals"."target_amount" > 0),
	CONSTRAINT "savings_goal_alert_threshold_check" CHECK ("finance"."savings_goals"."alert_threshold_percent" >= 1 AND "finance"."savings_goals"."alert_threshold_percent" <= 100)
);
--> statement-breakpoint
CREATE TABLE "finance"."sub_wallets" (
	"id" serial PRIMARY KEY NOT NULL,
	"wallet_id" integer NOT NULL,
	"currency_id" integer NOT NULL,
	"amount" numeric(20, 8) DEFAULT '0' NOT NULL,
	"address" varchar(255),
	"created_at" timestamp with time zone DEFAULT now(),
	"last_modified_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "sub_wallets_wallet_id_currency_id_unique" UNIQUE("wallet_id","currency_id")
);
--> statement-breakpoint
CREATE TABLE "finance"."to_buy_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"wishlist_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"estimated_price" numeric(20, 8),
	"currency_id" integer,
	"priority" integer DEFAULT 0,
	"due_date" date,
	"target_purchase_date" date,
	"actual_purchase_date" date,
	"actual_price" numeric(20, 8),
	"purchased_from_wallet_id" integer,
	"status" varchar(50),
	"links" jsonb,
	"photo_url" text,
	"is_archived" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" integer,
	"last_modified_at" timestamp with time zone DEFAULT now(),
	"last_modified_by" integer
);
--> statement-breakpoint
CREATE TABLE "finance"."transfers" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_wallet_id" integer NOT NULL,
	"destination_wallet_id" integer NOT NULL,
	"source_amount" numeric(20, 8) NOT NULL,
	"destination_amount" numeric(20, 8) NOT NULL,
	"exchange_rate" numeric(20, 8),
	"transaction_fee" numeric(20, 8) DEFAULT '0',
	"transfer_date" timestamp with time zone NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" integer,
	"last_modified_at" timestamp with time zone DEFAULT now(),
	"last_modified_by" integer,
	CONSTRAINT "transfer_source_amount_check" CHECK ("finance"."transfers"."source_amount" >= 0),
	CONSTRAINT "transfer_destination_amount_check" CHECK ("finance"."transfers"."destination_amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "finance"."wallets" (
	"id" serial PRIMARY KEY NOT NULL,
	"canvas_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"wallet_category_id" integer NOT NULL,
	"photo_url" text,
	"description" jsonb,
	"is_archived" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" integer NOT NULL,
	"last_modified_at" timestamp with time zone DEFAULT now(),
	"last_modified_by" integer
);
--> statement-breakpoint
CREATE TABLE "finance"."wishlists" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"path" text NOT NULL,
	"description" text,
	"photo_url" text,
	"is_public" boolean DEFAULT true,
	"is_archived" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" integer,
	"last_modified_at" timestamp with time zone DEFAULT now(),
	"last_modified_by" integer,
	CONSTRAINT "wishlists_path_unique" UNIQUE("path")
);
--> statement-breakpoint
CREATE TABLE "workspace"."whiteboard_node_positions" (
	"id" serial PRIMARY KEY NOT NULL,
	"canvas_id" integer NOT NULL,
	"entity_type" "workspace"."whiteboard_entity_type" NOT NULL,
	"entity_id" integer NOT NULL,
	"x" numeric(12, 4) NOT NULL,
	"y" numeric(12, 4) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "whiteboard_node_positions_canvas_id_entity_type_entity_id_unique" UNIQUE("canvas_id","entity_type","entity_id")
);
--> statement-breakpoint
CREATE TABLE "workspace"."whiteboard_viewports" (
	"canvas_id" integer PRIMARY KEY NOT NULL,
	"x" numeric(12, 4) DEFAULT '0' NOT NULL,
	"y" numeric(12, 4) DEFAULT '0' NOT NULL,
	"zoom" numeric(8, 4) DEFAULT '1' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai"."ai_chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"canvas_id" integer NOT NULL,
	"user_id" integer,
	"role" "ai"."ai_chat_message_role" NOT NULL,
	"content" text NOT NULL,
	"model" varchar(100),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai"."ai_financial_insights" (
	"id" serial PRIMARY KEY NOT NULL,
	"canvas_id" integer NOT NULL,
	"profile_id" integer,
	"generated_by_user_id" integer NOT NULL,
	"insights" jsonb NOT NULL,
	"completeness_score" integer DEFAULT 0 NOT NULL,
	"completeness_breakdown" jsonb,
	"context_summary" jsonb,
	"model" varchar(100) NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now(),
	"last_modified_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "ai_financial_insights_canvas_id_unique" UNIQUE("canvas_id"),
	CONSTRAINT "ai_financial_insights_completeness_check" CHECK ("ai"."ai_financial_insights"."completeness_score" >= 0 AND "ai"."ai_financial_insights"."completeness_score" <= 100)
);
--> statement-breakpoint
CREATE TABLE "ai"."ai_insight_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"canvas_id" integer NOT NULL,
	"status" "ai"."ai_insight_profile_status" DEFAULT 'draft' NOT NULL,
	"current_step" integer DEFAULT 1 NOT NULL,
	"risk_profile" jsonb,
	"investment_goals" jsonb,
	"esg_preferences" jsonb,
	"financial_knowledge" jsonb,
	"financial_picture" jsonb,
	"completed_at" timestamp with time zone,
	"updated_by_user_id" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	"last_modified_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "ai_insight_profiles_canvas_id_unique" UNIQUE("canvas_id"),
	CONSTRAINT "ai_insight_profile_current_step_check" CHECK ("ai"."ai_insight_profiles"."current_step" >= 1 AND "ai"."ai_insight_profiles"."current_step" <= 5)
);
--> statement-breakpoint
ALTER TABLE "reference"."asset_categories" ADD CONSTRAINT "asset_categories_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reference"."asset_categories" ADD CONSTRAINT "asset_categories_last_modified_by_users_id_fk" FOREIGN KEY ("last_modified_by") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reference"."exchange_rates" ADD CONSTRAINT "exchange_rates_from_currency_id_currencies_id_fk" FOREIGN KEY ("from_currency_id") REFERENCES "reference"."currencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reference"."exchange_rates" ADD CONSTRAINT "exchange_rates_to_currency_id_currencies_id_fk" FOREIGN KEY ("to_currency_id") REFERENCES "reference"."currencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reference"."roles" ADD CONSTRAINT "roles_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reference"."roles" ADD CONSTRAINT "roles_last_modified_by_users_id_fk" FOREIGN KEY ("last_modified_by") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity"."canvas_invitations" ADD CONSTRAINT "canvas_invitations_canvas_id_canvases_id_fk" FOREIGN KEY ("canvas_id") REFERENCES "identity"."canvases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity"."canvas_invitations" ADD CONSTRAINT "canvas_invitations_invitee_user_id_users_id_fk" FOREIGN KEY ("invitee_user_id") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity"."canvas_invitations" ADD CONSTRAINT "canvas_invitations_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "reference"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity"."canvas_invitations" ADD CONSTRAINT "canvas_invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity"."canvas_members" ADD CONSTRAINT "canvas_members_canvas_id_canvases_id_fk" FOREIGN KEY ("canvas_id") REFERENCES "identity"."canvases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity"."canvas_members" ADD CONSTRAINT "canvas_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity"."canvas_members" ADD CONSTRAINT "canvas_members_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "reference"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity"."canvases" ADD CONSTRAINT "canvases_base_currency_id_currencies_id_fk" FOREIGN KEY ("base_currency_id") REFERENCES "reference"."currencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity"."canvases" ADD CONSTRAINT "canvases_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity"."canvases" ADD CONSTRAINT "canvases_last_modified_by_users_id_fk" FOREIGN KEY ("last_modified_by") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity"."notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity"."user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity"."user_settings" ADD CONSTRAINT "user_settings_default_currency_id_currencies_id_fk" FOREIGN KEY ("default_currency_id") REFERENCES "reference"."currencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity"."users" ADD CONSTRAINT "users_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity"."users" ADD CONSTRAINT "users_last_modified_by_users_id_fk" FOREIGN KEY ("last_modified_by") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."asset_volumes" ADD CONSTRAINT "asset_volumes_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "finance"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."asset_volumes" ADD CONSTRAINT "asset_volumes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."assets" ADD CONSTRAINT "assets_canvas_id_canvases_id_fk" FOREIGN KEY ("canvas_id") REFERENCES "identity"."canvases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."assets" ADD CONSTRAINT "assets_asset_category_id_asset_categories_id_fk" FOREIGN KEY ("asset_category_id") REFERENCES "reference"."asset_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."assets" ADD CONSTRAINT "assets_currency_id_currencies_id_fk" FOREIGN KEY ("currency_id") REFERENCES "reference"."currencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."assets" ADD CONSTRAINT "assets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."assets" ADD CONSTRAINT "assets_last_modified_by_users_id_fk" FOREIGN KEY ("last_modified_by") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."attachments" ADD CONSTRAINT "attachments_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."budget_lines" ADD CONSTRAINT "budget_lines_budget_id_budgets_id_fk" FOREIGN KEY ("budget_id") REFERENCES "finance"."budgets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."budget_lines" ADD CONSTRAINT "budget_lines_expense_category_id_expense_categories_id_fk" FOREIGN KEY ("expense_category_id") REFERENCES "reference"."expense_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."budgets" ADD CONSTRAINT "budgets_canvas_id_canvases_id_fk" FOREIGN KEY ("canvas_id") REFERENCES "identity"."canvases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."budgets" ADD CONSTRAINT "budgets_currency_id_currencies_id_fk" FOREIGN KEY ("currency_id") REFERENCES "reference"."currencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."budgets" ADD CONSTRAINT "budgets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."budgets" ADD CONSTRAINT "budgets_last_modified_by_users_id_fk" FOREIGN KEY ("last_modified_by") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."expense_payments" ADD CONSTRAINT "expense_payments_expense_id_expenses_id_fk" FOREIGN KEY ("expense_id") REFERENCES "finance"."expenses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."expense_payments" ADD CONSTRAINT "expense_payments_source_wallet_id_wallets_id_fk" FOREIGN KEY ("source_wallet_id") REFERENCES "finance"."wallets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."expense_payments" ADD CONSTRAINT "expense_payments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."expense_payments" ADD CONSTRAINT "expense_payments_last_modified_by_users_id_fk" FOREIGN KEY ("last_modified_by") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."expenses" ADD CONSTRAINT "expenses_canvas_id_canvases_id_fk" FOREIGN KEY ("canvas_id") REFERENCES "identity"."canvases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."expenses" ADD CONSTRAINT "expenses_expense_category_id_expense_categories_id_fk" FOREIGN KEY ("expense_category_id") REFERENCES "reference"."expense_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."expenses" ADD CONSTRAINT "expenses_currency_id_currencies_id_fk" FOREIGN KEY ("currency_id") REFERENCES "reference"."currencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."expenses" ADD CONSTRAINT "expenses_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "finance"."wallets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."expenses" ADD CONSTRAINT "expenses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."expenses" ADD CONSTRAINT "expenses_last_modified_by_users_id_fk" FOREIGN KEY ("last_modified_by") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."income_entries" ADD CONSTRAINT "income_entries_income_id_incomes_id_fk" FOREIGN KEY ("income_id") REFERENCES "finance"."incomes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."income_entries" ADD CONSTRAINT "income_entries_destination_wallet_id_wallets_id_fk" FOREIGN KEY ("destination_wallet_id") REFERENCES "finance"."wallets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."income_entries" ADD CONSTRAINT "income_entries_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."income_entries" ADD CONSTRAINT "income_entries_last_modified_by_users_id_fk" FOREIGN KEY ("last_modified_by") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."incomes" ADD CONSTRAINT "incomes_canvas_id_canvases_id_fk" FOREIGN KEY ("canvas_id") REFERENCES "identity"."canvases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."incomes" ADD CONSTRAINT "incomes_currency_id_currencies_id_fk" FOREIGN KEY ("currency_id") REFERENCES "reference"."currencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."incomes" ADD CONSTRAINT "incomes_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "finance"."wallets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."incomes" ADD CONSTRAINT "incomes_income_category_id_income_categories_id_fk" FOREIGN KEY ("income_category_id") REFERENCES "reference"."income_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."incomes" ADD CONSTRAINT "incomes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."incomes" ADD CONSTRAINT "incomes_last_modified_by_users_id_fk" FOREIGN KEY ("last_modified_by") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."price_points" ADD CONSTRAINT "price_points_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "finance"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."price_points" ADD CONSTRAINT "price_points_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."savings_goals" ADD CONSTRAINT "savings_goals_canvas_id_canvases_id_fk" FOREIGN KEY ("canvas_id") REFERENCES "identity"."canvases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."savings_goals" ADD CONSTRAINT "savings_goals_currency_id_currencies_id_fk" FOREIGN KEY ("currency_id") REFERENCES "reference"."currencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."savings_goals" ADD CONSTRAINT "savings_goals_linked_wallet_id_wallets_id_fk" FOREIGN KEY ("linked_wallet_id") REFERENCES "finance"."wallets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."savings_goals" ADD CONSTRAINT "savings_goals_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."savings_goals" ADD CONSTRAINT "savings_goals_last_modified_by_users_id_fk" FOREIGN KEY ("last_modified_by") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."sub_wallets" ADD CONSTRAINT "sub_wallets_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "finance"."wallets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."sub_wallets" ADD CONSTRAINT "sub_wallets_currency_id_currencies_id_fk" FOREIGN KEY ("currency_id") REFERENCES "reference"."currencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."to_buy_items" ADD CONSTRAINT "to_buy_items_wishlist_id_wishlists_id_fk" FOREIGN KEY ("wishlist_id") REFERENCES "finance"."wishlists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."to_buy_items" ADD CONSTRAINT "to_buy_items_currency_id_currencies_id_fk" FOREIGN KEY ("currency_id") REFERENCES "reference"."currencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."to_buy_items" ADD CONSTRAINT "to_buy_items_purchased_from_wallet_id_wallets_id_fk" FOREIGN KEY ("purchased_from_wallet_id") REFERENCES "finance"."wallets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."to_buy_items" ADD CONSTRAINT "to_buy_items_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."to_buy_items" ADD CONSTRAINT "to_buy_items_last_modified_by_users_id_fk" FOREIGN KEY ("last_modified_by") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."transfers" ADD CONSTRAINT "transfers_source_wallet_id_sub_wallets_id_fk" FOREIGN KEY ("source_wallet_id") REFERENCES "finance"."sub_wallets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."transfers" ADD CONSTRAINT "transfers_destination_wallet_id_sub_wallets_id_fk" FOREIGN KEY ("destination_wallet_id") REFERENCES "finance"."sub_wallets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."transfers" ADD CONSTRAINT "transfers_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."transfers" ADD CONSTRAINT "transfers_last_modified_by_users_id_fk" FOREIGN KEY ("last_modified_by") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."wallets" ADD CONSTRAINT "wallets_canvas_id_canvases_id_fk" FOREIGN KEY ("canvas_id") REFERENCES "identity"."canvases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."wallets" ADD CONSTRAINT "wallets_wallet_category_id_wallet_categories_id_fk" FOREIGN KEY ("wallet_category_id") REFERENCES "reference"."wallet_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."wallets" ADD CONSTRAINT "wallets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."wallets" ADD CONSTRAINT "wallets_last_modified_by_users_id_fk" FOREIGN KEY ("last_modified_by") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."wishlists" ADD CONSTRAINT "wishlists_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."wishlists" ADD CONSTRAINT "wishlists_last_modified_by_users_id_fk" FOREIGN KEY ("last_modified_by") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace"."whiteboard_node_positions" ADD CONSTRAINT "whiteboard_node_positions_canvas_id_canvases_id_fk" FOREIGN KEY ("canvas_id") REFERENCES "identity"."canvases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace"."whiteboard_viewports" ADD CONSTRAINT "whiteboard_viewports_canvas_id_canvases_id_fk" FOREIGN KEY ("canvas_id") REFERENCES "identity"."canvases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai"."ai_chat_messages" ADD CONSTRAINT "ai_chat_messages_canvas_id_canvases_id_fk" FOREIGN KEY ("canvas_id") REFERENCES "identity"."canvases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai"."ai_chat_messages" ADD CONSTRAINT "ai_chat_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai"."ai_financial_insights" ADD CONSTRAINT "ai_financial_insights_canvas_id_canvases_id_fk" FOREIGN KEY ("canvas_id") REFERENCES "identity"."canvases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai"."ai_financial_insights" ADD CONSTRAINT "ai_financial_insights_profile_id_ai_insight_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "ai"."ai_insight_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai"."ai_financial_insights" ADD CONSTRAINT "ai_financial_insights_generated_by_user_id_users_id_fk" FOREIGN KEY ("generated_by_user_id") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai"."ai_insight_profiles" ADD CONSTRAINT "ai_insight_profiles_canvas_id_canvases_id_fk" FOREIGN KEY ("canvas_id") REFERENCES "identity"."canvases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai"."ai_insight_profiles" ADD CONSTRAINT "ai_insight_profiles_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;