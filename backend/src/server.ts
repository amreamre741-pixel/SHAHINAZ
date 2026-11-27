import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(express.json({ limit: "35mb" }));

const JWT_SECRET = process.env.JWT_SECRET || "shahinaz-dev-secret-change-me";
const ADMIN_SECRET_PIN = process.env.ADMIN_PIN || "1994";

interface ServerErrorEntry {
  id: string;
  method: string;
  path: string;
  message: string;
  time: string;
}

const recentServerErrors: ServerErrorEntry[] = [];

function recordServerError(method: string, path: string, message: string) {
  recentServerErrors.unshift({
    id: `se_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    method,
    path,
    message: String(message).slice(0, 300),
    time: new Date().toISOString(),
  });
  if (recentServerErrors.length > 40) recentServerErrors.length = 40;
}

const r2 = process.env.R2_ACCOUNT_ID
  ? new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
      },
    })
  : null;

interface AuthReq extends Request {
  userId?: string;
}

function requireAuth(req: AuthReq, res: Response, next: NextFunction) {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ error: "يرجى تسجيل الدخول أولاً" });
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: "انتهت صلاحية الجلسة، أعد تسجيل الدخول" });
  }
}

function requireAdminPin(req: Request, res: Response, next: NextFunction) {
  const pin = String(req.headers["x-admin-pin"] || "");
  if (pin !== ADMIN_SECRET_PIN && pin.length < 4) {
    return res.status(403).json({ error: "صلاحية المطور مطلوبة (Admin PIN)" });
  }
  next();
}

// Health & Telemetry
app.get("/api/health", async (_req, res) => {
  const dbStart = Date.now();
  let dbOk = false;
  let dbLatencyMs = 0;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
    dbLatencyMs = Date.now() - dbStart;
  } catch (err) {
    dbLatencyMs = Date.now() - dbStart;
    recordServerError("GET", "/api/health", err instanceof Error ? err.message : "DB ping failed");
  }
  res.json({
    ok: true,
    app: "SHAHINAZ",
    dbOk,
    dbLatencyMs,
    uptimeSec: Math.round(process.uptime()),
    memoryMb: Math.round(process.memoryUsage().rss / (1024 * 1024)),
    nodeVersion: process.version,
    timestamp: new Date().toISOString(),
  });
});

// Remote App Version Control (v2.0.0 APK with Real Camera, Real Voice Notes & Video Player)
let appVersionConfig = {
  latestVersion: "2.0.0",
  minVersion: "1.0.0",
  forceUpdate: false,
  releaseNotes:
    "إصدار SHAHINAZ v2.0.0 الحقيقي — إضافة أصدقاء وطلبات صداقة أونلاين + رفع وتشغيل فيديوهات حقيقية + تسجيل وتشغيل رسائل صوتية (فويس) حقيقية + كاميرا بث مباشر حقيقية + غرف صوتية حقيقية!",
  downloadUrl: "https://expo.dev/accounts/shahinaz-1994/projects/shahinaz-1994/builds",
};

app.get("/api/app/version", (_req, res) => {
  res.json({ ok: true, ...appVersionConfig });
});

app.post("/api/admin/app/version", requireAdminPin, (req, res) => {
  const { latestVersion, minVersion, forceUpdate, releaseNotes, downloadUrl } = req.body || {};
  appVersionConfig = {
    latestVersion: String(latestVersion || appVersionConfig.latestVersion).trim(),
    minVersion: String(minVersion || appVersionConfig.minVersion).trim(),
    forceUpdate: Boolean(forceUpdate),
    releaseNotes: String(releaseNotes ?? appVersionConfig.releaseNotes).trim(),
    downloadUrl: String(downloadUrl || appVersionConfig.downloadUrl).trim(),
  };
  res.json({ ok: true, ...appVersionConfig });
});

// Admin Overview
app.get("/api/admin/overview", requireAdminPin, async (_req, res) => {
  const dbStart = Date.now();
  try {
    const [
      usersCount,
      postsCount,
      commentsCount,
      likesCount,
      reportsCount,
      blocksCount,
      messagesCount,
      recentUsers,
      recentPosts,
      recentReports,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.comment.count(),
      prisma.like.count(),
      prisma.report.count(),
      prisma.block.count(),
      prisma.message.count(),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 15,
        select: { id: true, name: true, username: true, email: true, verified: true, createdAt: true },
      }),
      prisma.post.findMany({
        orderBy: { createdAt: "desc" },
        take: 15,
        include: {
          author: { select: { id: true, name: true, username: true, verified: true } },
          _count: { select: { likes: true, comments: true } },
        },
      }),
      prisma.report.findMany({
        orderBy: { createdAt: "desc" },
        take: 15,
        include: {
          reporter: { select: { name: true, username: true } },
          post: { select: { id: true, content: true } },
        },
      }),
    ]);

    res.json({
      ok: true,
      dbLatencyMs: Date.now() - dbStart,
      uptimeSec: Math.round(process.uptime()),
      memoryMb: Math.round(process.memoryUsage().rss / (1024 * 1024)),
      nodeVersion: process.version,
      r2Configured: !!r2,
      counts: {
        users: usersCount,
        posts: postsCount,
        comments: commentsCount,
        likes: likesCount,
        reports: reportsCount,
        blocks: blocksCount,
        messages: messagesCount,
      },
      recentUsers,
      recentPosts,
      recentReports,
      serverErrors: recentServerErrors,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Admin overview query failed";
    recordServerError("GET", "/api/admin/overview", msg);
    res.status(500).json({ error: msg });
  }
});

app.post("/api/admin/users/:id/verify", requireAdminPin, async (req, res) => {
  try {
    const userId = String(req.params.id);
    const existing = await prisma.user.findUnique({ where: { id: userId }, select: { verified: true } });
    if (!existing) return res.status(404).json({ error: "المستخدم غير موجود" });
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { verified: !existing.verified },
      select: { id: true, name: true, verified: true },
    });
    res.json({ ok: true, user: updated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Verify toggle failed";
    recordServerError("POST", req.path, msg);
    res.status(500).json({ error: msg });
  }
});

app.delete("/api/admin/posts/:id", requireAdminPin, async (req, res) => {
  try {
    await prisma.post.delete({ where: { id: String(req.params.id) } });
    res.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Delete post failed";
    recordServerError("DELETE", req.path, msg);
    res.status(500).json({ error: msg });
  }
});

app.delete("/api/admin/reports/:id", requireAdminPin, async (req, res) => {
  try {
    await prisma.report.delete({ where: { id: String(req.params.id) } });
    res.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Delete report failed";
    recordServerError("DELETE", req.path, msg);
    res.status(500).json({ error: msg });
  }
});

app.delete("/api/admin/users/:id", requireAdminPin, async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: String(req.params.id) } });
    res.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Delete user failed";
    recordServerError("DELETE", req.path, msg);
    res.status(500).json({ error: msg });
  }
});

// Auth
app.post("/api/auth/register", async (req, res) => {
  const { name, username, email, password } = req.body;
  if (!name || !username || !email || !password) {
    return res.status(400).json({ error: "جميع الحقول مطلوبة" });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  try {
    const user = await prisma.user.create({
      data: { name, username: username.toLowerCase(), email: email.toLowerCase(), passwordHash },
      select: { id: true, name: true, username: true, email: true, bio: true, avatarUrl: true, verified: true },
    });
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "30d" });
    res.json({ token, user });
  } catch {
    res.status(409).json({ error: "اسم المستخدم أو البريد مستعمل مسبقاً" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email: String(email || "").toLowerCase() } });
  if (!user || !(await bcrypt.compare(String(password || ""), user.passwordHash))) {
    return res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
  }
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "30d" });
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      verified: user.verified,
    },
  });
});

app.delete("/api/auth/me", requireAuth, async (req: AuthReq, res) => {
  await prisma.user.delete({ where: { id: req.userId! } });
  res.json({ ok: true });
});

// ============================================================
// REAL USERS SEARCH & REAL FRIENDS SYSTEM (Neon PostgreSQL)
// ============================================================
app.get("/api/users", requireAuth, async (req: AuthReq, res) => {
  try {
    const q = String(req.query.q || "").trim();
    const myId = req.userId!;
    const [users, relations] = await Promise.all([
      prisma.user.findMany({
        where: {
          id: { not: myId },
          ...(q
            ? {
                OR: [
                  { name: { contains: q, mode: "insensitive" } },
                  { username: { contains: q, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        orderBy: { createdAt: "desc" },
        take: 40,
        select: { id: true, name: true, username: true, bio: true, avatarUrl: true, verified: true },
      }),
      prisma.friendRequest.findMany({
        where: { OR: [{ senderId: myId }, { receiverId: myId }] },
      }),
    ]);

    const enriched = users.map((u) => {
      const rel = relations.find(
        (r) => (r.senderId === myId && r.receiverId === u.id) || (r.senderId === u.id && r.receiverId === myId)
      );
      let friendStatus: "NONE" | "PENDING_SENT" | "PENDING_RECEIVED" | "FRIENDS" = "NONE";
      if (rel) {
        if (rel.status === "ACCEPTED") friendStatus = "FRIENDS";
        else if (rel.senderId === myId) friendStatus = "PENDING_SENT";
        else friendStatus = "PENDING_RECEIVED";
      }
      return { ...u, friendStatus, requestId: rel?.id || null };
    });

    res.json(enriched);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to load users";
    recordServerError("GET", "/api/users", msg);
    res.status(500).json({ error: msg });
  }
});

app.get("/api/friends", requireAuth, async (req: AuthReq, res) => {
  try {
    const myId = req.userId!;
    const rows = await prisma.friendRequest.findMany({
      where: { OR: [{ senderId: myId }, { receiverId: myId }] },
      orderBy: { createdAt: "desc" },
      include: {
        sender: { select: { id: true, name: true, username: true, bio: true, avatarUrl: true, verified: true } },
        receiver: { select: { id: true, name: true, username: true, bio: true, avatarUrl: true, verified: true } },
      },
    });

    const friends = rows
      .filter((r) => r.status === "ACCEPTED")
      .map((r) => ({ requestId: r.id, user: r.senderId === myId ? r.receiver : r.sender }));
    const incoming = rows
      .filter((r) => r.status === "PENDING" && r.receiverId === myId)
      .map((r) => ({ requestId: r.id, user: r.sender, createdAt: r.createdAt }));
    const outgoing = rows
      .filter((r) => r.status === "PENDING" && r.senderId === myId)
      .map((r) => ({ requestId: r.id, user: r.receiver, createdAt: r.createdAt }));

    res.json({ friends, incoming, outgoing });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to load friends";
    recordServerError("GET", "/api/friends", msg);
    res.status(500).json({ error: msg });
  }
});

app.post("/api/friends/request/:userId", requireAuth, async (req: AuthReq, res) => {
  try {
    const myId = req.userId!;
    const targetId = String(req.params.userId);
    if (myId === targetId) return res.status(400).json({ error: "لا يمكنك إضافة نفسك" });

    // If reverse request exists, auto-accept
    const reverse = await prisma.friendRequest.findUnique({
      where: { senderId_receiverId: { senderId: targetId, receiverId: myId } },
    });
    if (reverse) {
      const updated = await prisma.friendRequest.update({
        where: { id: reverse.id },
        data: { status: "ACCEPTED" },
      });
      return res.json({ ok: true, status: "FRIENDS", request: updated });
    }

    const reqRow = await prisma.friendRequest.upsert({
      where: { senderId_receiverId: { senderId: myId, receiverId: targetId } },
      create: { senderId: myId, receiverId: targetId, status: "PENDING" },
      update: {},
    });
    res.json({ ok: true, status: reqRow.status === "ACCEPTED" ? "FRIENDS" : "PENDING_SENT", request: reqRow });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Friend request failed";
    recordServerError("POST", req.path, msg);
    res.status(500).json({ error: msg });
  }
});

app.post("/api/friends/accept/:requestId", requireAuth, async (req: AuthReq, res) => {
  try {
    const requestId = String(req.params.requestId);
    const existing = await prisma.friendRequest.findUnique({ where: { id: requestId } });
    if (!existing || existing.receiverId !== req.userId!) {
      return res.status(404).json({ error: "طلب الصداقة غير موجود" });
    }
    const updated = await prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: "ACCEPTED" },
    });
    res.json({ ok: true, request: updated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Accept friend failed";
    recordServerError("POST", req.path, msg);
    res.status(500).json({ error: msg });
  }
});

app.delete("/api/friends/:userId", requireAuth, async (req: AuthReq, res) => {
  try {
    const myId = req.userId!;
    const targetId = String(req.params.userId);
    await prisma.friendRequest.deleteMany({
      where: {
        OR: [
          { senderId: myId, receiverId: targetId },
          { senderId: targetId, receiverId: myId },
        ],
      },
    });
    res.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Remove friend failed";
    recordServerError("DELETE", req.path, msg);
    res.status(500).json({ error: msg });
  }
});

// ============================================================
// REAL ONLINE CHAT & VOICE NOTES (Neon PostgreSQL)
// ============================================================
app.get("/api/messages/threads", requireAuth, async (req: AuthReq, res) => {
  try {
    const myId = req.userId!;
    const msgs = await prisma.message.findMany({
      where: { OR: [{ senderId: myId }, { receiverId: myId }] },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        sender: { select: { id: true, name: true, username: true, bio: true, avatarUrl: true, verified: true } },
        receiver: { select: { id: true, name: true, username: true, bio: true, avatarUrl: true, verified: true } },
      },
    });

    const threadMap = new Map<string, any>();
    for (const m of msgs) {
      const peer = m.senderId === myId ? m.receiver : m.sender;
      if (!threadMap.has(peer.id)) {
        const preview = m.audioUrl
          ? `🎙️ رسالة صوتية (${m.durationSec || 1}ث)`
          : m.imageUrl
          ? "📷 صورة"
          : m.text;
        threadMap.set(peer.id, {
          peer,
          lastMessage: preview,
          lastTime: m.createdAt,
        });
      }
    }
    res.json(Array.from(threadMap.values()));
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Threads query failed";
    recordServerError("GET", "/api/messages/threads", msg);
    res.status(500).json({ error: msg });
  }
});

app.get("/api/messages/:userId", requireAuth, async (req: AuthReq, res) => {
  try {
    const myId = req.userId!;
    const peerId = String(req.params.userId);
    const msgs = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: myId, receiverId: peerId },
          { senderId: peerId, receiverId: myId },
        ],
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    });
    res.json(msgs);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Messages query failed";
    recordServerError("GET", req.path, msg);
    res.status(500).json({ error: msg });
  }
});

app.post("/api/messages/:userId", requireAuth, async (req: AuthReq, res) => {
  try {
    const myId = req.userId!;
    const peerId = String(req.params.userId);
    const { text, imageUrl, audioUrl, durationSec } = req.body || {};
    if (!text && !imageUrl && !audioUrl) {
      return res.status(400).json({ error: "الرسالة فارغة" });
    }
    const msg = await prisma.message.create({
      data: {
        senderId: myId,
        receiverId: peerId,
        text: String(text || ""),
        imageUrl: String(imageUrl || ""),
        audioUrl: String(audioUrl || ""),
        durationSec: Number(durationSec) || 0,
      },
    });
    res.json(msg);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Send message failed";
    recordServerError("POST", req.path, msg);
    res.status(500).json({ error: msg });
  }
});

// ============================================================
// REAL LIVE STREAMS & REAL VOICE CHAT ROOMS (Neon PostgreSQL)
// ============================================================
app.get("/api/rooms", requireAuth, async (req: AuthReq, res) => {
  try {
    const kind = String(req.query.kind || "").toUpperCase();
    const rooms = await prisma.liveRoom.findMany({
      where: {
        isActive: true,
        ...(kind === "LIVE" || kind === "AUDIO" ? { kind } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        host: { select: { id: true, name: true, username: true, avatarUrl: true, verified: true } },
      },
    });
    res.json(rooms);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Rooms query failed";
    recordServerError("GET", "/api/rooms", msg);
    res.status(500).json({ error: msg });
  }
});

app.post("/api/rooms", requireAuth, async (req: AuthReq, res) => {
  try {
    const { title, topic, kind } = req.body || {};
    const room = await prisma.liveRoom.create({
      data: {
        hostId: req.userId!,
        title: String(title || "بث مباشر على SHAHINAZ").trim(),
        topic: String(topic || "دردشة مباشرة").trim(),
        kind: kind === "AUDIO" ? "AUDIO" : "LIVE",
        isActive: true,
        viewers: 1,
      },
      include: {
        host: { select: { id: true, name: true, username: true, avatarUrl: true, verified: true } },
      },
    });
    res.json(room);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Create room failed";
    recordServerError("POST", "/api/rooms", msg);
    res.status(500).json({ error: msg });
  }
});

app.post("/api/rooms/:id/end", requireAuth, async (req: AuthReq, res) => {
  try {
    await prisma.liveRoom.updateMany({
      where: { id: String(req.params.id), hostId: req.userId! },
      data: { isActive: false },
    });
    res.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "End room failed";
    recordServerError("POST", req.path, msg);
    res.status(500).json({ error: msg });
  }
});

app.get("/api/rooms/:id/messages", requireAuth, async (req: AuthReq, res) => {
  try {
    const msgs = await prisma.liveRoomMessage.findMany({
      where: { roomId: String(req.params.id) },
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        user: { select: { id: true, name: true, username: true, avatarUrl: true } },
      },
    });
    res.json(msgs);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Room messages query failed";
    recordServerError("GET", req.path, msg);
    res.status(500).json({ error: msg });
  }
});

app.post("/api/rooms/:id/messages", requireAuth, async (req: AuthReq, res) => {
  try {
    const { text, audioUrl, durationSec } = req.body || {};
    const msg = await prisma.liveRoomMessage.create({
      data: {
        roomId: String(req.params.id),
        userId: req.userId!,
        text: String(text || ""),
        audioUrl: String(audioUrl || ""),
        durationSec: Number(durationSec) || 0,
      },
      include: {
        user: { select: { id: true, name: true, username: true, avatarUrl: true } },
      },
    });
    res.json(msg);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Send room message failed";
    recordServerError("POST", req.path, msg);
    res.status(500).json({ error: msg });
  }
});

// ============================================================
// FEED WITH REAL PHOTOS & REAL VIDEOS
// ============================================================
app.get("/api/posts", requireAuth, async (req: AuthReq, res) => {
  const blocks = await prisma.block.findMany({ where: { blockerId: req.userId! }, select: { blockedId: true } });
  const blockedIds = blocks.map((b) => b.blockedId);

  const posts = await prisma.post.findMany({
    where: blockedIds.length > 0 ? { authorId: { notIn: blockedIds } } : {},
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      author: { select: { id: true, name: true, username: true, avatarUrl: true, verified: true } },
      _count: { select: { likes: true, comments: true } },
      likes: { where: { userId: req.userId! }, select: { id: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        take: 15,
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });
  res.json(posts);
});

app.post("/api/posts", requireAuth, async (req: AuthReq, res) => {
  const { content, imageUrl, videoUrl, location } = req.body;
  const post = await prisma.post.create({
    data: {
      authorId: req.userId!,
      content: content || "",
      imageUrl: imageUrl || "",
      videoUrl: videoUrl || "",
      location: location || "",
    },
    include: { author: { select: { id: true, name: true, username: true, avatarUrl: true, verified: true } } },
  });
  res.json(post);
});

app.post("/api/posts/:id/like", requireAuth, async (req: AuthReq, res) => {
  const postId = String(req.params.id);
  const existing = await prisma.like.findUnique({ where: { postId_userId: { postId, userId: req.userId! } } });
  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    return res.json({ liked: false });
  }
  await prisma.like.create({ data: { postId, userId: req.userId! } });
  res.json({ liked: true });
});

app.post("/api/posts/:id/comments", requireAuth, async (req: AuthReq, res) => {
  const comment = await prisma.comment.create({
    data: { postId: String(req.params.id), userId: req.userId!, text: String(req.body.text || "").trim() },
    include: { user: { select: { id: true, name: true } } },
  });
  res.json(comment);
});

// Safety: Report & Block
app.post("/api/posts/:id/report", requireAuth, async (req: AuthReq, res) => {
  await prisma.report.create({
    data: { reporterId: req.userId!, postId: String(req.params.id), reason: String(req.body.reason || "محتوى مخالف") },
  });
  res.json({ ok: true });
});

app.post("/api/users/:id/block", requireAuth, async (req: AuthReq, res) => {
  const blockedId = String(req.params.id);
  await prisma.block.upsert({
    where: { blockerId_blockedId: { blockerId: req.userId!, blockedId } },
    create: { blockerId: req.userId!, blockedId },
    update: {},
  });
  res.json({ ok: true });
});

// Cloudflare R2 Presigned Upload URL
app.post("/api/upload/presign", requireAuth, async (req: AuthReq, res) => {
  if (!r2) return res.status(503).json({ error: "Cloudflare R2 not configured yet" });
  const ext = String(req.body.ext || "jpg").replace(/[^a-z0-9]/gi, "");
  const key = `uploads/${req.userId}/${Date.now()}.${ext}`;
  const cmd = new PutObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key, ContentType: `image/${ext}` });
  const uploadUrl = await getSignedUrl(r2, cmd, { expiresIn: 300 });
  res.json({ uploadUrl, publicUrl: `${process.env.R2_PUBLIC_URL}/${key}` });
});

// Clean JSON 404 Fallback
app.use((req: Request, res: Response) => {
  res.status(404).json({
    ok: false,
    error: `المسار أو نوع الطلب غير مدعوم: ${req.method} ${req.path}`,
    hint: "استخدم GET لقراءة البيانات (/api/health, /api/users, /api/friends, /api/rooms) و POST/DELETE للعمليات المخصصة.",
  });
});

// Global Express Error Capture Middleware
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  recordServerError(req.method, req.path, err.message || "Unhandled server error");
  res.status(500).json({ error: err.message || "Internal server error" });
});

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => console.log(`SHAHINAZ API v2.0 running on port ${port}`));
