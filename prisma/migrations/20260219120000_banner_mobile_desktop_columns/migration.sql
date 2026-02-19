-- AlterTable: Update Banner from old schema (imageUrl, linkUrl, targetDevice) to new (mobileImageUrl, desktopImageUrl)
DO $$
BEGIN
  -- Add mobileImageUrl if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Banner' AND column_name = 'mobileImageUrl') THEN
    ALTER TABLE "Banner" ADD COLUMN "mobileImageUrl" TEXT;
  END IF;
  -- Add desktopImageUrl if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Banner' AND column_name = 'desktopImageUrl') THEN
    ALTER TABLE "Banner" ADD COLUMN "desktopImageUrl" TEXT;
  END IF;
  -- Migrate imageUrl to desktopImageUrl and drop imageUrl
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Banner' AND column_name = 'imageUrl') THEN
    UPDATE "Banner" SET "desktopImageUrl" = "imageUrl" WHERE "desktopImageUrl" IS NULL AND "imageUrl" IS NOT NULL;
    ALTER TABLE "Banner" DROP COLUMN "imageUrl";
  END IF;
  -- Drop linkUrl
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Banner' AND column_name = 'linkUrl') THEN
    ALTER TABLE "Banner" DROP COLUMN "linkUrl";
  END IF;
  -- Drop targetDevice (may be enum type)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Banner' AND column_name = 'targetDevice') THEN
    ALTER TABLE "Banner" DROP COLUMN "targetDevice";
  END IF;
END $$;

DROP TYPE IF EXISTS "BannerDevice";
