import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // 正式網域。canonical 連結、sitemap、Open Graph 圖片網址都由此產生，
  // 填錯或沒填會導致搜尋引擎收錄到錯誤位址。網域確定後修改這一行。
  site: 'https://acm.ncnu.edu.tw',

  integrations: [
    react(),
    sitemap(),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});