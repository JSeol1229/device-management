import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET - 导出所有数据
export async function GET() {
  try {
    const client = getSupabaseClient();

    // 并行获取所有数据
    const [devicesRes, maintenanceRes, serviceRes, remindersRes] = await Promise.all([
      client.from('devices').select('*').order('created_at', { ascending: true }),
      client.from('maintenance_records').select('*').order('created_at', { ascending: true }),
      client.from('service_records').select('*').order('created_at', { ascending: true }),
      client.from('inspection_reminders').select('*').order('created_at', { ascending: true }),
    ]);

    // 检查错误
    if (devicesRes.error) throw new Error(`导出设备数据失败: ${devicesRes.error.message}`);
    if (maintenanceRes.error) throw new Error(`导出维修记录失败: ${maintenanceRes.error.message}`);
    if (serviceRes.error) throw new Error(`导出保养记录失败: ${serviceRes.error.message}`);
    if (remindersRes.error) throw new Error(`导出检测提醒失败: ${remindersRes.error.message}`);

    // 构建备份数据
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      data: {
        devices: devicesRes.data || [],
        maintenance_records: maintenanceRes.data || [],
        service_records: serviceRes.data || [],
        inspection_reminders: remindersRes.data || [],
      },
      statistics: {
        devices: (devicesRes.data || []).length,
        maintenance_records: (maintenanceRes.data || []).length,
        service_records: (serviceRes.data || []).length,
        inspection_reminders: (remindersRes.data || []).length,
      },
    };

    // 返回 JSON 文件
    return new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="device-backup-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    console.error('导出数据失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '导出数据失败' },
      { status: 500 }
    );
  }
}
