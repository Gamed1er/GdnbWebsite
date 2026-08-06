import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import authConfig from './auth.config';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        username: { label: 'Username' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        // 動態 import 避免 Edge Runtime 載入 better-sqlite3
        const { default: getDb } = await import('@/lib/db');
        const db = getDb();

        const user = db
          .prepare('SELECT * FROM users WHERE username = ?')
          .get(credentials.username) as { id: number; username: string; password_hash: string; role: string } | undefined;

        if (!user) return null;

        const valid = await bcrypt.compare(credentials.password as string, user.password_hash);
        if (!valid) return null;

        return { id: String(user.id), name: user.username, role: user.role };
      },
    }),
  ],
});
