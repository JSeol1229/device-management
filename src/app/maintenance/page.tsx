'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Plus, Pencil, Trash2, Search, Upload, X } from 'lucide-react';
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
import { S3Storage } from 'coze-coding-dev-sdk';

interface Device {
  id: number;
  name: string;
  model: string;
  manufacturer: string;
}

interface MaintenanceRecord {
  id: number;
  device_id: number;
  maintenance_type: string;
  description: string;
  maintenance_date: string;
  cost: string;
  technician: string;
  photos: string[];
  devices: Device;
}

export default function MaintenancePage() {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    device_id: '',
    maintenance_type: '本厂维修',
    description: '',
    maintenance_date: '',
    cost: '',
    technician: '',
    photos: [] as string[],
  });

  useEffect(() => {
    fetchRecords();
    fetchDevices();
  }, [typeFilter]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (typeFilter) params.append('maintenance_type', typeFilter);
      
      const response = await fetch(`/api/maintenance-records?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setRecords(data.data || []);
      }
    } catch (error) {
      console.error('获取维修记录失败:', error);
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // 限制最多5张照片
    const remainingSlots = 5 - formData.photos.length;
    if (remainingSlots <= 0) {
      alert('最多只能上传5张照片');
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    
    setUploading(true);
    try {
      const uploadFormData = new FormData();
      filesToUpload.forEach(file => uploadFormData.append('files', file));

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      const data = await response.json();
      
      if (data.success) {
        setFormData({ ...formData, photos: [...formData.photos, ...data.data.keys] });
        if (data.data.errors && data.data.errors.length > 0) {
          alert(`部分文件上传失败: ${data.data.errors.join('; ')}`);
        }
      } else {
        alert(data.error || '上传失败');
      }
    } catch (error) {
      console.error('上传照片失败:', error);
      alert('上传照片失败');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = formData.photos.filter((_, i) => i !== index);
    setFormData({ ...formData, photos: newPhotos });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = selectedRecord ? `/api/maintenance-records/${selectedRecord.id}` : '/api/maintenance-records';
      const method = selectedRecord ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (data.success) {
        setDialogOpen(false);
        resetForm();
        fetchRecords();
      } else {
        alert(data.error || '操作失败');
      }
    } catch (error) {
      console.error('保存维修记录失败:', error);
      alert('保存维修记录失败');
    }
  };

  const handleDelete = async () => {
    if (!selectedRecord) return;
    
    try {
      const response = await fetch(`/api/maintenance-records/${selectedRecord.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        setDeleteDialogOpen(false);
        setSelectedRecord(null);
        fetchRecords();
      } else {
        alert(data.error || '删除失败');
      }
    } catch (error) {
      console.error('删除维修记录失败:', error);
      alert('删除维修记录失败');
    }
  };

  const openEditDialog = (record: MaintenanceRecord) => {
    setSelectedRecord(record);
    setFormData({
      device_id: record.device_id.toString(),
      maintenance_type: record.maintenance_type,
      description: record.description,
      maintenance_date: record.maintenance_date.split('T')[0],
      cost: record.cost || '',
      technician: record.technician || '',
      photos: record.photos || [],
    });
    setDialogOpen(true);
  };

  const openDeleteDialog = (record: MaintenanceRecord) => {
    setSelectedRecord(record);
    setDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      device_id: '',
      maintenance_type: '本厂维修',
      description: '',
      maintenance_date: '',
      cost: '',
      technician: '',
      photos: [],
    });
    setSelectedRecord(null);
  };

  const filteredRecords = records.filter((record) =>
    record.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.devices?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.technician?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const typeColors: Record<string, string> = {
    '本厂维修': 'bg-blue-100 text-blue-800',
    '非本厂维修': 'bg-purple-100 text-purple-800',
  };

  return (
    <div className="space-y-6">
      {/* 顶部操作栏 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="搜索维修记录..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">全部</SelectItem>
              <SelectItem value="本厂维修">本厂维修</SelectItem>
              <SelectItem value="非本厂维修">非本厂维修</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          添加维修记录
        </Button>
      </div>

      {/* 维修记录列表 */}
      {loading ? (
        <div className="py-12 text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">暂无维修记录</p>
            <Button className="mt-4" onClick={() => { resetForm(); setDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              添加第一条维修记录
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRecords.map((record) => (
            <Card key={record.id} className="transition-all hover:shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{record.devices?.name || '未知设备'}</CardTitle>
                    <Badge className={typeColors[record.maintenance_type]}>
                      {record.maintenance_type}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {format(new Date(record.maintenance_date), 'yyyy-MM-dd')}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 mb-3">{record.description}</p>
                <div className="flex flex-wrap gap-4 text-sm">
                  {record.cost && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">费用: </span>
                      <span className="font-medium text-orange-600">¥{record.cost}</span>
                    </div>
                  )}
                  {record.technician && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">维修人员: </span>
                      <span className="font-medium">{record.technician}</span>
                    </div>
                  )}
                </div>
                {record.photos && record.photos.length > 0 && (
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {record.photos.map((photo, index) => (
                      <div key={index} className="w-20 h-20 rounded-lg overflow-hidden border">
                        <img
                          src={photo}
                          alt={`照片 ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(record)}
                  >
                    <Pencil className="mr-1 h-3 w-3" />
                    编辑
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => openDeleteDialog(record)}
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    删除
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 添加/编辑维修记录对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedRecord ? '编辑维修记录' : '添加维修记录'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="maintenance_type">维修类型 *</Label>
                <Select
                  value={formData.maintenance_type}
                  onValueChange={(value) => setFormData({ ...formData, maintenance_type: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="本厂维修">本厂维修</SelectItem>
                    <SelectItem value="非本厂维修">非本厂维修</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">维修描述 *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                required
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maintenance_date">维修日期 *</Label>
                <Input
                  id="maintenance_date"
                  type="date"
                  value={formData.maintenance_date}
                  onChange={(e) => setFormData({ ...formData, maintenance_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">费用 (元)</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="technician">维修人员</Label>
                <Input
                  id="technician"
                  value={formData.technician}
                  onChange={(e) => setFormData({ ...formData, technician: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>照片 (最多5张)</Label>
              <div className="flex gap-2 flex-wrap">
                {formData.photos.map((photo, index) => (
                  <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden border">
                    <img
                      src={photo}
                      alt={`照片 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {formData.photos.length < 5 && (
                  <label className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                    {uploading ? (
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                    ) : (
                      <Upload className="h-6 w-6 text-gray-400" />
                    )}
                  </label>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit">
                {selectedRecord ? '保存' : '添加'}
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
              确定要删除这条维修记录吗？此操作无法恢复。
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
