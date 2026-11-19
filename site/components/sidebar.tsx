import Link from 'next/link';
import type { NavTab } from '@/lib/nav';
import { getPageByPath, menuTitleOf } from '@/lib/source';
import { Icon } from './icon';

/**
 * The menu of one tab: its groups, each with its icon and its pages. Its
 * links do not prefetch: about fifty pages would be fetched on every load.
 */
export function Sidebar({ tab, currentPath }: { tab: NavTab; currentPath: string }) {
  return (
    <nav className="cc-sidebar" aria-label={tab.name}>
      {tab.groups.map((group) => (
        <div className="cc-nav-group" key={group.name}>
          <p className="cc-nav-group-title">
            {group.icon ? <Icon icon={group.icon} size={14} /> : null}
            {group.name}
          </p>
          <ul className="cc-nav-list">
            {group.pages.map((path) => {
              const page = getPageByPath(path);
              if (!page) return null;
              const icon = page.entry.icon;
              return (
                <li key={path}>
                  <Link
                    className="cc-nav-link"
                    href={page.url}
                    prefetch={false}
                    aria-current={path === currentPath ? 'page' : undefined}
                  >
                    {icon ? <Icon icon={icon} size={15} /> : null}
                    {menuTitleOf(page)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
