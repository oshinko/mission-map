CREATE TABLE "comments" (
	"map_id" varchar(11),
	"place_local_id" varchar(32),
	"text" text NOT NULL,
	"system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "comments_map_id_place_local_id_created_at_pk" PRIMARY KEY("map_id","place_local_id","created_at")
);
--> statement-breakpoint
CREATE TABLE "coordinates" (
	"map_id" varchar(11),
	"place_local_id" varchar(32),
	"index" integer NOT NULL,
	"latitude" numeric(9, 6) NOT NULL,
	"longitude" numeric(9, 6) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coordinates_map_id_place_local_id_index_pk" PRIMARY KEY("map_id","place_local_id","index")
);
--> statement-breakpoint
CREATE TABLE "maps" (
	"id" varchar(11) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "places" (
	"map_id" varchar(11),
	"local_id" varchar(32),
	"name" varchar(255) NOT NULL,
	"address" text,
	"status_index" integer,
	"status_updated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "places_map_id_local_id_pk" PRIMARY KEY("map_id","local_id")
);
--> statement-breakpoint
CREATE TABLE "statuses" (
	"map_id" varchar(11),
	"index" integer NOT NULL,
	"name" varchar(32) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "statuses_map_id_index_pk" PRIMARY KEY("map_id","index")
);
