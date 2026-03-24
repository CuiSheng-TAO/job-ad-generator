# 招聘JD推演器 (Job Description Reasoning Engine)

基于 Next.js 14 + MiniMax-M2.5 的AI驱动JD生成工具。通过4步推演流程（需求分析 → 行业对标 → JD推演 → 最终输出）生成高质量岗位JD。

## 技术栈

- Next.js 14 (App Router) + React 18 + TypeScript
- MiniMax-M2.5 via SiliconFlow API
- Tailwind CSS

## 使用

```bash
npm install
# 创建 .env.local 并设置 NEXT_PUBLIC_SILICONFLOW_API_KEY
npm run dev
```

## 开源协议

MIT
