'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Plus, Pencil, Trash2, Search, Bell, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface Device {
  id: number;
  name: string;
  model: string;
  manufacturer: string;
}

interface Reminder {
  id: number;
  device_id: number;
  reminder_date: string;
  description: string;
  status: string;
  is_notified: boolean;
  devices: Device;
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [formData, setFormData] = useState({
    device_id: '',
    reminder_date: '',
    description: '',
  });

  useEffect(() => {
    fetchReminders();
    fetchDevices();
  }, [statusFilter]);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      
      const response = await fetch(`/api/inspection-reminders?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setReminders(data.data || []);
      }
    } catch (error) {
      console.error('获取检测提醒失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDevices = async () => {
    try {
      const response = await fetch('/api/devices');
      const data = await response.json();
      if (data.success) {
        setDevices(data.data || []);
      }
    } catch (error) {
      console.error('获取设备列表失败:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = selectedReminder ? `/api/inspection-reminders/${selectedReminder.id}` : '/api/inspection-reminders';
      const method = selectedReminder ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (data.success) {
        setDialogOpen(false);
        resetForm();
        fetchReminders();
      } else {
        alert(data.error || '操作失败');
      }
    } catch (error) {
      console.error('保存检测提醒失败:', error);
      alert('保存检测提醒失败');
    }
  };

  const handleMarkAsCompleted = async (reminder: Reminder) => {
    try {
      const response = await fetch(`/api/inspection-reminders/${reminder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...reminder, status: '已完成' }),
      });

      const data = await response.json();
      
      if (data.success) {
        fetchReminders();
      } else {
        alert(data.error || '操作失败');
      }
    } catch (error) {
      console.error('更新检测提醒失败:', error);
      alert('更新检测提醒失败');
    }
  };

  const handleDelete = async () => {
    if (!selectedReminder) return;
    
    try {
      const response = await fetch(`/api/inspection-reminders/${selectedReminder.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        setDeleteDialogOpen(false);
        setSelectedReminder(null);
        fetchReminders();
      } else {
        alert(data.error || '删除失败');
      }
    } catch (error) {
      console.error('删除检测提醒失败:', error);
      alert('删除检测提醒失败');
    }
  };

  const openEditDialog = (reminder: Reminder) => {
    setSelectedReminder(reminder);
    setFormData({
      device_id: reminder.device_id.toString(),
      reminder_date: reminder.reminder_date.split('T')[0],
      description: reminder.description,
    });
    setDialogOpen(true);
  };

  const openDeleteDialog = (reminder: Reminder) => {
    setSelectedReminder(reminder);
    setDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      device_id: '',
      reminder_date: '',
      description: '',
    });
    setSelectedReminder(null);
  };

  const filteredReminders = reminders.filter((reminder) =>
    reminder.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reminder.devices?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusColors: Record<string, string> = {
    '待提醒': 'bg-yellow-100 text-yellow-800',
    '已提醒': 'bg-blue-100 text-blue-800',
    '已完成': 'bg-green-100 text-green-800',
  };

  const getDaysRemaining = (date: string) => {
    const days = Math.ceil(
      (new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  return (
    <div className="space-y-6">
      {/* 顶部操作栏 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="搜索检测提醒..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="待提醒">待提醒</SelectItem>
              <SelectItem value="已提醒">已提醒</SelectItem>
              <SelectItem value="已完成">已完成</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          添加检测提醒
        </Button>
      </div>

      {/* 检测提醒列表 */}
      {loading ? (
        <div className="py-12 text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-red-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      ) : filteredReminders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 dark:text-gray-400">暂无检测提醒</p>
            <Button className="mt-4" onClick={() => { resetForm(); setDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              添加第一个检测提醒
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReminders.map((reminder) => {
            const daysRemaining = getDaysRemaining(reminder.reminder_date);
            const isUrgent = daysRemaining <= 30 && daysRemaining >= 0 && reminder.status === '待提醒';
            
            return (
              <Card key={reminder.id} className={`transition-all hover:shadow-lg ${isUrgent ? 'border-red-300 bg-red-50 dark:bg-red-900/10' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{reminder.devices?.name || '未知设备'}</CardTitle>
                      <Badge className={statusColors[reminder.status]}>
                        {reminder.status}
                      </Badge>
                      {isUrgent && (
                        <Badge variant="destructive">
                          {daysRemaining === 0 ? '今日' : `${daysRemaining}天后`}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {format(new Date(reminder.reminder_date), 'yyyy-MM-dd')}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300 mb-2">{reminder.description}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    型号: {reminder.devices?.model || '-'} | 厂家: {reminder.devices?.manufacturer || '-'}
                  </p>
                  <div className="mt-4 flex gap-2">
                    {reminder.status !== '已完成' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-green-600 hover:text-green-700"
                        onClick={() => handleMarkAsCompleted(reminder)}
                      >
                        <CheckCircle className="mr-1 h-3 w-3" />
                        标记完成
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(reminder)}
                    >
                      <Pencil className="mr-1 h-3 w-3" />
                      编辑
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => openDeleteDialog(reminder)}
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      删除
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 添加/编辑检测提醒对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedReminder ? '编辑检测提醒' : '添加检测提醒'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="device_id">设备 *</Label>
              <Select
                value={formData.device_id}
                onValueChange={(value) => setFormData({ ...formData, device_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择设备" />
                </SelectTrigger>
                <SelectContent>
                  {devices.map((device) => (
                    <SelectItem key={device.id} value={device.id.toString()}>
                      {device.name} ({device.manufacturer})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reminder_date">提醒日期 *</Label>
              <Input
                id="reminder_date"
                type="date"
                value={formData.reminder_date}
                onChange={(e) => setFormData({ ...formData, reminder_date: e.target.value })}
                required
              />
              <p className="text-xs text-gray-500">系统将提前一个月开始提醒</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">描述 *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit">
                {selectedReminder ? '保存' : '添加'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这条检测提醒吗？此操作无法恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
