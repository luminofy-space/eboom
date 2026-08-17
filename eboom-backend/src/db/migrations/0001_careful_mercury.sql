CREATE TABLE "exchange_rates" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_currency_id" integer NOT NULL,
	"to_currency_id" integer NOT NULL,
	"rate" numeric(20, 8) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "exchange_rates_from_currency_id_to_currency_id_unique" UNIQUE("from_currency_id","to_currency_id")
);
--> statement-breakpoint
ALTER TABLE "canvases" ADD COLUMN "base_currency_id" integer;--> statement-breakpoint
ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_from_currency_id_currencies_id_fk" FOREIGN KEY ("from_currency_id") REFERENCES "public"."currencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_to_currency_id_currencies_id_fk" FOREIGN KEY ("to_currency_id") REFERENCES "public"."currencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "canvases" ADD CONSTRAINT "canvases_base_currency_id_currencies_id_fk" FOREIGN KEY ("base_currency_id") REFERENCES "public"."currencies"("id") ON DELETE no action ON UPDATE no action;