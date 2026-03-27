import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

interface BackupData {
  version: string;
  exportedAt: string;
  data: {
    devices: any[];
    maintenance_records: any[];
    service_records: any[];
    inspection_reminders: any[];
  };
  statistics?: {
    devices: number;
    maintenance_records: number;
    service_records: number;
    inspection_reminders: number;
  };
}

// POST - 导入数据
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    
    // 解析请求体
    const body: BackupData = await request.json();

    // 验证数据格式
    if (!body.version || !body.data) {
      return NextResponse.json(
        { success: false, error: '无效的备份文件格式' },
        { status: 400 }
      );
    }

    const { devices, maintenance_records, service_records, inspection_reminders } = body.data;

    const results = {
      devices: { success: 0, failed: 0 },
      maintenance_records: { success: 0, failed: 0 },
      service_records: { success: 0, failed: 0 },
      inspection_reminders: { success: 0, failed: 0 },
    };

    // 获取导入选项
    const importMode = request.nextUrl.searchParams.get('mode') || 'merge'; // merge | replace

    // 如果是替换模式，先清空现有数据
    if (importMode === 'replace') {
      await client.from('inspection_reminders').delete().neq('id', 0);
      await client.from('service_records').delete().neq('id', 0);
      await client.from('maintenance_records').delete().neq('id', 0);
      await client.from('devices').delete().neq('id', 0);
    }

    // ID 映射表（用于处理外键关系）
    const deviceIdMap: Record<number, number> = {};

    // 导入设备数据
    if (devices && devices.length > 0) {
      for (const device of devices) {
        try {
          const oldId = device.id;
          const { id, created_at, updated_at, ...deviceData } = device;
          
          const { data, error } = await client
            .from('devices')
            .insert(deviceData)
            .select()
            .single();

          if (error) {
            console.error('导入设备失败:', error);
            results.devices.failed++;
          } else {
            deviceIdMap[oldId] = data.id;
            results.devices.success++;
          }
        } catch (err) {
          console.error('导入设备异常:', err);
          results.devices.failed++;
        }
      }
    }

    // 导入维修记录
    if (maintenance_records && maintenance_records.length > 0) {
      for (const record of maintenance_records) {
        try {
          const { id, created_at, updated_at, device_id, ...recordData } = record;
          
          // 映射新的设备 ID
          const newDeviceId = deviceIdMap[device_id] || device_id;
          
          const { error } = await client
            .from('maintenance_records')
            .insert({ ...recordData, device_id: newDeviceId });

          if (error) {
            console.error('导入维修记录失败:', error);
            results.maintenance_records.failed++;
          } else {
            results.maintenance_records.success++;
          }
        } catch (err) {
          console.error('导入维修记录异常:', err);
          results.maintenance_records.failed++;
        }
      }
    }

    // 导入保养记录
    if (service_records && service_records.length > 0) {
      for (const record of service_records) {
        try {
          const { id, created_at, updated_at, device_id, ...recordData } = record;
          
          const newDeviceId = deviceIdMap[device_id] || device_id;
          
          const { error } = await client
            .from('service_records')
            .insert({ ...recordData, device_id: newDeviceId });

          if (error) {
            console.error('导入保养记录失败:', error);
            results.service_records.failed++;
          } else {
            results.service_records.success++;
          }
        } catch (err) {
          console.error('导入保养记录异常:', err);
          results.service_records.failed++;
        }
      }
    }

    // 导入检测提醒
    if (inspection_reminders && inspection_reminders.length > 0) {
      for (const reminder of inspection_reminders) {
        try {
          const { id, created_at, updated_at, device_id, ...reminderData } = reminder;
          
          const newDeviceId = deviceIdMap[device_id] || device_id;
          
          const { error } = await client
            .from('inspection_reminders')
            .insert({ ...reminderData, device_id: newDeviceId });

          if (error) {
            console.error('导入检测提醒失败:', error);
            results.inspection_reminders.failed++;
          } else {
            results.inspection_reminders.success++;
          }
        } catch (err) {
          console.error('导入检测提醒异常:', err);
          results.inspection_reminders.failed++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        mode: importMode,
        results,
        summary: {
          totalImported: 
            results.devices.success + 
            results.maintenance_records.success + 
            results.service_records.success + 
            results.inspection_reminders.success,
          totalFailed: 
            results.devices.failed + 
            results.maintenance_records.failed + 
            results.service_records.failed + 
            results.inspection_reminders.failed,
        },
      },
    });
  } catch (error) {
    console.error('导入数据失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '导入数据失败' },
      { status: 500 }
    );
  }
}
