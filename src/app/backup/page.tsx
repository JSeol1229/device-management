'use client';

import { useState, useRef } from 'react';
import { Download, Upload, FileJson, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

interface ImportResult {
  mode: string;
  results: {
    devices: { success: number; failed: number };
    maintenance_records: { success: number; failed: number };
    service_records: { success: number; failed: number };
    inspection_reminders: { success: number; failed: number };
  };
  summary: {
    totalImported: number;
    totalFailed: number;
  };
}

export default function BackupPage() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 导出数据
  const handleExport = async () => {
    try {
      setExporting(true);
      
      const response = await fetch('/api/backup/export');
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '导出失败');
      }
      
      // 获取文件名
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `device-backup-${new Date().toISOString().split('T')[0]}.json`;
      
      // 下载文件
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('导出失败:', error);
      alert(error instanceof Error ? error.message : '导出失败');
    } finally {
      setExporting(false);
    }
  };

  // 选择文件导入
  const handleSelectFile = (mode: 'merge' | 'replace') => {
    setImportMode(mode);
    if (mode === 'replace') {
      setConfirmDialogOpen(true);
    } else {
      fileInputRef.current?.click();
    }
  };

  // 确认替换导入
  const handleConfirmReplace = () => {
    setConfirmDialogOpen(false);
    fileInputRef.current?.click();
  };

  // 导入文件
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.name.endsWith('.json')) {
      alert('请选择 JSON 格式的备份文件');
      return;
    }

    try {
      setImporting(true);
      
      // 读取文件内容
      const text = await file.text();
      const backupData = JSON.parse(text);
      
      // 验证数据格式
      if (!backupData.version || !backupData.data) {
        throw new Error('无效的备份文件格式');
      }

      // 发送导入请求
      const response = await fetch(`/api/backup/import?mode=${importMode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: text,
      });

      const result = await response.json();
      
      if (result.success) {
        setImportResult(result.data);
        setResultDialogOpen(true);
      } else {
        throw new Error(result.error || '导入失败');
      }
    } catch (error) {
      console.error('导入失败:', error);
      alert(error instanceof Error ? error.message : '导入失败');
    } finally {
      setImporting(false);
      // 重置文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h2 className="text-2xl font-bold">数据备份</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          导出或导入设备管理系统的所有数据
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 导出卡片 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900/20">
                <Download className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle>导出数据</CardTitle>
                <CardDescription>将所有数据导出为 JSON 文件</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                导出内容包括：
              </p>
              <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  所有设备信息
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  维修记录（含照片链接）
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  保养记录（含照片链接）
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  检测提醒
                </li>
              </ul>
              <Button 
                onClick={handleExport} 
                disabled={exporting}
                className="w-full"
              >
                {exporting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                    导出中...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    导出数据
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 导入卡片 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-3 dark:bg-green-900/20">
                <Upload className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle>导入数据</CardTitle>
                <CardDescription>从备份文件恢复数据</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                选择导入模式：
              </p>
              
              {/* 合并导入 */}
              <div className="p-3 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">合并导入</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      保留现有数据，追加新数据
                    </p>
                  </div>
                  <Badge variant="secondary">推荐</Badge>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full mt-3"
                  onClick={() => handleSelectFile('merge')}
                  disabled={importing}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  合并导入
                </Button>
              </div>
              
              {/* 替换导入 */}
              <div className="p-3 border rounded-lg border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-900/10">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-red-700 dark:text-red-400">替换导入</h4>
                    <p className="text-sm text-red-600/70 mt-1">
                      清空现有数据后导入（不可恢复）
                    </p>
                  </div>
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
                <Button 
                  variant="outline" 
                  className="w-full mt-3 border-red-300 text-red-600 hover:bg-red-50"
                  onClick={() => handleSelectFile('replace')}
                  disabled={importing}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  替换导入
                </Button>
              </div>

              {/* 隐藏的文件输入 */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 使用说明 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">使用说明</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-start gap-2">
              <span className="font-medium text-gray-900 dark:text-white">1. 导出数据：</span>
              <span>点击「导出数据」按钮，系统会下载一个 JSON 格式的备份文件。</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium text-gray-900 dark:text-white">2. 合并导入：</span>
              <span>将备份文件中的数据添加到现有数据中，不会删除已有数据。</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium text-gray-900 dark:text-white">3. 替换导入：</span>
              <span>先清空所有现有数据，再导入备份文件中的数据。此操作不可恢复，请谨慎使用。</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium text-gray-900 dark:text-white">4. 照片数据：</span>
              <span>导出的是照片链接，导入后照片仍从原存储位置加载。如需备份照片文件，请单独处理。</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 替换确认对话框 */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认替换导入？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将<strong className="text-red-600">清空所有现有数据</strong>（包括设备、维修记录、保养记录、检测提醒），然后导入备份文件中的数据。
              <br /><br />
              此操作<strong>不可恢复</strong>，建议先导出当前数据作为备份。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmReplace}
              className="bg-red-600 hover:bg-red-700"
            >
              确认替换
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 导入结果对话框 */}
      <AlertDialog open={resultDialogOpen} onOpenChange={setResultDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>导入完成</AlertDialogTitle>
            <AlertDialogDescription asChild>
              {importResult && (
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">成功导入 {importResult.summary.totalImported} 条记录</span>
                    </div>
                  </div>
                  
                  {importResult.summary.totalFailed > 0 && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                        <AlertCircle className="h-5 w-5" />
                        <span className="font-medium">失败 {importResult.summary.totalFailed} 条记录</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>设备：</span>
                      <span className={importResult.results.devices.failed > 0 ? 'text-red-600' : ''}>
                        {importResult.results.devices.success} 条成功
                        {importResult.results.devices.failed > 0 && `，${importResult.results.devices.failed} 条失败`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>维修记录：</span>
                      <span className={importResult.results.maintenance_records.failed > 0 ? 'text-red-600' : ''}>
                        {importResult.results.maintenance_records.success} 条成功
                        {importResult.results.maintenance_records.failed > 0 && `，${importResult.results.maintenance_records.failed} 条失败`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>保养记录：</span>
                      <span className={importResult.results.service_records.failed > 0 ? 'text-red-600' : ''}>
                        {importResult.results.service_records.success} 条成功
                        {importResult.results.service_records.failed > 0 && `，${importResult.results.service_records.failed} 条失败`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>检测提醒：</span>
                      <span className={importResult.results.inspection_reminders.failed > 0 ? 'text-red-600' : ''}>
                        {importResult.results.inspection_reminders.success} 条成功
                        {importResult.results.inspection_reminders.failed > 0 && `，${importResult.results.inspection_reminders.failed} 条失败`}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>确定</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
