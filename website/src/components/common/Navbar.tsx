import { useState } from 'react';
import type { GroupRef } from '../../types/content';

interface Props {
  groups: GroupRef[];
}

export default function Navbar({ groups }: Props) {
  const [showAbout, setShowAbout] = useState(false);
  const [showGroups, setShowGroups] = useState(false);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 h-16"
      style={{ backgroundColor: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}
    >
      <a href="/" className="font-bold text-lg" style={{ color: 'var(--color-accent)' }}>
        NCNU ACM
      </a>

      <ul className="flex items-center gap-8 list-none">
        <li>
          <a href="/" className="hover:text-blue-400 transition-colors">首頁</a>
        </li>

        <li className="relative" onMouseEnter={() => setShowAbout(true)} onMouseLeave={() => setShowAbout(false)}>
          <span className="cursor-pointer hover:text-blue-400 transition-colors">關於我們</span>
          {showAbout && (
            <ul
              className="absolute top-full left-0 mt-2 py-2 w-36 list-none rounded"
              style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
              <li><a href="/about/introduction" className="block px-4 py-2 hover:text-blue-400 transition-colors">社團介紹</a></li>
              <li><a href="/about/members" className="block px-4 py-2 hover:text-blue-400 transition-colors">成員介紹</a></li>
            </ul>
          )}
        </li>

        <li>
          <a href="/events" className="hover:text-blue-400 transition-colors">活動公告</a>
        </li>

        <li className="relative" onMouseEnter={() => setShowGroups(true)} onMouseLeave={() => setShowGroups(false)}>
          <span className="cursor-pointer hover:text-blue-400 transition-colors">小組簡介</span>
          {showGroups && (
            <ul
              className="absolute top-full left-0 mt-2 py-2 w-36 list-none rounded"
              style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
              {groups.map((group) => (
                <li key={group.slug}>
                  <a href={`/groups/${group.slug}`} className="block px-4 py-2 hover:text-blue-400 transition-colors">
                    {group.name}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </li>

        <li>
          <a href="/join" className="hover:text-blue-400 transition-colors">加入我們</a>
        </li>
      </ul>
    </nav>
  );
}
