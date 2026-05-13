import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
	plugins: [react()],
	server: {
		port: 8080,
		proxy: {
			"/api": {
				target: "http://localhost:3000",
				changeOrigin: true,
			},
			"/v1": {
				target: "http://localhost:3000",
				changeOrigin: true,
			},
			"/sse": {
				target: "http://localhost:3000",
				changeOrigin: true,
				ws: true,
			},
			"/socket.io": {
				target: "http://localhost:3000",
				changeOrigin: true,
				ws: true,
			},
		},
	},
});
