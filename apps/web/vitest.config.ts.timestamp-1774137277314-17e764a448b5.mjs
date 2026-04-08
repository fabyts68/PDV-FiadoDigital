// vitest.config.ts
import { defineConfig as defineConfig2, mergeConfig } from "file:///home/moisesvn/Documentos/Estudo/Portfolio/PDV/PDV-FiadoDigital/node_modules/.pnpm/vitest@2.1.9_@types+node@20.19.37_jsdom@26.1.0_lightningcss@1.31.1_terser@5.46.0/node_modules/vitest/dist/config.js";

// vite.config.ts
import { defineConfig } from "file:///home/moisesvn/Documentos/Estudo/Portfolio/PDV/PDV-FiadoDigital/node_modules/.pnpm/vite@6.4.1_@types+node@20.19.37_jiti@2.6.1_lightningcss@1.31.1_terser@5.46.0_tsx@4.21.0/node_modules/vite/dist/node/index.js";
import vue from "file:///home/moisesvn/Documentos/Estudo/Portfolio/PDV/PDV-FiadoDigital/node_modules/.pnpm/@vitejs+plugin-vue@5.2.4_vite@6.4.1_@types+node@20.19.37_jiti@2.6.1_lightningcss@1.31.1_terse_fsy7unhk2dhblobz3udwluuyxu/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import tailwindcss from "file:///home/moisesvn/Documentos/Estudo/Portfolio/PDV/PDV-FiadoDigital/node_modules/.pnpm/@tailwindcss+vite@4.2.1_vite@6.4.1_@types+node@20.19.37_jiti@2.6.1_lightningcss@1.31.1_terser@5.46.0_tsx@4.21.0_/node_modules/@tailwindcss/vite/dist/index.mjs";
import { VitePWA } from "file:///home/moisesvn/Documentos/Estudo/Portfolio/PDV/PDV-FiadoDigital/node_modules/.pnpm/vite-plugin-pwa@0.21.2_vite@6.4.1_@types+node@20.19.37_jiti@2.6.1_lightningcss@1.31.1_terser@_uhy63xkyx4c3jrihmvppeubrpi/node_modules/vite-plugin-pwa/dist/index.js";
import { resolve } from "node:path";
var __vite_injected_original_dirname = "/home/moisesvn/Documentos/Estudo/Portfolio/PDV/PDV-FiadoDigital/apps/web";
var vite_config_default = defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "robots.txt"],
      manifest: {
        name: "PDV FiadoDigital",
        short_name: "PDV",
        description: "Sistema de Ponto de Venda para pequenos com\xE9rcios",
        theme_color: "#1e40af",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        icons: [
          {
            src: "/icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"]
      }
    })
  ],
  resolve: {
    alias: {
      "@": resolve(__vite_injected_original_dirname, "src")
    }
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": {
        target: process.env.API_URL || "http://api:3000",
        changeOrigin: true
      },
      "/ws": {
        target: process.env.WS_URL || "ws://api:3000",
        ws: true
      }
    }
  }
});

