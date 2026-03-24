import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: '招聘广告生成器',
    description: '快速生成专业招聘广告',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="zh-CN">
            <body className="antialiased min-h-screen bg-gray-50">{children}</body>
        </html>
    );
}
