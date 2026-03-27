'use client';

import { useEffect, useState, useRef } from 'react';
import { format } from 'date-fns';
import { Printer, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface MaintenanceRecord {
  id: number;
  device_id: number;
  maintenance_type: string;
  description: string;
  maintenance_date: string;
  cost: string;
  technician: string;
  devices: {
    name: string;
    model: string;
    manufacturer: string;
  };
}

interface ServiceRecord {
  id: number;
  device_id: number;
  service_type: string;
  description: string;
  service_date: string;
  technician: string;
  devices: {
    name: string;
    model: string;
    manufacturer: string;
  };
}

interface ReportData {
  month: string;
  maintenance: {
    total: number;
    inFactory: number;
    outFactory: number;
    totalCost: number;
    byDevice: Record<string, { name: string; count: number; cost: number }>;
    records: MaintenanceRecord[];
  };
  service: {
    total: number;
    inFactory: number;
    outFactory: number;
    byDevice: Record<string, { name: string; count: number }>;
    records: ServiceRecord[];
  };
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 默认选择当前月份
    const now = new Date();
    const currentMonth = format(now, 'yyyy-MM');
    setSelectedMonth(currentMonth);
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      fetchReport();
    }
  }, [selectedMonth]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/reports/monthly?month=${selectedMonth}`);
      const data = await response.json();
      
      if (data.success) {
        setReportData(data.data);
      }
    } catch (error) {
      console.error('获取月总结报告失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // 生成最近12个月的选项
  const generateMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = format(date, 'yyyy-MM');
      const label = format(date, 'yyyy年MM月');
      options.push({ value, label });
    }
    return options;
  };

  const monthOptions = generateMonthOptions();

  return (
    <div className="space-y-6">
      {/* 顶部操作栏 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between no-print">
        <div className="flex items-center gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="选择月份" />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button onClick={handlePrint} disabled={!reportData}>
            <Printer className="mr-2 h-4 w-4" />
            打印报告
          </Button>
        </div>
      </div>

      {/* 加载中 */}
      {loading && (
        <div className="py-12 text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      )}

      {/* 报告内容 */}
      {!loading && reportData && (
        <div ref={reportRef} className="space-y-6">
          {/* 报告标题 */}
          <div className="text-center py-6 print:py-4">
            <h1 className="text-2xl font-bold mb-2">
              设备管理系统 - 月总结报告
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {format(new Date(selectedMonth + '-01'), 'yyyy年MM月')}
            </p>
          </div>

          {/* 维修统计 */}
          <Card>
            <CardHeader>
              <CardTitle>维修记录统计</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">{reportData.maintenance.total}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">总次数</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">{reportData.maintenance.inFactory}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">本厂维修</div>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600">{reportData.maintenance.outFactory}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">非本厂维修</div>
                </div>
                <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="text-3xl font-bold text-orange-600">¥{reportData.maintenance.totalCost.toFixed(2)}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">总费用</div>
                </div>
              </div>

              {reportData.maintenance.records.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>设备名称</TableHead>
                      <TableHead>维修类型</TableHead>
                      <TableHead>维修日期</TableHead>
                      <TableHead>费用</TableHead>
                      <TableHead>维修人员</TableHead>
                      <TableHead>描述</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.maintenance.records.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.devices?.name || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={record.maintenance_type === '本厂维修' ? 'default' : 'secondary'}>
                            {record.maintenance_type}
                          </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(record.maintenance_date), 'yyyy-MM-dd')}</TableCell>
                        <TableCell>¥{record.cost || '0.00'}</TableCell>
                        <TableCell>{record.technician || '-'}</TableCell>
                        <TableCell className="max-w-xs truncate">{record.description}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {reportData.maintenance.records.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  本月暂无维修记录
                </div>
              )}
            </CardContent>
          </Card>

          {/* 保养统计 */}
          <Card>
            <CardHeader>
              <CardTitle>保养记录统计</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">{reportData.service.total}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">总次数</div>
                </div>
                <div className="text-center p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
                  <div className="text-3xl font-bold text-teal-600">{reportData.service.inFactory}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">本厂保养</div>
                </div>
                <div className="text-center p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
                  <div className="text-3xl font-bold text-cyan-600">{reportData.service.outFactory}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">非本厂保养</div>
                </div>
              </div>

              {reportData.service.records.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>设备名称</TableHead>
                      <TableHead>保养类型</TableHead>
                      <TableHead>保养日期</TableHead>
                      <TableHead>保养人员</TableHead>
                      <TableHead>描述</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.service.records.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.devices?.name || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={record.service_type === '本厂保养' ? 'default' : 'secondary'}>
                            {record.service_type}
                          </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(record.service_date), 'yyyy-MM-dd')}</TableCell>
                        <TableCell>{record.technician || '-'}</TableCell>
                        <TableCell className="max-w-xs truncate">{record.description}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {reportData.service.records.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  本月暂无保养记录
                </div>
              )}
            </CardContent>
          </Card>

          {/* 打印信息 */}
          <div className="text-center text-sm text-gray-500 mt-8 print:mt-4">
            <p>报告生成时间: {format(new Date(), 'yyyy-MM-dd HH:mm:ss')}</p>
          </div>
        </div>
      )}

      {/* 打印样式 */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          .print\\:py-4 {
            padding-top: 1rem;
            padding-bottom: 1rem;
          }
          
          .print\\:mt-4 {
            margin-top: 1rem;
          }
        }
      `}</style>
    </div>
  );
}
