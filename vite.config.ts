import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import VueSetupExtend from 'vite-plugin-vue-setup-extend';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';
export default defineConfig({
	server: {
		port: 8080,
		proxy: {
			'/api': {
				target: 'http://127.0.0.1:10066',
				changeOrigin: true,
				rewrite: path => path.replace('/^/api/', '')
			},
			'/socket': {
				target: 'http://127.0.0.1:10066',
				changeOrigin: true,
				ws: true,
				rewrite: path => path.replace('/^/socket/', '')
			}
		}
	},
	base: './',
	plugins: [
		vue(),
		VueSetupExtend(),
		AutoImport({
			resolvers: [ElementPlusResolver()]
		}),
		Components({
			resolvers: [ElementPlusResolver()]
		})
	],
	optimizeDeps: {
		include: [
			'schart.js',
			`monaco-editor/esm/vs/language/json/json.worker`,
			`monaco-editor/esm/vs/language/css/css.worker`,
			`monaco-editor/esm/vs/language/html/html.worker`,
			`monaco-editor/esm/vs/language/typescript/ts.worker`,
			`monaco-editor/esm/vs/editor/editor.worker`
		]
	}
});
