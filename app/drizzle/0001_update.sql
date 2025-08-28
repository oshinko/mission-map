CREATE TYPE "public"."type" AS ENUM('status_change', 'comment');--> statement-breakpoint
ALTER TABLE "comments" RENAME TO "events";--> statement-breakpoint
ALTER TABLE "events" RENAME COLUMN "text" TO "type";--> statement-breakpoint
ALTER TABLE "events" DROP CONSTRAINT "comments_map_id_place_local_id_created_at_pk";--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_map_id_place_local_id_created_at_type_pk" PRIMARY KEY("map_id","place_local_id","created_at","type");--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "status_index" integer;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "comment" text NOT NULL;--> statement-breakpoint
ALTER TABLE "places" DROP COLUMN "status_index";--> statement-breakpoint
ALTER TABLE "places" DROP COLUMN "status_updated_at";--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "value_check" CHECK (
      ("events"."type" = 'status_change' AND "events"."status_index" IS NOT NULL AND "events"."comment" IS NULL)
      OR
      ("events"."type" = 'comment' AND "events"."comment" IS NOT NULL AND "events"."status_index" IS NULL)
    );