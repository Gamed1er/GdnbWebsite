import type { NextAuthConfig } from 'next-auth';

// Edge-compatible config（不引用 Node.js-only 模組）
export default {
  pages: { signIn: '/admin/login' },
  session: { strategy: 'jwt' },
  providers: [], // providers 在 auth.ts 中定義
  callbacks: {
    jwt({ token, user }) {
      if (user) {
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
    authorized({ auth, request }) {
      const isAdmin = request.nextUrl.pathname.startsWith('/admin');
      const isLogin = request.nextUrl.pathname === '/admin/login';
      if (!isAdmin || isLogin) return true;

      const role = (auth?.user as unknown as Record<string, unknown>)?.role;
      if (role === 'admin') return true;

      // 已登入但非 admin → 重導首頁
      if (auth) return Response.redirect(new URL('/', request.nextUrl));

      // 未登入 → 重導登入頁
      return false;
    },
  },
} satisfies NextAuthConfig;
