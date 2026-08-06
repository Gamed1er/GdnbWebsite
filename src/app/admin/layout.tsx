'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  LayoutDashboard, PlusCircle, Settings, LogOut, Gamepad2, Newspaper, FolderKanban, Map,
} from 'lucide-react';

const navItems = [
  { href: '/admin', label: '儀表板', icon: LayoutDashboard, exact: true },
  { href: '/admin/new', label: '新增貼文', icon: PlusCircle },
  { href: '/admin/settings', label: '設定', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (!isLoginPage && status === 'unauthenticated') router.push('/admin/login');
  }, [status, router, isLoginPage]);

  // 登入頁面直接顯示，不需要 auth
  if (isLoginPage) return <>{children}</>;

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === 'unauthenticated') return null;

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col py-6 px-4 fixed h-full z-10">
        <Link href="/" className="flex items-center gap-2 mb-8 px-2">
          <Gamepad2 className="text-blue-400" size={22} />
          <span className="font-bold text-white text-lg">遊戲亡 Admin</span>
        </Link>

        <nav className="flex-1 space-y-1">
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}

          <div className="pt-4 border-t border-gray-800 mt-4">
            <p className="text-xs text-gray-600 px-3 pb-2 uppercase tracking-wider">快速新增</p>
            <Link href="/admin/new?type=blog" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
              <Newspaper size={16} />部落格
            </Link>
            <Link href="/admin/new?type=portfolio" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
              <FolderKanban size={16} />作品集
            </Link>
            <Link href="/admin/new?type=minecraft" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
              <Map size={16} />地圖
            </Link>
          </div>
        </nav>

        <button
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-colors mt-4"
        >
          <LogOut size={16} />登出
        </button>
      </aside>

      {/* Main */}
      <main className="ml-56 flex-1 p-8">{children}</main>
    </div>
  );
}
