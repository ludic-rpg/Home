const projects = { label: 'Projects', href: '/#projects' };
const blog = { label: 'Blog', href: '/blog' };
const about = { label: 'About', href: '/about' };
const codeOfConduct = { label: 'Code of Conduct', href: '/code-of-conduct' };

const discord = { label: 'Discord', href: 'https://discord.gg/WYQMvQcYgP', icon: 'discord' as const };
const reddit = { label: 'Reddit', href: 'https://reddit.com/r/ludicRPG', icon: 'reddit' as const };
const youtube = { label: 'YouTube', href: 'https://youtube.com/@ludicRPG', icon: 'youtube' as const };
const github = { label: 'GitHub', href: 'https://github.com/ludic-rpg', icon: 'github' as const };
const patreon = { label: 'Patreon', href: 'https://patreon.com/ludicRPG', icon: 'patreon' as const };

export const headerNavLinks = [projects, blog, about];
export const footerNavLinks = [projects, blog, about, codeOfConduct];

export const headerSocialLinks = [youtube, reddit, discord];
export const footerSocialLinks = [discord, reddit, youtube, github, patreon];

export const feedLinks = [
  { label: 'RSS Feed', href: '/rss.xml' },
  { label: 'Sitemap', href: '/sitemap.xml' },
];