// vitest.config.ts
var vitest_config_default = mergeConfig(
  vite_config_default,
  defineConfig2({
    test: {
      environment: "jsdom",
      exclude: ["e2e/**"],
      coverage: {
        all: false,
        provider: "v8",
        reporter: ["text", "html"],
        exclude: [
          "dist/**",
          "e2e/**",
          "*.config.ts",
          "env.d.ts",
          "src/**/*.d.ts",
          "src/**/__tests__/**",
          "src/main.ts",
          "src/App.vue"
        ],
        thresholds: {
          statements: 70
        }
      }
    }
  })
);
export {
  vitest_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZXN0LmNvbmZpZy50cyIsICJ2aXRlLmNvbmZpZy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9ob21lL21vaXNlc3ZuL0RvY3VtZW50b3MvRXN0dWRvL1BvcnRmb2xpby9QRFYvUERWLUZpYWRvRGlnaXRhbC9hcHBzL3dlYlwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvbW9pc2Vzdm4vRG9jdW1lbnRvcy9Fc3R1ZG8vUG9ydGZvbGlvL1BEVi9QRFYtRmlhZG9EaWdpdGFsL2FwcHMvd2ViL3ZpdGVzdC5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2hvbWUvbW9pc2Vzdm4vRG9jdW1lbnRvcy9Fc3R1ZG8vUG9ydGZvbGlvL1BEVi9QRFYtRmlhZG9EaWdpdGFsL2FwcHMvd2ViL3ZpdGVzdC5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcsIG1lcmdlQ29uZmlnIH0gZnJvbSBcInZpdGVzdC9jb25maWdcIjtcbmltcG9ydCB2aXRlQ29uZmlnIGZyb20gXCIuL3ZpdGUuY29uZmlnLmpzXCI7XG5cbmV4cG9ydCBkZWZhdWx0IG1lcmdlQ29uZmlnKFxuICB2aXRlQ29uZmlnLFxuICBkZWZpbmVDb25maWcoe1xuICAgIHRlc3Q6IHtcbiAgICAgIGVudmlyb25tZW50OiBcImpzZG9tXCIsXG4gICAgICBleGNsdWRlOiBbXCJlMmUvKipcIl0sXG4gICAgICBjb3ZlcmFnZToge1xuICAgICAgICBhbGw6IGZhbHNlLFxuICAgICAgICBwcm92aWRlcjogXCJ2OFwiLFxuICAgICAgICByZXBvcnRlcjogW1widGV4dFwiLCBcImh0bWxcIl0sXG4gICAgICAgIGV4Y2x1ZGU6IFtcbiAgICAgICAgICBcImRpc3QvKipcIixcbiAgICAgICAgICBcImUyZS8qKlwiLFxuICAgICAgICAgIFwiKi5jb25maWcudHNcIixcbiAgICAgICAgICBcImVudi5kLnRzXCIsXG4gICAgICAgICAgXCJzcmMvKiovKi5kLnRzXCIsXG4gICAgICAgICAgXCJzcmMvKiovX190ZXN0c19fLyoqXCIsXG4gICAgICAgICAgXCJzcmMvbWFpbi50c1wiLFxuICAgICAgICAgIFwic3JjL0FwcC52dWVcIixcbiAgICAgICAgXSxcbiAgICAgICAgdGhyZXNob2xkczoge1xuICAgICAgICAgIHN0YXRlbWVudHM6IDcwLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuICB9KSxcbik7IiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9tb2lzZXN2bi9Eb2N1bWVudG9zL0VzdHVkby9Qb3J0Zm9saW8vUERWL1BEVi1GaWFkb0RpZ2l0YWwvYXBwcy93ZWJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9ob21lL21vaXNlc3ZuL0RvY3VtZW50b3MvRXN0dWRvL1BvcnRmb2xpby9QRFYvUERWLUZpYWRvRGlnaXRhbC9hcHBzL3dlYi92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vaG9tZS9tb2lzZXN2bi9Eb2N1bWVudG9zL0VzdHVkby9Qb3J0Zm9saW8vUERWL1BEVi1GaWFkb0RpZ2l0YWwvYXBwcy93ZWIvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHZ1ZSBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tdnVlXCI7XG5pbXBvcnQgdGFpbHdpbmRjc3MgZnJvbSBcIkB0YWlsd2luZGNzcy92aXRlXCI7XG5pbXBvcnQgeyBWaXRlUFdBIH0gZnJvbSBcInZpdGUtcGx1Z2luLXB3YVwiO1xuaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gXCJub2RlOnBhdGhcIjtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW1xuICAgIHZ1ZSgpLFxuICAgIHRhaWx3aW5kY3NzKCksXG4gICAgVml0ZVBXQSh7XG4gICAgICByZWdpc3RlclR5cGU6IFwiYXV0b1VwZGF0ZVwiLFxuICAgICAgaW5jbHVkZUFzc2V0czogW1wiZmF2aWNvbi5pY29cIiwgXCJyb2JvdHMudHh0XCJdLFxuICAgICAgbWFuaWZlc3Q6IHtcbiAgICAgICAgbmFtZTogXCJQRFYgRmlhZG9EaWdpdGFsXCIsXG4gICAgICAgIHNob3J0X25hbWU6IFwiUERWXCIsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBcIlNpc3RlbWEgZGUgUG9udG8gZGUgVmVuZGEgcGFyYSBwZXF1ZW5vcyBjb21cdTAwRTlyY2lvc1wiLFxuICAgICAgICB0aGVtZV9jb2xvcjogXCIjMWU0MGFmXCIsXG4gICAgICAgIGJhY2tncm91bmRfY29sb3I6IFwiI2ZmZmZmZlwiLFxuICAgICAgICBkaXNwbGF5OiBcInN0YW5kYWxvbmVcIixcbiAgICAgICAgb3JpZW50YXRpb246IFwicG9ydHJhaXRcIixcbiAgICAgICAgaWNvbnM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzcmM6IFwiL2ljb25zL2ljb24tMTkyeDE5Mi5wbmdcIixcbiAgICAgICAgICAgIHNpemVzOiBcIjE5MngxOTJcIixcbiAgICAgICAgICAgIHR5cGU6IFwiaW1hZ2UvcG5nXCIsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzcmM6IFwiL2ljb25zL2ljb24tNTEyeDUxMi5wbmdcIixcbiAgICAgICAgICAgIHNpemVzOiBcIjUxMng1MTJcIixcbiAgICAgICAgICAgIHR5cGU6IFwiaW1hZ2UvcG5nXCIsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH0sXG4gICAgICB3b3JrYm94OiB7XG4gICAgICAgIGdsb2JQYXR0ZXJuczogW1wiKiovKi57anMsY3NzLGh0bWwsaWNvLHBuZyxzdmcsd29mZjJ9XCJdLFxuICAgICAgfSxcbiAgICB9KSxcbiAgXSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICBcIkBcIjogcmVzb2x2ZShfX2Rpcm5hbWUsIFwic3JjXCIpLFxuICAgIH0sXG4gIH0sXG4gIHNlcnZlcjoge1xuICAgIGhvc3Q6IFwiMC4wLjAuMFwiLFxuICAgIHBvcnQ6IDUxNzMsXG4gICAgcHJveHk6IHtcbiAgICAgIFwiL2FwaVwiOiB7XG4gICAgICAgIHRhcmdldDogcHJvY2Vzcy5lbnYuQVBJX1VSTCB8fCBcImh0dHA6Ly9hcGk6MzAwMFwiLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICB9LFxuICAgICAgXCIvd3NcIjoge1xuICAgICAgICB0YXJnZXQ6IHByb2Nlc3MuZW52LldTX1VSTCB8fCBcIndzOi8vYXBpOjMwMDBcIixcbiAgICAgICAgd3M6IHRydWUsXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBOFksU0FBUyxnQkFBQUEsZUFBYyxtQkFBbUI7OztBQ0E5QyxTQUFTLG9CQUFvQjtBQUN2YSxPQUFPLFNBQVM7QUFDaEIsT0FBTyxpQkFBaUI7QUFDeEIsU0FBUyxlQUFlO0FBQ3hCLFNBQVMsZUFBZTtBQUp4QixJQUFNLG1DQUFtQztBQU16QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxJQUFJO0FBQUEsSUFDSixZQUFZO0FBQUEsSUFDWixRQUFRO0FBQUEsTUFDTixjQUFjO0FBQUEsTUFDZCxlQUFlLENBQUMsZUFBZSxZQUFZO0FBQUEsTUFDM0MsVUFBVTtBQUFBLFFBQ1IsTUFBTTtBQUFBLFFBQ04sWUFBWTtBQUFBLFFBQ1osYUFBYTtBQUFBLFFBQ2IsYUFBYTtBQUFBLFFBQ2Isa0JBQWtCO0FBQUEsUUFDbEIsU0FBUztBQUFBLFFBQ1QsYUFBYTtBQUFBLFFBQ2IsT0FBTztBQUFBLFVBQ0w7QUFBQSxZQUNFLEtBQUs7QUFBQSxZQUNMLE9BQU87QUFBQSxZQUNQLE1BQU07QUFBQSxVQUNSO0FBQUEsVUFDQTtBQUFBLFlBQ0UsS0FBSztBQUFBLFlBQ0wsT0FBTztBQUFBLFlBQ1AsTUFBTTtBQUFBLFVBQ1I7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLE1BQ0EsU0FBUztBQUFBLFFBQ1AsY0FBYyxDQUFDLHNDQUFzQztBQUFBLE1BQ3ZEO0FBQUEsSUFDRixDQUFDO0FBQUEsRUFDSDtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxRQUFRLGtDQUFXLEtBQUs7QUFBQSxJQUMvQjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE9BQU87QUFBQSxNQUNMLFFBQVE7QUFBQSxRQUNOLFFBQVEsUUFBUSxJQUFJLFdBQVc7QUFBQSxRQUMvQixjQUFjO0FBQUEsTUFDaEI7QUFBQSxNQUNBLE9BQU87QUFBQSxRQUNMLFFBQVEsUUFBUSxJQUFJLFVBQVU7QUFBQSxRQUM5QixJQUFJO0FBQUEsTUFDTjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzs7O0FEdkRELElBQU8sd0JBQVE7QUFBQSxFQUNiO0FBQUEsRUFDQUMsY0FBYTtBQUFBLElBQ1gsTUFBTTtBQUFBLE1BQ0osYUFBYTtBQUFBLE1BQ2IsU0FBUyxDQUFDLFFBQVE7QUFBQSxNQUNsQixVQUFVO0FBQUEsUUFDUixLQUFLO0FBQUEsUUFDTCxVQUFVO0FBQUEsUUFDVixVQUFVLENBQUMsUUFBUSxNQUFNO0FBQUEsUUFDekIsU0FBUztBQUFBLFVBQ1A7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsUUFDRjtBQUFBLFFBQ0EsWUFBWTtBQUFBLFVBQ1YsWUFBWTtBQUFBLFFBQ2Q7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0YsQ0FBQztBQUNIOyIsCiAgIm5hbWVzIjogWyJkZWZpbmVDb25maWciLCAiZGVmaW5lQ29uZmlnIl0KfQo=
