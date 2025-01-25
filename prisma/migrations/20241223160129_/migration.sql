-- CreateEnum
CREATE TYPE "LogOp" AS ENUM ('READ', 'SAVE');

-- CreateTable
CREATE TABLE "Player" (
    "id" CHAR(36) NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" CHAR(36) NOT NULL,
    "creatorId" CHAR(36) NOT NULL,
    "file" JSON,
    "preview" JSON,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Log" (
    "id" CHAR(36) NOT NULL,
    "playerId" CHAR(36) NOT NULL,
    "gameId" CHAR(36) NOT NULL,
    "ip" TEXT,
    "ua" TEXT,
    "op" "LogOp" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Log_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
