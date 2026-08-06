import type { NextAuthConfig } from 'next-auth';

// Edge-compatible config（不引用 Node.js-only 模組）
export default {
  pages: { signIn: '/admin/login' },
  session: { strategy: 'jwt' },
  providers: [], // providers 在 auth.ts 中定義
  callbacks: {
    jwt({ token, user }) {
      if (user) token.role = (user as Record<string, unknown>).role;
      return token;
    },
    session({ session, token }) {
      if (session.user) (session.user as unknown as Record<string, unknown>).role = token.role;
      return session;
    },
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isAdmin = request.nextUrl.pathname.startsWith('/admin');
      const isLogin = request.nextUrl.pathname === '/admin/login';
      if (isAdmin && !isLogin && !isLoggedIn) return false;
      return true;
    },
  },
} satisfies NextAuthConfig;
