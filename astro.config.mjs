// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
	site: 'https://dustyrepo.github.io',
	base: '/Native2-Store-Documentations',
	integrations: [
		starlight({
			title: 'N2 Docs',
			description:
				'Installation, configuration, commands, and exports for the Native2 FiveM resource pack - read directly from source, not guessed.',
			logo: {
				src: './src/assets/logo.png',
				alt: 'N2 Docs logo',
			},
			favicon: '/logo.png',
			social: [{ icon: 'discord', label: 'Discord', href: 'https://discord.gg/veaHZj5Pq9' }],
			components: {
				// Dark-only by design (see src/styles/custom.css) - no light/dark toggle.
				ThemeSelect: './src/components/EmptyComponent.astro',
				// Adds a visible "Store" pill button next to the Discord icon in the
				// header, instead of a plain sidebar link that read as inert text.
				SocialIcons: './src/components/SocialIcons.astro',
			},
			customCss: ['./src/styles/custom.css'],
			sidebar: [
				{
					label: 'Scripts',
					items: [
						{ label: 'n2-recoil', slug: 'scripts/n2-recoil' },
						{ label: 'n2-knockout', slug: 'scripts/n2-knockout' },
						{ label: 'n2-chat', slug: 'scripts/n2-chat' },
						{ label: 'n2-laptop', slug: 'scripts/n2-laptop' },
						{ label: 'n2-shops', slug: 'scripts/n2-shops' },
					],
				},
			],
			head: [
				{
					tag: 'meta',
					attrs: {
						property: 'og:image',
						content: 'https://dustyrepo.github.io/Native2-Store-Documentations/logo.png',
					},
				},
			],
		}),
		sitemap(),
	],
});
