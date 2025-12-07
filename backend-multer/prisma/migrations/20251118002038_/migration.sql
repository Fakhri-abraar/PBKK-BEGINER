-- CreateTable
CREATE TABLE "users" (
    "username" TEXT NOT NULL PRIMARY KEY,
    "password" TEXT NOT NULL,
    "refreshToken" TEXT
);

-- CreateTable
CREATE TABLE "posts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "imagePath" TEXT,
    "authorId" TEXT NOT NULL,
    "replyToId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("username") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "posts_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "posts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
