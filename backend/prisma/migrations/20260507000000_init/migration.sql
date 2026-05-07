-- CreateTable
CREATE TABLE "Word" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hiragana" TEXT NOT NULL,
    "katakana" TEXT,
    "kanji" TEXT,
    "romaji" TEXT,
    "deutsch" TEXT NOT NULL,
    "beispielsatz_jp" TEXT,
    "beispielsatz_de" TEXT,
    "wortart" TEXT NOT NULL,
    "jlpt_level" TEXT NOT NULL DEFAULT 'N5',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "beschreibung" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "CollectionWord" (
    "collectionId" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("collectionId", "wordId"),
    CONSTRAINT "CollectionWord_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CollectionWord_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "wordId" TEXT NOT NULL,
    "reviewedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rating" INTEGER NOT NULL,
    "repetitions" INTEGER NOT NULL,
    "easinessFactor" REAL NOT NULL,
    "intervalDays" INTEGER NOT NULL,
    "nextReviewDate" DATETIME NOT NULL,
    CONSTRAINT "Review_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WordProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "wordId" TEXT NOT NULL,
    "repetitions" INTEGER NOT NULL DEFAULT 0,
    "easinessFactor" REAL NOT NULL DEFAULT 2.5,
    "intervalDays" INTEGER NOT NULL DEFAULT 0,
    "nextReviewDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WordProgress_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "lernrichtung" TEXT NOT NULL DEFAULT 'jp_to_de',
    "frontShowHiragana" BOOLEAN NOT NULL DEFAULT true,
    "frontShowKanji" BOOLEAN NOT NULL DEFAULT false,
    "frontShowRomaji" BOOLEAN NOT NULL DEFAULT false,
    "showExampleSentence" BOOLEAN NOT NULL DEFAULT true,
    "newWordsPerDay" INTEGER NOT NULL DEFAULT 20
);

-- CreateTable
CREATE TABLE "LearningDay" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "cardsStudied" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "WordProgress_wordId_key" ON "WordProgress"("wordId");

-- CreateIndex
CREATE UNIQUE INDEX "LearningDay_date_key" ON "LearningDay"("date");

