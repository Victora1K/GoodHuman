-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ARTIST', 'BOOKER', 'ADMIN');

-- CreateEnum
CREATE TYPE "BookerSubtype" AS ENUM ('INDIVIDUAL', 'VENUE', 'PROMOTER', 'PLANNER');

-- CreateEnum
CREATE TYPE "ArtistCategory" AS ENUM ('DJ', 'BAND', 'SOLO_MUSICIAN', 'COMEDIAN', 'DANCER', 'SPEAKER', 'OTHER');

-- CreateEnum
CREATE TYPE "TravelScope" AS ENUM ('LOCAL', 'NATIONAL', 'INTERNATIONAL');

-- CreateEnum
CREATE TYPE "TravelMode" AS ENUM ('ARTIST_TRAVELS', 'BOOKER_COVERS', 'NO_TRAVEL');

-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('IMAGE', 'VIDEO', 'AUDIO');

-- CreateEnum
CREATE TYPE "MediaStatus" AS ENUM ('UPLOADING', 'PROCESSING', 'READY', 'FAILED', 'HIDDEN');

-- CreateEnum
CREATE TYPE "SocialPlatform" AS ENUM ('INSTAGRAM', 'YOUTUBE', 'SPOTIFY', 'TIKTOK', 'WEBSITE', 'OTHER');

