import type { Metadata } from 'next';
import { Inspector } from 'react-dev-inspector';
import './globals.css';
import DashboardLayout from '@/components/layout/DashboardLayout';

export const metadata: Metadata = {
  title: {
    default: '设备管理系统',
    template: '%s | 设备管理系统',
  },
  description: '专业的设备管理系统，支持维修记录、保养记录、检测提醒等功能',
  keywords: ['设备管理', '维修记录', '保养记录', '检测提醒', '月总结报告'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.COZE_PROJECT_ENV === 'DEV';

  return (
    <html lang="zh-CN">
      <body className={`antialiased`}>
        {isDev && <Inspector />}
        <DashboardLayout>{children}</DashboardLayout>
      </body>
    </html>
  );
}
