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

      const { default: getDb } = await import('@/lib/db');
      const db = getDb();

      const googleId = account.providerAccountId;
      const email = user.email ?? '';
      const name = user.name ?? '使用者';
      const avatarUrl = user.image ?? null;

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
        // 更新最新的名字和頭貼（若使用者沒有自訂）
        db.prepare(
          'UPDATE public_users SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE google_id = ? AND avatar_url NOT LIKE \'/api/uploads/%\''
        ).run(name, googleId);
      }

      // 禁言檢查
      if (existing.is_banned) {
        if (!existing.ban_until) return false; // 永久禁言
        if (new Date(existing.ban_until) > new Date()) return false; // 有限期禁言還沒結束
        // 禁言已到期，自動解除
        db.prepare('UPDATE public_users SET is_banned = 0, ban_until = NULL WHERE id = ?').run(existing.id);
      }

      // 把 publicUserId 塞進 user 物件，jwt callback 會取用
      (user as Record<string, unknown>).publicUserId = existing.id;
      (user as Record<string, unknown>).role = 'user';

      return true;
    },

    jwt({ token, user, account }) {
      if (user) {
        token.role = (user as Record<string, unknown>).role ?? 'user';
        token.publicUserId = (user as Record<string, unknown>).publicUserId;
      }
      if (account?.provider === 'google') {
        token.role = 'user';
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
