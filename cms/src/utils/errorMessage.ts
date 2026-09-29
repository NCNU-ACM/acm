// catch 到的錯誤沒有型別保證；有訊息就用它，否則用呼叫端給的預設文字。
export function errorMessage(e: unknown, fallback: string): string {
  return (e instanceof Error && e.message) || fallback;
}
