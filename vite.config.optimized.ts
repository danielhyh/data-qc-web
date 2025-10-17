import {resolve} from 'path'
import type {ConfigEnv, UserConfig} from 'vite'
import {loadEnv} from 'vite'
import {createVitePlugins} from './build/vite'
import {exclude, include} from "./build/vite/optimize"

// 当前执行node命令时文件夹的地址(工作目录)
const root = process.cwd()

// 路径查找
function pathResolve(dir: string) {
    return resolve(root, '.', dir)
}

// https://vitejs.dev/config/
export default ({command, mode}: ConfigEnv): UserConfig => {
    let env = {} as any
    const isBuild = command === 'build'
    if (!isBuild) {
        env = loadEnv((process.argv[3] === '--mode' ? process.argv[4] : process.argv[3]), root)
    } else {
        env = loadEnv(mode, root)
    }
    return {
        base: env.VITE_BASE_PATH,
        root: root,
        // 服务端渲染
        server: {
            port: env.VITE_PORT,
            host: "0.0.0.0",
            open: env.VITE_OPEN === 'true',
        },
        // 项目使用的vite插件
        plugins: createVitePlugins(),
        css: {
            preprocessorOptions: {
                scss: {
                    additionalData: '@use "@/styles/variables.scss" as *;',
                    javascriptEnabled: true,
                    silenceDeprecations: ["legacy-js-api"],
                }
            }
        },
        resolve: {
            extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.scss', '.css'],
            alias: [
                {
                    find: 'vue-i18n',
                    replacement: 'vue-i18n/dist/vue-i18n.cjs.js'
                },
                {
                    find: /\@\//,
                    replacement: `${pathResolve('src')}/`
                }
            ]
        },
        build: {
            minify: 'terser',
            outDir: env.VITE_OUT_DIR || 'dist',
            sourcemap: env.VITE_SOURCEMAP === 'true' ? 'inline' : false,
            // 增加 chunk 大小限制,减少警告
            chunkSizeWarningLimit: 1000,
            terserOptions: {
                compress: {
                    drop_debugger: env.VITE_DROP_DEBUGGER === 'true',
                    drop_console: env.VITE_DROP_CONSOLE === 'true'
                }
            },
            rollupOptions: {
                output: {
                    // 优化的分包策略 - 使用函数方式实现更细粒度的控制
                    manualChunks: (id) => {
                        // node_modules 中的依赖单独打包
                        if (id.includes('node_modules')) {
                            // echarts 相关
                            if (id.includes('echarts')) {
                                return 'vendor-echarts'
                            }
                            // element-plus 相关
                            if (id.includes('element-plus')) {
                                return 'vendor-element-plus'
                            }
                            // form-create 相关
                            if (id.includes('@form-create/element-ui')) {
                                return 'vendor-form-create'
                            }
                            if (id.includes('@form-create/designer')) {
                                return 'vendor-form-designer'
                            }
                            // vue 核心库
                            if (id.includes('vue') || id.includes('pinia') || id.includes('vue-router')) {
                                return 'vendor-vue'
                            }
                            // 编辑器相关
                            if (id.includes('wangeditor') || id.includes('bpmn')) {
                                return 'vendor-editor'
                            }
                            // 其他第三方库
                            return 'vendor-libs'
                        }
                    },
                    // 优化输出文件名 - 使用内容哈希实现浏览器缓存
                    chunkFileNames: 'js/[name]-[hash].js',
                    entryFileNames: 'js/[name]-[hash].js',
                    assetFileNames: '[ext]/[name]-[hash].[ext]'
                },
            },
        },
        // 开发服务器缓存优化
        cacheDir: 'node_modules/.vite',
        optimizeDeps: {
            include,
            exclude,
            // 强制预构建
            force: false
        }
    }
}
