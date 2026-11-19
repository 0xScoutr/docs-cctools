import { defineCollections, defineConfig } from 'fumadocs-mdx/config';
import { pageSchema } from 'fumadocs-core/source/schema';
import { createCssVariablesTheme } from 'shiki';
import { z } from 'zod';

/**
 * The pages stay where Mintlify served them from: English at the repository
 * root, Spanish, Portuguese and Chinese under es/, pt/ and zh/. The site lives
 * in site/, so the collection reads the parent folder and only the page
 * folders, never site/ itself.
 */
export const pages = defineCollections({
  type: 'doc',
  dir: '..',
  files: ['*.mdx', '*/**/*.mdx', '!site/**', '!node_modules/**'],
  schema: pageSchema.extend({
    sidebarTitle: z.string().optional(),
    mode: z.string().optional(),
  }),
});

/**
 * Code blocks read their colors from CSS variables (--shiki-*), set in
 * app/globals.css from the v3 code tokens: paper text, lime keys and
 * commands, dim punctuation. The same idea as Mintlify's css-variables theme.
 */
const v3Code = createCssVariablesTheme({
  name: 'cc-v3',
  variablePrefix: '--shiki-',
  fontStyle: true,
});

export default defineConfig({
  mdxOptions: {
    rehypeCodeOptions: {
      // One theme for both color schemes (the island is dark in both), so
      // the colors go inline; Fumadocs' default pair would be replaced anyway.
      themes: { light: v3Code },
      defaultColor: 'light',
      // Mintlify drew no per-language icon in a block's header.
      icon: false,
      langAlias: { sh: 'bash', shell: 'bash' },
    },
  },
});
