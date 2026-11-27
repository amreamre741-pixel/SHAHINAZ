import "dotenv/config";
import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
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
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

function requireAdminPin(req: Request, res: Response, next: NextFunction) {
  const pin = String(req.headers["x-admin-pin"] || "");
  if (pin !== ADMIN_SECRET_PIN && pin.length < 4) {
    return res.status(403).json({ error: "صلاحية المطور مطلوبة (Admin PIN)" });
  }
  next();
}

// Enhanced Health Endpoint with Real Neon PostgreSQL Ping & Runtime Telemetry
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

// Remote App Version Control (for Major APK / Google Play Store Updates)
let appVersionConfig = {
  latestVersion: "1.0.0",
  minVersion: "1.0.0",
  forceUpdate: false,
  releaseNotes: "تحديث SHAHINAZ Ultra 5.0 (Royal Platinum) — شاشة دخول ملكية متحركة + 6 ثيمات (بما فيها الوضع النهاري الفاخر) + بث مباشر تفاعلي مع تسوّق حي + محفظة SHAHINAZ Pay + مهام يومية تلقائية",
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

// Live Developer Command Center APIs (Real Neon PostgreSQL Telemetry & Moderation)
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
      select: { id: true, name: true, username: true, email: true, bio: true, avatarUrl: true },
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
    user: { id: user.id, name: user.name, username: user.username, email: user.email, bio: user.bio, avatarUrl: user.avatarUrl },
  });
});

// Google Play mandatory permanent account deletion
app.delete("/api/auth/me", requireAuth, async (req: AuthReq, res) => {
  await prisma.user.delete({ where: { id: req.userId! } });
  res.json({ ok: true });
});

// Feed (filters out blocked users)
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
    },
  });
  res.json(posts);
});

app.post("/api/posts", requireAuth, async (req: AuthReq, res) => {
  const { content, imageUrl, location } = req.body;
  const post = await prisma.post.create({
    data: { authorId: req.userId!, content: content || "", imageUrl: imageUrl || "", location: location || "" },
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

// Google Play UGC Safety: Report & Block
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

// Clean JSON 404 Fallback (instead of default Express HTML)
app.use((req: Request, res: Response) => {
  res.status(404).json({
    ok: false,
    error: `المسار أو نوع الطلب غير مدعوم: ${req.method} ${req.path}`,
    hint: "استخدم GET لقراءة البيانات (/api/health, /api/admin/overview, /api/app/version) و POST/DELETE للعمليات المخصصة.",
  });
});

// Global Express Error Capture Middleware
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  recordServerError(req.method, req.path, err.message || "Unhandled server error");
  res.status(500).json({ error: err.message || "Internal server error" });
});

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => console.log(`SHAHINAZ API running on port ${port}`));
