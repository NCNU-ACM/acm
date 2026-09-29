// 後端的 created_at 是建立當下的時間戳（YYYYMMDDHHMMSS），列表只需要日期，顯示成 YYYY-MM-DD，
// 與活動列表的日期欄一致。格式不符的值原樣顯示。
export function formatCreatedAt(createdAt: string): string {
  const match = /^(\d{4})(\d{2})(\d{2})/.exec(createdAt);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : createdAt;
}
