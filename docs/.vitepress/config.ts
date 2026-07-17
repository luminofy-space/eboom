import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'
import { loadEnv } from 'vite'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const env = loadEnv(process.env.MODE || 'development', repoRoot, '')

/** Same source as the frontend landing (`NEXT_PUBLIC_GITHUB_URL`). */
const githubUrl = (
  env.NEXT_PUBLIC_GITHUB_URL ||
  process.env.NEXT_PUBLIC_GITHUB_URL ||
  'https://github.com'
).replace(/\/$/, '')

const githubBlobBase = `${githubUrl}/blob/main`

function pagesBaseFromGithubUrl(url: string): string {
  try {
    const parts = new URL(url).pathname.split('/').filter(Boolean)
    if (parts.length >= 2) return `/${parts[parts.length - 1]}/`
  } catch {
    /* ignore */
  }
  return '/'
}

/** Docker / preview can override (e.g. `VITEPRESS_BASE=/`); else derive from repo URL. */
const siteBase = (
  env.VITEPRESS_BASE ||
  process.env.VITEPRESS_BASE ||
  pagesBaseFromGithubUrl(githubUrl)
).replace(/\/?$/, '/')

/**
 * Rewrite out-of-tree `../` relative links (source files, root meta docs)
 * to GitHub blob URLs so they work on the static docs site.
 */
function rewriteOutOfTreeLinks(md: {
  renderer: {
    rules: Record<string, Function | undefined>
  }
}) {
  const defaultRender =
    md.renderer.rules.link_open ??
    ((tokens: any[], idx: number, options: unknown, _env: unknown, self: any) =>
      self.renderToken(tokens, idx, options))

  md.renderer.rules.link_open = (
    tokens: any[],
    idx: number,
    options: unknown,
    env: unknown,
    self: any,
  ) => {
    const hrefIndex = tokens[idx].attrIndex('href')
    if (hrefIndex >= 0) {
      const href = tokens[idx].attrs![hrefIndex][1]
      if (href.startsWith('../')) {
        const path = href.replace(/^(\.\.\/)+/, '')
        tokens[idx].attrs![hrefIndex][1] = `${githubBlobBase}/${path}`
      }
    }
    return defaultRender(tokens, idx, options, env, self)
  }
}

export default withMermaid(
  defineConfig({
    title: 'eBoom Docs',
    description:
      'Module-by-module onboarding documentation for the eBoom codebase.',
    base: siteBase,

    ignoreDeadLinks: [
      /^https?:\/\//,
      /\.\.\/eboom-backend/,
      /\.\.\/eboom-frontend/,
      /\.\.\/CONVENTIONS\.md/,
      /\.\.\/README\.md/,
      /\.\.\/Setup\.md/,
      /\.\.\/ROADMAP\.md/,
    ],

    markdown: {
      config(md) {
        rewriteOutOfTreeLinks(md)
      },
    },

    themeConfig: {
      nav: [
        { text: 'Overview', link: '/00-overview' },
        { text: 'Architecture', link: '/01-architecture' },
        { text: 'GitHub', link: githubUrl },
      ],

      sidebar: [
        {
          text: 'Start Here',
          items: [
            { text: 'Docs Index', link: '/README' },
            { text: '00 — Overview', link: '/00-overview' },
          ],
        },
        {
          text: 'Core',
          items: [
            { text: '01 — Architecture', link: '/01-architecture' },
            { text: '02 — Backend Core', link: '/02-backend-core' },
            { text: '03 — Frontend Core', link: '/03-frontend-core' },
          ],
        },
        {
          text: 'Feature Modules',
          items: [
            { text: '04 — Authentication', link: '/04-authentication' },
            {
              text: '05 — Canvas & Collaboration',
              link: '/05-canvas-collaboration',
            },
            { text: '06 — Wallets', link: '/06-wallets' },
            { text: '07 — Incomes', link: '/07-incomes' },
            { text: '08 — Expenses', link: '/08-expenses' },
            { text: '09 — Transfers', link: '/09-transfers' },
            { text: '10 — Dashboard', link: '/10-dashboard' },
            { text: '11 — Calendar', link: '/11-calendar' },
            { text: '12 — Whiteboard', link: '/12-whiteboard' },
            { text: '13 — Budgets & Goals', link: '/13-budgets-goals' },
            { text: '14 — Notifications', link: '/14-notifications' },
            { text: '15 — AI Insights', link: '/15-ai-insights' },
          ],
        },
      ],

      socialLinks: [{ icon: 'github', link: githubUrl }],

      search: {
        provider: 'local',
      },

      editLink: {
        pattern: `${githubUrl}/edit/main/docs/:path`,
        text: 'Edit this page on GitHub',
      },
    },

    mermaid: {},
  }),
)