-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('OPEN', 'QUOTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'EXPIRED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('REQUIRES_PAYMENT', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PAUSED', 'RELEASED', 'FAILED');

-- CreateEnum
CREATE TYPE "DealSheetStatus" AS ENUM ('DRAFT', 'ARTIST_ACCEPTED', 'BOOKER_ACCEPTED', 'BOTH_ACCEPTED');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "displayName" TEXT NOT NULL,
    "premium" BOOLEAN NOT NULL DEFAULT false,
    "ageConfirmedAt" TIMESTAMP(3) NOT NULL,
    "bookerSubtype" "BookerSubtype",
    "venueAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtistProfile" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "actName" TEXT NOT NULL,
    "bio" TEXT,
    "category" "ArtistCategory" NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'US',
    "region" TEXT,
    "travelScope" "TravelScope" NOT NULL,
    "openToTravel" BOOLEAN NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "spotlight" BOOLEAN NOT NULL DEFAULT false,
    "stripeAccountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArtistProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilityDate" (
    "id" UUID NOT NULL,
    "artistProfileId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "timezone" TEXT NOT NULL,
    "open" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvailabilityDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "artistProfileId" UUID,
    "kind" "MediaKind" NOT NULL,
    "mimeType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "originalKey" TEXT NOT NULL,
    "previewKey" TEXT,
    "posterKey" TEXT,
    "status" "MediaStatus" NOT NULL DEFAULT 'UPLOADING',
    "watermarkedPreview" BOOLEAN NOT NULL DEFAULT false,
    "isPublicPreview" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialLink" (
    "id" UUID NOT NULL,
    "artistProfileId" UUID NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "url" TEXT NOT NULL,
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "oauthProvider" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inquiry" (
    "id" UUID NOT NULL,
    "artistProfileId" UUID NOT NULL,
    "bookerId" UUID NOT NULL,
    "eventDate" DATE NOT NULL,
    "eventTimezone" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "venueName" TEXT,
    "status" "InquiryStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" UUID NOT NULL,
    "inquiryId" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" UUID NOT NULL,
    "inquiryId" UUID NOT NULL,
    "artistProfileId" UUID NOT NULL,
    "artistUserId" UUID NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "totalCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "depositPercent" DOUBLE PRECISION NOT NULL,
    "travelMode" "TravelMode" NOT NULL,
    "travelScope" "TravelScope" NOT NULL,
    "includedScope" TEXT NOT NULL,
    "bookingFeeRate" DOUBLE PRECISION NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "acceptedById" UUID,
    "acceptedIp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" UUID NOT NULL,
    "quoteId" UUID NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "payoutStatus" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "eventEndsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'REQUIRES_PAYMENT',
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "stripeIntentId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealSheet" (
    "id" UUID NOT NULL,
    "quoteId" UUID NOT NULL,
    "status" "DealSheetStatus" NOT NULL DEFAULT 'DRAFT',
    "lockedPayloadJson" JSONB NOT NULL,
    "artistAcceptedAt" TIMESTAMP(3),
    "artistAcceptedById" UUID,
    "artistAcceptedIp" TEXT,
    "bookerAcceptedAt" TIMESTAMP(3),
    "bookerAcceptedById" UUID,
    "bookerAcceptedIp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealSheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "openedById" UUID NOT NULL,
    "summary" TEXT NOT NULL,
    "open" BOOLEAN NOT NULL DEFAULT true,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" UUID NOT NULL,
    "reporterId" UUID NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "ip" TEXT,
    "metaJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "userId" UUID,
    "metaJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ArtistProfile_userId_key" ON "ArtistProfile"("userId");

-- CreateIndex
CREATE INDEX "ArtistProfile_city_category_published_idx" ON "ArtistProfile"("city", "category", "published");

-- CreateIndex
CREATE INDEX "ArtistProfile_country_city_idx" ON "ArtistProfile"("country", "city");

-- CreateIndex
CREATE INDEX "ArtistProfile_travelScope_idx" ON "ArtistProfile"("travelScope");

-- CreateIndex
CREATE INDEX "ArtistProfile_latitude_longitude_idx" ON "ArtistProfile"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "AvailabilityDate_date_open_idx" ON "AvailabilityDate"("date", "open");

-- CreateIndex
CREATE UNIQUE INDEX "AvailabilityDate_artistProfileId_date_key" ON "AvailabilityDate"("artistProfileId", "date");

-- CreateIndex
CREATE INDEX "MediaAsset_artistProfileId_status_idx" ON "MediaAsset"("artistProfileId", "status");

-- CreateIndex
CREATE INDEX "MediaAsset_ownerId_idx" ON "MediaAsset"("ownerId");

-- CreateIndex
CREATE INDEX "SocialLink_artistProfileId_idx" ON "SocialLink"("artistProfileId");

-- CreateIndex
CREATE INDEX "Inquiry_artistProfileId_status_idx" ON "Inquiry"("artistProfileId", "status");

-- CreateIndex
CREATE INDEX "Inquiry_bookerId_status_idx" ON "Inquiry"("bookerId", "status");

-- CreateIndex
CREATE INDEX "Message_inquiryId_createdAt_idx" ON "Message"("inquiryId", "createdAt");

-- CreateIndex
CREATE INDEX "Quote_inquiryId_idx" ON "Quote"("inquiryId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_quoteId_key" ON "Booking"("quoteId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripeIntentId_key" ON "Payment"("stripeIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_idempotencyKey_key" ON "Payment"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Payment_bookingId_idx" ON "Payment"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "DealSheet_quoteId_key" ON "DealSheet"("quoteId");

-- CreateIndex
CREATE INDEX "Incident_bookingId_open_idx" ON "Incident"("bookingId", "open");

-- CreateIndex
CREATE INDEX "AuditEvent_entityType_entityId_idx" ON "AuditEvent"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_name_createdAt_idx" ON "AnalyticsEvent"("name", "createdAt");

-- AddForeignKey
ALTER TABLE "ArtistProfile" ADD CONSTRAINT "ArtistProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityDate" ADD CONSTRAINT "AvailabilityDate_artistProfileId_fkey" FOREIGN KEY ("artistProfileId") REFERENCES "ArtistProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_artistProfileId_fkey" FOREIGN KEY ("artistProfileId") REFERENCES "ArtistProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialLink" ADD CONSTRAINT "SocialLink_artistProfileId_fkey" FOREIGN KEY ("artistProfileId") REFERENCES "ArtistProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_artistProfileId_fkey" FOREIGN KEY ("artistProfileId") REFERENCES "ArtistProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_bookerId_fkey" FOREIGN KEY ("bookerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_artistProfileId_fkey" FOREIGN KEY ("artistProfileId") REFERENCES "ArtistProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_artistUserId_fkey" FOREIGN KEY ("artistUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealSheet" ADD CONSTRAINT "DealSheet_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
