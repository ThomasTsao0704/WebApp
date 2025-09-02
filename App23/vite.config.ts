import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/WebApp/App23/'   // ★ 關鍵：與你的子資料夾完整相同（前後都要斜線）
})
