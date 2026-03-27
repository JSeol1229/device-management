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
import { ImageViewer, ClickableImage } from '@/components/ui/image-viewer';

interface Device {
  id: number;
  name: string;
  model: string;
  manufacturer: string;
  serial_number: string;
  purchase_date: string;
  status: string;
  description: string;
  photos: string[];
  created_at: string;
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [viewerInitialIndex, setViewerInitialIndex] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    model: '',
    manufacturer: '',
    serial_number: '',
    purchase_date: '',
    status: '正常',
    description: '',
    photos: [] as string[],
  });

  useEffect(() => {
    fetchDevices();
  }, [statusFilter]);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      
      const response = await fetch(`/api/devices?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setDevices(data.data || []);
      }
    } catch (error) {
      console.error('获取设备列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

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
        setFormData({ ...formData, photos: [...formData.photos, ...data.data.urls] });
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
      const url = selectedDevice ? `/api/devices/${selectedDevice.id}` : '/api/devices';
      const method = selectedDevice ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (data.success) {
        setDialogOpen(false);
        resetForm();
        fetchDevices();
      } else {
        alert(data.error || '操作失败');
      }
    } catch (error) {
      console.error('保存设备失败:', error);
      alert('保存设备失败');
    }
  };

  const handleDelete = async () => {
    if (!selectedDevice) return;
    
    try {
      const response = await fetch(`/api/devices/${selectedDevice.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        setDeleteDialogOpen(false);
        setSelectedDevice(null);
        fetchDevices();
      } else {
        alert(data.error || '删除失败');
      }
    } catch (error) {
      console.error('删除设备失败:', error);
      alert('删除设备失败');
    }
  };

  const openEditDialog = (device: Device) => {
    setSelectedDevice(device);
    setFormData({
      name: device.name,
      model: device.model || '',
      manufacturer: device.manufacturer,
      serial_number: device.serial_number || '',
      purchase_date: device.purchase_date ? device.purchase_date.split('T')[0] : '',
      status: device.status,
      description: device.description || '',
      photos: device.photos || [],
    });
    setDialogOpen(true);
  };

  const openDeleteDialog = (device: Device) => {
    setSelectedDevice(device);
    setDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      model: '',
      manufacturer: '',
      serial_number: '',
      purchase_date: '',
      status: '正常',
      description: '',
      photos: [],
    });
    setSelectedDevice(null);
  };

  const openImageViewer = (photos: string[], index: number) => {
    setViewerImages(photos);
    setViewerInitialIndex(index);
    setImageViewerOpen(true);
  };

  const filteredDevices = devices.filter(
    (device) =>
      device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.model?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusColors: Record<string, string> = {
    '正常': 'bg-green-100 text-green-800',
    '维修中': 'bg-yellow-100 text-yellow-800',
    '报废': 'bg-red-100 text-red-800',
    '停用': 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="space-y-6">
      {/* 顶部操作栏 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="搜索设备名称、型号或厂家..."
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
              <SelectItem value="正常">正常</SelectItem>
              <SelectItem value="维修中">维修中</SelectItem>
              <SelectItem value="停用">停用</SelectItem>
              <SelectItem value="报废">报废</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          添加设备
        </Button>
      </div>

      {/* 设备列表 */}
      {loading ? (
        <div className="py-12 text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      ) : filteredDevices.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">暂无设备数据</p>
            <Button className="mt-4" onClick={() => { resetForm(); setDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              添加第一个设备
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDevices.map((device) => (
            <Card key={device.id} className="transition-all hover:shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{device.name}</CardTitle>
                  <Badge className={statusColors[device.status] || 'bg-gray-100 text-gray-800'}>
                    {device.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">型号:</span>
                    <span className="font-medium">{device.model || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">厂家:</span>
                    <span className="font-medium">{device.manufacturer}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">序列号:</span>
                    <span className="font-medium">{device.serial_number || '-'}</span>
                  </div>
                  {device.purchase_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">购买日期:</span>
                      <span className="font-medium">
                        {format(new Date(device.purchase_date), 'yyyy-MM-dd')}
                      </span>
                    </div>
                  )}
                  {device.photos && device.photos.length > 0 && (
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {device.photos.slice(0, 3).map((photo, index) => (
                        <ClickableImage
                          key={index}
                          src={photo}
                          alt={`照片 ${index + 1}`}
                          className="w-16 h-16 rounded-lg border"
                          onClick={() => openImageViewer(device.photos, index)}
                        />
                      ))}
                      {device.photos.length > 3 && (
                        <div 
                          className="w-16 h-16 rounded-lg border flex items-center justify-center bg-gray-100 text-sm text-gray-600 cursor-pointer hover:bg-gray-200"
                          onClick={() => openImageViewer(device.photos, 3)}
                        >
                          +{device.photos.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                  {device.description && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-gray-600 dark:text-gray-400 text-xs">
                        {device.description}
                      </p>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEditDialog(device)}
                  >
                    <Pencil className="mr-1 h-3 w-3" />
                    编辑
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-red-600 hover:text-red-700"
                    onClick={() => openDeleteDialog(device)}
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

      {/* 添加/编辑设备对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedDevice ? '编辑设备' : '添加设备'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">设备名称 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">型号</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manufacturer">厂家名称 *</Label>
                <Input
                  id="manufacturer"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serial_number">序列号</Label>
                <Input
                  id="serial_number"
                  value={formData.serial_number}
                  onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchase_date">购买日期</Label>
                <Input
                  id="purchase_date"
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">状态</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="正常">正常</SelectItem>
                    <SelectItem value="维修中">维修中</SelectItem>
                    <SelectItem value="停用">停用</SelectItem>
                    <SelectItem value="报废">报废</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">备注</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
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
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                取消
              </Button>
              <Button type="submit">
                {selectedDevice ? '保存' : '添加'}
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
              确定要删除设备 &quot;{selectedDevice?.name}&quot; 吗？此操作将同时删除该设备的所有维修记录、保养记录和检测提醒，且无法恢复。
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

      {/* 图片查看器 */}
      <ImageViewer
        images={viewerImages}
        initialIndex={viewerInitialIndex}
        isOpen={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
      />
    </div>
  );
}
