// 元件間共用的資料型別（EventItem、ShowcaseItem 等），集中在這裡定義。
// 這些資料由 .astro 頁面從 Content Collections 整理後以 props 傳入。

export interface Link {
  label: string;
  url: string;
}

export interface GroupRef {
  slug: string;
  name: string;
}

export interface Group extends GroupRef {
  tagline: string;
  description: string;
  color: string;
}

export interface EventItem {
  id: string;
  title: string;
  date: string;
  type: string;
  group: string;
  location?: string;
  description: string;
  content?: string;
  links?: Link[];
  registration?: string;
  /** 活動頁把「全體通知」合併進活動列表時為 true */
  isAnnouncement?: boolean;
}

export interface ShowcaseItem {
  id: string;
  title: string;
  group: string;
  date: string;
  description: string;
  related_event?: string;
  cover_image?: string;
  gallery?: string[];
  tags?: string[];
  links?: Link[];
}

/** 小組頁的成果輪播項目（tags 一定有值） */
export type ShowcaseCard = Omit<ShowcaseItem, 'tags'> & { tags: string[] };

/** 成員頁輪播用的幹部資料 */
export interface Member {
  id: string;
  semester: string;
  name: string;
  group?: string;
  role: string;
  bio?: string;
  avatar?: string;
  contact: Link[];
}

/** 小組頁「目前幹部」用的幹部資料 */
export interface GroupMember {
  name: string;
  role: string;
  avatar?: string;
  bio?: string;
  contact?: Link[];
}
