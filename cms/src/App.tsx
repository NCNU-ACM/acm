import { useEffect, useState } from 'react';
import { api, clearToken, getToken } from './api/client';
import Login from './components/Login';
import GroupsManager from './components/GroupsManager';
import EventsManager from './components/EventsManager';
import MembersManager from './components/MembersManager';
import ShowcaseManager from './components/ShowcaseManager';
import AnnouncementsManager from './components/AnnouncementsManager';
import './App.css';

type View = 'groups' | 'events' | 'members' | 'showcase' | 'announcements';

const menuItems: { key: View; label: string }[] = [
  { key: 'groups', label: '小組管理' },
  { key: 'events', label: '活動管理' },
  { key: 'members', label: '幹部管理' },
  { key: 'showcase', label: '成果展示管理' },
  { key: 'announcements', label: '通知管理' },
];

const VERIFY_INTERVAL_MS = 5 * 60 * 1000;

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // 有 token 時要先驗證才知道該顯示登入頁還是後台；驗證期間先不畫任何東西，避免登入頁一閃而過。
  const [checkingSession, setCheckingSession] = useState(() => !!getToken());
  const [currentView, setCurrentView] = useState<View>('groups');

  const handleLogout = () => {
    clearToken();
    setIsLoggedIn(false);
  };

  // 掛載時驗證一次，之後每 5 分鐘一次；依賴陣列必須是空的，否則登入狀態一變 interval 就會重建、計時重算。
  // 沒有 token 時什麼都不做（登入畫面下 interval 仍在跑）。
  useEffect(() => {
    // 重新整理後如果 localStorage 有 token，驗證通過就維持登入；驗證失敗（過期、無效、連不上後端）
    // 才清掉 token 回到登入畫面。401 也在這裡處理，不 reload。
    const restoreSession = async () => {
      if (!getToken()) return;
      try {
        await api.verifyToken({ skipUnauthorizedReload: true });
        setIsLoggedIn(true);
      } catch {
        clearToken();
      } finally {
        setCheckingSession(false);
      }
    };

    const checkTokenValid = async () => {
      if (!getToken()) return;
      try {
        await api.verifyToken();
      } catch {
        clearToken();
        window.location.reload();
      }
    };

    restoreSession();
    const verifyInterval = setInterval(checkTokenValid, VERIFY_INTERVAL_MS);
    return () => clearInterval(verifyInterval);
  }, []);

  if (checkingSession) return null;

  if (!isLoggedIn) {
    return (
      <div>
        <Login onLoginSuccess={() => setIsLoggedIn(true)} />
      </div>
    );
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <h1>NCNU ACM</h1>
        <nav>
          {menuItems.map((item) => (
            <button
              key={item.key}
              className={currentView === item.key ? 'active' : undefined}
              onClick={() => setCurrentView(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <button className="logout-btn" onClick={handleLogout}>
          登出
        </button>
      </aside>

      <main className="content">
        {currentView === 'groups' && <GroupsManager />}
        {currentView === 'announcements' && <AnnouncementsManager />}
        {currentView === 'events' && <EventsManager />}
        {currentView === 'members' && <MembersManager />}
        {currentView === 'showcase' && <ShowcaseManager />}
      </main>
    </div>
  );
}
