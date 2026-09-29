// 後端 API 的資料型別，依 acm-cms-backend/models.py 定義。
// Optional 欄位在回應中一定存在，沒填時是 null；送出時可以省略。

export interface Link {
  label: string;
  url: string;
}

export interface Group {
  name: string;
  slug: string;
  order: number;
  tagline: string;
  description: string;
  color: string;
}

export interface EventInput {
  title: string;
  event_date: string;
  group: string;
  type: string;
  location?: string | null;
  description: string;
  content?: string | null;
  links?: Link[] | null;
  registration?: string | null;
}

export interface EventRow extends EventInput {
  id: string;
  created_at: string;
  location: string | null;
  content: string | null;
  links: Link[] | null;
  registration: string | null;
}

export interface MemberInput {
  /** 學期代碼：民國學年加 1（上學期）或 2（下學期），例如 "1151" */
  semester: string;
  name: string;
  group?: string | null;
  role: string;
  bio?: string | null;
  avatar?: string | null;
  contact?: Link[] | null;
}

export interface Member extends MemberInput {
  id: string;
  group: string | null;
  bio: string | null;
  avatar: string | null;
  contact: Link[] | null;
}

export interface ShowcaseInput {
  title: string;
  group: string;
  /** YYYY-MM-DD */
  date: string;
  description: string;
  related_event?: string | null;
  cover_image?: string | null;
  gallery?: string[] | null;
  tags?: string[] | null;
  links?: Link[] | null;
}

export interface ShowcaseRow extends ShowcaseInput {
  id: string;
  related_event: string | null;
  cover_image: string | null;
  gallery: string[] | null;
  tags: string[] | null;
  links: Link[] | null;
}

export interface AnnouncementInput {
  title: string;
  content: string;
  active: boolean;
}

/** 公告只有 created_at，沒有 date 欄位 */
export interface Announcement extends AnnouncementInput {
  id: string;
  created_at: string;
}

export interface LoginResponse {
  token: string;
}

export interface VerifyResponse {
  valid: boolean;
}

export interface MessageResponse {
  message: string;
}
