import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import authConfig from './auth.config';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    // ── 管理員登入（帳號密碼）──────────────────────────────
    Credentials({
      credentials: {
        username: { label: 'Username' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const { default: getDb } = await import('@/lib/db');
        const db = getDb();

        const user = db
          .prepare('SELECT * FROM users WHERE username = ?')
          .get(credentials.username) as { id: number; username: string; password_hash: string; role: string } | undefined;

        if (!user) return null;

        const valid = await bcrypt.compare(credentials.password as string, user.password_hash);
        if (!valid) return null;

        return { id: String(user.id), name: user.username, role: 'admin' };
      },
    }),

    // ── 一般使用者登入（Google OAuth）─────────────────────
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    ...authConfig.callbacks,

    async signIn({ user, account }) {
      // 只有 Google 登入才寫入 public_users
      if (account?.provider !== 'google') return true;

      const email = user.email ?? '';

      const { default: getDb } = await import('@/lib/db');
      const db = getDb();

      const googleId = account.providerAccountId;
      const name = user.name ?? '使用者';
      const avatarUrl = user.image ?? null;

      // ── 管理員 Google 帳號：建/更新 public_users 但設 role=admin ──
      const adminEmail = process.env.ADMIN_EMAIL;
      const isAdmin = adminEmail && email === adminEmail;

      // 查找或建立使用者
      let existing = db
        .prepare('SELECT id, is_banned, ban_until FROM public_users WHERE google_id = ?')
        .get(googleId) as { id: number; is_banned: number; ban_until: string | null } | undefined;

      if (!existing) {
        db.prepare(
          'INSERT INTO public_users (google_id, email, name, avatar_url) VALUES (?, ?, ?, ?)'
        ).run(googleId, email, name, avatarUrl);
        existing = db
          .prepare('SELECT id, is_banned, ban_until FROM public_users WHERE google_id = ?')
          .get(googleId) as { id: number; is_banned: number; ban_until: string | null };
      } else {
        // 只在沒有自訂頭貼時才更新 Google 頭貼
        db.prepare(
          `UPDATE public_users SET name = ?, updated_at = CURRENT_TIMESTAMP
           WHERE google_id = ? AND (avatar_url IS NULL OR avatar_url LIKE 'https://%')`
        ).run(name, googleId);
      }

      // 禁言檢查（管理員跳過）
      if (!isAdmin && existing.is_banned) {
        if (!existing.ban_until) return false;
        if (new Date(existing.ban_until) > new Date()) return false;
        db.prepare('UPDATE public_users SET is_banned = 0, ban_until = NULL WHERE id = ?').run(existing.id);
      }

      // 把 publicUserId 和 role 塞進 user 物件
      (user as Record<string, unknown>).publicUserId = existing.id;
      (user as Record<string, unknown>).role = isAdmin ? 'admin' : 'user';

      return true;
    },

    jwt({ token, user }) {
      if (user) {
        // role 由 signIn callback 設定（admin 或 user），不在這裡覆蓋
        token.role = (user as Record<string, unknown>).role ?? 'user';
        token.publicUserId = (user as Record<string, unknown>).publicUserId;
      }
      return token;
    },

    session({ session, token }) {
      if (session.user) {
        const u = session.user as unknown as Record<string, unknown>;
        u.role = token.role;
        u.publicUserId = token.publicUserId;
      }
      return session;
    },
  },
});
