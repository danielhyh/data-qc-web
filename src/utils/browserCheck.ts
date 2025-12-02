/**
 * 浏览器兼容性检测工具
 * 用于检测旧版浏览器并给出友好提示
 */

interface BrowserInfo {
  name: string
  version: string
  isSupported: boolean
  message?: string
}

/**
 * 检测浏览器类型和版本
 */
export function detectBrowser(): BrowserInfo {
  const ua = navigator.userAgent
  let browserName = '未知浏览器'
  let browserVersion = '0'
  let isSupported = true
  let message = ''

  // 检测 360 极速浏览器
  if (ua.includes('360SE') || ua.includes('360EE')) {
    browserName = '360极速浏览器'
    // 360 浏览器可能使用较老的 Chromium 内核
    const chromeMatch = ua.match(/Chrome\/(\d+)/)
    if (chromeMatch) {
      browserVersion = chromeMatch[1]
      if (parseInt(browserVersion) < 60) {
        isSupported = false
        message = '您的浏览器内核版本较旧，建议升级到最新版本以获得更好的体验'
      }
    }
  }
  // 检测 Chrome
  else if (ua.includes('Chrome') && !ua.includes('Edge')) {
    browserName = 'Chrome'
    const chromeMatch = ua.match(/Chrome\/(\d+)/)
    if (chromeMatch) {
      browserVersion = chromeMatch[1]
      if (parseInt(browserVersion) < 60) {
        isSupported = false
        message = 'Chrome 浏览器版本过低，建议升级到 Chrome 60 或更高版本'
      }
    }
  }
  // 检测 Edge
  else if (ua.includes('Edg')) {
    browserName = 'Edge'
    const edgeMatch = ua.match(/Edg\/(\d+)/)
    if (edgeMatch) {
      browserVersion = edgeMatch[1]
      if (parseInt(browserVersion) < 79) {
        isSupported = false
        message = 'Edge 浏览器版本过低，建议升级到 Edge 79 或更高版本'
      }
    }
  }
  // 检测 Firefox
  else if (ua.includes('Firefox')) {
    browserName = 'Firefox'
    const firefoxMatch = ua.match(/Firefox\/(\d+)/)
    if (firefoxMatch) {
      browserVersion = firefoxMatch[1]
      if (parseInt(browserVersion) < 60) {
        isSupported = false
        message = 'Firefox 浏览器版本过低，建议升级到 Firefox 60 或更高版本'
      }
    }
  }
  // 检测 Safari
  else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    browserName = 'Safari'
    const safariMatch = ua.match(/Version\/(\d+)/)
    if (safariMatch) {
      browserVersion = safariMatch[1]
      if (parseInt(browserVersion) < 10) {
        isSupported = false
        message = 'Safari 浏览器版本过低，建议升级到 Safari 10 或更高版本'
      }
    }
  }
  // 检测 IE（完全不支持）
  else if (ua.includes('MSIE') || ua.includes('Trident')) {
    browserName = 'Internet Explorer'
    isSupported = false
    message = 'Internet Explorer 已不再受支持，请使用 Chrome、Edge 或 Firefox 等现代浏览器'
  }

  return {
    name: browserName,
    version: browserVersion,
    isSupported,
    message
  }
}

/**
 * 检测必需的浏览器特性
 */
export function checkBrowserFeatures(): { supported: boolean; missing: string[] } {
  const missing: string[] = []

  // 检查 Promise 支持
  if (typeof Promise === 'undefined') {
    missing.push('Promise')
  }

  // 检查 async/await 支持（通过检查 AsyncFunction）
  try {
    // eslint-disable-next-line no-new-func
    new Function('return (async () => {})()')
  } catch (e) {
    missing.push('async/await')
  }

  // 检查 Proxy 支持
  if (typeof Proxy === 'undefined') {
    missing.push('Proxy')
  }

  // 检查 Map/Set 支持
  if (typeof Map === 'undefined') {
    missing.push('Map')
  }
  if (typeof Set === 'undefined') {
    missing.push('Set')
  }

  // 检查 Symbol 支持
  if (typeof Symbol === 'undefined') {
    missing.push('Symbol')
  }

  return {
    supported: missing.length === 0,
    missing
  }
}

/**
 * 显示浏览器兼容性警告
 */
export function showBrowserWarning(browserInfo: BrowserInfo): void {
  if (!browserInfo.isSupported && browserInfo.message) {
    console.warn(`[浏览器兼容性警告] ${browserInfo.message}`)
    
    // 创建警告提示框
    const warningDiv = document.createElement('div')
    warningDiv.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 99999;
        background: linear-gradient(135deg, #FFA726 0%, #FB8C00 100%);
        color: white;
        padding: 12px 20px;
        text-align: center;
        font-size: 14px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      ">
        <strong>⚠️ 浏览器兼容性提示</strong><br/>
        ${browserInfo.message}
        <button onclick="this.parentElement.parentElement.remove()" style="
          margin-left: 20px;
          background: rgba(255,255,255,0.3);
          border: 1px solid rgba(255,255,255,0.5);
          color: white;
          padding: 4px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        ">关闭</button>
      </div>
    `
    document.body.appendChild(warningDiv)
  }
}

/**
 * 初始化浏览器检测
 */
export function initBrowserCheck(): void {
  const browserInfo = detectBrowser()
  const features = checkBrowserFeatures()

  console.log(`[浏览器检测] ${browserInfo.name} ${browserInfo.version}`)
  
  if (!features.supported) {
    console.warn('[浏览器特性检测] 缺少以下特性:', features.missing.join(', '))
  }

  // 显示警告（如果需要）
  if (!browserInfo.isSupported) {
    showBrowserWarning(browserInfo)
  }
}
