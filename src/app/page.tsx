'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Settings,
  Wrench,
  ClipboardList,
  Bell,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Stats {
  devices: number;
  maintenanceRecords: number;
  serviceRecords: number;
  upcomingReminders: number;
}

interface Reminder {
  id: number;
  device_id: number;
  reminder_date: string;
  description: string;
  status: string;
  devices: {
    name: string;
    model: string;
    manufacturer: string;
  };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    devices: 0,
    maintenanceRecords: 0,
    serviceRecords: 0,
    upcomingReminders: 0,
  });
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // 并行获取所有数据
      const [devicesRes, maintenanceRes, serviceRes, remindersRes] = await Promise.all([
        fetch('/api/devices'),
        fetch('/api/maintenance-records'),
        fetch('/api/service-records'),
        fetch('/api/inspection-reminders?upcoming=true'),
      ]);

      const devicesData = await devicesRes.json();
      const maintenanceData = await maintenanceRes.json();
      const serviceData = await serviceRes.json();
      const remindersData = await remindersRes.json();

      if (devicesData.success && maintenanceData.success && serviceData.success && remindersData.success) {
        setStats({
          devices: devicesData.data?.length || 0,
          maintenanceRecords: maintenanceData.data?.length || 0,
          serviceRecords: serviceData.data?.length || 0,
          upcomingReminders: remindersData.data?.length || 0,
        });
        setReminders(remindersData.data || []);
      }
    } catch (error) {
      console.error('获取仪表盘数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: '设备总数',
      value: stats.devices,
      icon: Settings,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      href: '/devices',
    },
    {
      title: '维修记录',
      value: stats.maintenanceRecords,
      icon: Wrench,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      href: '/maintenance',
    },
    {
      title: '保养记录',
      value: stats.serviceRecords,
      icon: ClipboardList,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      href: '/service',
    },
    {
      title: '待检测提醒',
      value: stats.upcomingReminders,
      icon: Bell,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      href: '/reminders',
    },
  ];

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Link key={card.title} href={card.href}>
            <Card className="transition-all hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {card.title}
                </CardTitle>
                <div className={`rounded-lg p-2 ${card.bgColor}`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* 即将到期的检测提醒 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              即将到期的检测提醒
            </CardTitle>
            <Link href="/reminders">
              <Button variant="outline" size="sm">
                查看全部
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {reminders.length === 0 ? (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>暂无即将到期的检测提醒</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{reminder.devices?.name || '未知设备'}</h4>
                      <Badge variant={reminder.status === '待提醒' ? 'default' : 'secondary'}>
                        {reminder.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {reminder.description}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                      型号: {reminder.devices?.model || '-'} | 厂家: {reminder.devices?.manufacturer || '-'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-red-600">
                      {format(new Date(reminder.reminder_date), 'yyyy-MM-dd')}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {Math.ceil(
                        (new Date(reminder.reminder_date).getTime() - new Date().getTime()) /
                          (1000 * 60 * 60 * 24)
                      )}{' '}
                      天后
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 快捷操作 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            快捷操作
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/devices">
              <Button className="w-full" variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                添加设备
              </Button>
            </Link>
            <Link href="/maintenance">
              <Button className="w-full" variant="outline">
                <Wrench className="mr-2 h-4 w-4" />
                添加维修记录
              </Button>
            </Link>
            <Link href="/service">
              <Button className="w-full" variant="outline">
                <ClipboardList className="mr-2 h-4 w-4" />
                添加保养记录
              </Button>
            </Link>
            <Link href="/reminders">
              <Button className="w-full" variant="outline">
                <Bell className="mr-2 h-4 w-4" />
                添加检测提醒
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
