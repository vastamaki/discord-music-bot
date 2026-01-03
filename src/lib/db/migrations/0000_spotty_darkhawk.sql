CREATE TABLE "banned_urls" (
	"guild_id" varchar NOT NULL,
	"video_id" varchar NOT NULL,
	"banned_by" varchar NOT NULL,
	"video_title" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "banned_urls_guild_id_video_id_pk" PRIMARY KEY("guild_id","video_id")
);
--> statement-breakpoint
CREATE TABLE "banned_words" (
	"guild_id" varchar NOT NULL,
	"keyword" varchar NOT NULL,
	"banned_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "banned_words_guild_id_keyword_pk" PRIMARY KEY("guild_id","keyword")
);
--> statement-breakpoint
CREATE TABLE "guilds" (
	"id" varchar PRIMARY KEY NOT NULL,
	"prefix" varchar NOT NULL,
	"owner_id" varchar NOT NULL,
	"music_channel_id" varchar,
	"message_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "play_history" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "play_history_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"video_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"username" varchar NOT NULL,
	"search_string" varchar NOT NULL,
	"result_url" varchar NOT NULL,
	"result_name" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "banned_urls" ADD CONSTRAINT "banned_urls_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banned_words" ADD CONSTRAINT "banned_words_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "play_history_video_id_idx" ON "play_history" USING btree ("video_id");