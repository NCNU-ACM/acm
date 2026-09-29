import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // 正式環境掛在 https://網域/admin/ 底下，
  // 沒有這行的話 build 出來的 JS/CSS 會指向根目錄而 404。
  base: '/admin/',

  server: {
    // 本機開發時把 /api 轉給後端，讓開發與正式環境走同一條路徑，
    // client.ts 不需要為兩種環境寫不同的位址。
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
