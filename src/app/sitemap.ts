import type { MetadataRoute } from 'next';

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://gdnb.net';

async function fetchJson<T>(path: string): Promise<T[]> {
  try {
    const res = await fetch(`${BASE}${path}`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [blogs, portfolios, maps] = await Promise.all([
    fetchJson<{ slug: string; updated_at: string }>('/api/blog'),
    fetchJson<{ id: number; updated_at: string }>('/api/portfolio'),
    fetchJson<{ id: number; updated_at: string }>('/api/minecraft'),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/`,          lastModified: new Date(), priority: 1.0,  changeFrequency: 'monthly' },
    { url: `${BASE}/blog`,      lastModified: new Date(), priority: 0.9,  changeFrequency: 'weekly'  },
    { url: `${BASE}/portfolio`, lastModified: new Date(), priority: 0.9,  changeFrequency: 'monthly' },
    { url: `${BASE}/minecraft`, lastModified: new Date(), priority: 0.9,  changeFrequency: 'monthly' },
    { url: `${BASE}/videos`,    lastModified: new Date(), priority: 0.7,  changeFrequency: 'weekly'  },
  ];

  const blogPages: MetadataRoute.Sitemap = blogs.map((p) => ({
    url: `${BASE}/blog/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    priority: 0.8,
    changeFrequency: 'monthly',
  }));

  const portfolioPages: MetadataRoute.Sitemap = portfolios.map((p) => ({
    url: `${BASE}/portfolio/${p.id}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    priority: 0.8,
    changeFrequency: 'monthly',
  }));

  const mapPages: MetadataRoute.Sitemap = maps.map((m) => ({
    url: `${BASE}/minecraft/${m.id}`,
    lastModified: m.updated_at ? new Date(m.updated_at) : new Date(),
    priority: 0.8,
    changeFrequency: 'monthly',
  }));

  return [...staticPages, ...blogPages, ...portfolioPages, ...mapPages];
}
