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

app.get("/api/health", (_req, res) => res.json({ ok: true, app: "SHAHINAZ" }));

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

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => console.log(`SHAHINAZ API running on port ${port}`));
