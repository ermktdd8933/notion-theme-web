export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          {/* Left: brand and copyright */}
          <div className="lg:col-span-5">
            <a href="/" className="inline-flex items-center">
              <img src="/notion-theme-logo-long.png" alt="NotionTheme" className="h-10 w-auto object-contain" />
            </a>
            <p className="mt-4 text-sm text-gray-500">© 2025 NotionTheme. 保留所有权利.</p>

            {/* Bottom-left: WeChat QR placeholder + small logo */}
            <div className="mt-8 flex items-center gap-4">
              <img src="https://static.2notion.com/clipno/theme_qrcode.jpg" alt="微信群二维码" className="w-28 rounded-xl ring-1 ring-black/5" />
            </div>
          </div>

          {/* Right: link columns */}
          <div className="lg:col-span-6 lg:col-start-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div>
              <h3 className="text-gray-900 font-semibold mb-4">工具</h3>
              <ul className="space-y-3 text-sm">
                <li><a className="text-gray-600 hover:text-gray-900" href="https://templatestranslate.com" target="_blank" rel="noreferrer">Notion 模版翻译</a></li>
                <li><a className="text-gray-600 hover:text-gray-900" href="https://rednote.2notion.com" target="_blank" rel="noreferrer">小红书同步到 Notion</a></li>
                <li><a className="text-gray-600 hover:text-gray-900" href="https://weread.2notion.com" target="_blank" rel="noreferrer">微信读书同步到 Notion</a></li>
                <li><a className="text-gray-600 hover:text-gray-900" href="https://flomo.2notion.com" target="_blank" rel="noreferrer">flomo 同步到 Notion</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-gray-900 font-semibold mb-4">产品</h3>
              <ul className="space-y-3 text-sm">
                <li><a className="text-gray-600 hover:text-gray-900" href="#templates">模板库</a></li>
                <li><a className="text-gray-600 hover:text-gray-900" href="#">提交模板</a></li>
                <li><a className="text-gray-600 hover:text-gray-900" href="#">更新日志</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-gray-900 font-semibold mb-4">关于</h3>
              <ul className="space-y-3 text-sm">
                <li><a className="text-gray-600 hover:text-gray-900" href="https://blog.notionedu.com/contact">联系我们</a></li>
                <li><a className="text-gray-600 hover:text-gray-900" href="/privacy">隐私政策</a></li>
                <li><a className="text-gray-600 hover:text-gray-900" href="#">服务条款</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
