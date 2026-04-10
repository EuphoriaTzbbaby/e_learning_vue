#!/usr/bin/env node
import fs from 'fs'
import path from 'path'

const root = process.cwd()
const apiDir = path.join(root, 'src', 'api')

function readTsFiles(dir) {
  const files = fs.readdirSync(dir)
  const result = []
  for (const f of files) {
    const p = path.join(dir, f)
    const stat = fs.statSync(p)
    if (stat.isDirectory()) continue
    if (f.endsWith('.ts')) {
      const content = fs.readFileSync(p, 'utf-8')
      result.push({ file: f, fullPath: p, content })
    }
  }
  return result
}

function extractExports(content) {
  const items = []
  // export function foo(a: string): Promise<void>
  const fnRe = /export\s+function\s+([A-Za-z0-9_]+)\s*\(([^)]*)\)/g
  let m
  while ((m = fnRe.exec(content))) {
    items.push({ type: 'function', name: m[1], signature: `(${m[2]})` })
  }
  // export const api = { ... } / export const foo = ...
  const constRe = /export\s+const\s+([A-Za-z0-9_]+)\s*[:=]/g
  while ((m = constRe.exec(content))) {
    items.push({ type: 'const', name: m[1] })
  }
  // export default xxx
  const defRe = /export\s+default\s+([A-Za-z0-9_]+)/g
  while ((m = defRe.exec(content))) {
    items.push({ type: 'default', name: m[1] })
  }
  return items
}

function buildHtml(files) {
  const rows = files.map(({ file, content }) => {
    const exports = extractExports(content)
    const list = exports.length
      ? exports.map(e => `<li><code>${e.type}</code> <b>${e.name}</b> ${e.signature ?? ''}</li>`).join('\n')
      : '<li><i>未发现导出</i></li>'
    const code = content.replace(/</g, '&lt;').replace(/>/g, '&gt;')
    return `
    <section>
      <h2>${file}</h2>
      <ul>${list}</ul>
      <pre><code>${code}</code></pre>
    </section>`
  }).join('\n')

  return `<!doctype html>
  <html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <title>API 文档快照</title>
    <style>
      body { font-family: -apple-system, system-ui, Segoe UI, PingFang SC, Microsoft YaHei; margin: 24px; }
      h1 { margin-bottom: 8px; }
      section { margin: 24px 0; }
      code { background: #f6f8fa; padding: 2px 4px; border-radius: 3px; }
      pre { background: #f6f8fa; padding: 12px; overflow: auto; border: 1px solid #eee; border-radius: 6px; }
    </style>
  </head>
  <body>
    <h1>src/api 目录文档快照</h1>
    <p>生成时间：${new Date().toLocaleString()}</p>
    ${rows}
  </body>
  </html>`
}

function main() {
  if (!fs.existsSync(apiDir)) {
    console.error('未找到目录：', apiDir)
    process.exit(1)
  }
  const files = readTsFiles(apiDir)
  const html = buildHtml(files)
  const htmlPath = path.join(root, 'api-doc.html')
  const docPath = path.join(root, 'api-doc.doc')
  fs.writeFileSync(htmlPath, html, 'utf-8')
  fs.writeFileSync(docPath, html, 'utf-8')
  console.log('已生成：', htmlPath)
  console.log('已生成：', docPath)
}

main()