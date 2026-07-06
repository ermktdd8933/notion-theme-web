import type { MetadataRoute } from 'next'
import { getAllPublishedTemplates } from '@/lib/templatesServer'

const SITE_URL = 'https://www.notiontheme.com'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/templates`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/submissions`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${SITE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
  ]

  const templates = await getAllPublishedTemplates()
  const templateEntries: MetadataRoute.Sitemap = templates.map(t => ({
    url: `${SITE_URL}/templates/${t.id}`,
    lastModified: t.created_at ? new Date(t.created_at) : undefined,
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  return [...staticEntries, ...templateEntries]
}
