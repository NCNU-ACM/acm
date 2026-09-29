import type {
  Announcement,
  AnnouncementInput,
  EventInput,
  EventRow,
  Group,
  LoginResponse,
  Member,
  MemberInput,
  MessageResponse,
  ShowcaseInput,
  ShowcaseRow,
  VerifyResponse,
} from '../types/api';

// 正式環境由 FastAPI 同時提供 API 與這個後台介面，所以用相對路徑即可。
// 本機開發時 Vite 的 proxy 會把 /api 轉到 http://127.0.0.1:8000（見 vite.config.ts）。
const API_BASE = '/api';

type RequestOptions = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>;
  // 預設 401 代表登入過期：清 token 並重新整理頁面。呼叫端要自己處理 401 時傳 true：
  // 登入請求的 401 是帳號或密碼錯誤，掛載時驗證 token 的 401 是回到登入畫面，
  // 兩者都要把錯誤丟給呼叫端，而不是 reload。
  skipUnauthorizedReload?: boolean;
};

function getToken() {
  return localStorage.getItem('cms_token');
}

function setToken(token: string) {
  localStorage.setItem('cms_token', token);
}

function clearToken() {
  localStorage.removeItem('cms_token');
}

async function request<T>(path: string, requestOptions: RequestOptions = {}): Promise<T> {
  const { skipUnauthorizedReload, ...options } = requestOptions;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && !skipUnauthorizedReload) {
    clearToken();
    window.location.reload();
    throw new Error('登入已過期，請重新登入');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: '發生未知錯誤' }));
    throw new Error(errorData.detail || '請求失敗');
  }

  // 後端目前沒有任何端點回 204；保留這個分支，回傳 null。
  if (response.status === 204) return null as T;
  return response.json();
}

export const api = {
  login: (username: string, password: string) =>
    request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      skipUnauthorizedReload: true,
    }),

  getGroups: () => request<Group[]>('/groups'),
  createGroup: (data: Group) =>
    request<Group>('/groups', { method: 'POST', body: JSON.stringify(data) }),
  updateGroup: (slug: string, data: Group) =>
    request<Group>(`/groups/${slug}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteGroup: (slug: string) =>
    request<MessageResponse>(`/groups/${slug}`, { method: 'DELETE' }),

  getEvents: () =>
    request<EventRow[]>('/events'),
  createEvent: (data: EventInput) =>
    request<EventRow>('/events', { method: 'POST', body: JSON.stringify(data) }),
  updateEvent: (id: string, data: EventInput) =>
    request<EventRow>(`/events/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEvent: (id: string) =>
    request<MessageResponse>(`/events/${id}`, { method: 'DELETE' }),

  getMembers: (semester?: string) =>
    request<Member[]>(semester ? `/members?semester=${semester}` : '/members'),
  createMember: (data: MemberInput) =>
    request<Member>('/members', { method: 'POST', body: JSON.stringify(data) }),
  updateMember: (semester: string, id: string, data: MemberInput) =>
    request<Member>(`/members/${semester}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMember: (semester: string, id: string) =>
    request<MessageResponse>(`/members/${semester}/${id}`, { method: 'DELETE' }),

  getShowcase: (group?: string) =>
    request<ShowcaseRow[]>(group ? `/showcase?group=${group}` : '/showcase'),
  createShowcase: (data: ShowcaseInput) =>
    request<ShowcaseRow>('/showcase', { method: 'POST', body: JSON.stringify(data) }),
  updateShowcase: (group: string, id: string, data: ShowcaseInput) =>
    request<ShowcaseRow>(`/showcase/${group}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteShowcase: (group: string, id: string) =>
    request<MessageResponse>(`/showcase/${group}/${id}`, { method: 'DELETE' }),

  getAnnouncements: () => request<Announcement[]>('/announcements'),
  createAnnouncement: (data: AnnouncementInput) =>
    request<Announcement>('/announcements', { method: 'POST', body: JSON.stringify(data) }),
  updateAnnouncement: (id: string, data: AnnouncementInput) =>
    request<Announcement>(`/announcements/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAnnouncement: (id: string) =>
    request<MessageResponse>(`/announcements/${id}`, { method: 'DELETE' }),

  verifyToken: (options?: { skipUnauthorizedReload?: boolean }) =>
    request<VerifyResponse>('/auth/verify', options),
};

export { getToken, setToken, clearToken };
