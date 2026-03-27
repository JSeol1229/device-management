import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET - 获取月总结报告
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get('month'); // 格式: YYYY-MM

    if (!month) {
      return NextResponse.json(
        { success: false, error: '请指定月份参数（格式：YYYY-MM）' },
        { status: 400 }
      );
    }

    const startDate = `${month}-01`;
    const endDate = `${month}-31`;

    // 获取维修记录统计
    const { data: maintenanceRecords, error: maintenanceError } = await client
      .from('maintenance_records')
      .select('*, devices(name, model, manufacturer)')
      .gte('maintenance_date', startDate)
      .lte('maintenance_date', endDate);

    if (maintenanceError) {
      throw new Error(`查询维修记录失败: ${maintenanceError.message}`);
    }

    // 获取保养记录统计
    const { data: serviceRecords, error: serviceError } = await client
      .from('service_records')
      .select('*, devices(name, model, manufacturer)')
      .gte('service_date', startDate)
      .lte('service_date', endDate);

    if (serviceError) {
      throw new Error(`查询保养记录失败: ${serviceError.message}`);
    }

    // 计算维修统计
    const maintenanceStats = {
      total: maintenanceRecords?.length || 0,
      inFactory: maintenanceRecords?.filter(r => r.maintenance_type === '本厂维修').length || 0,
      outFactory: maintenanceRecords?.filter(r => r.maintenance_type === '非本厂维修').length || 0,
      totalCost: maintenanceRecords?.reduce((sum, r) => sum + (parseFloat(r.cost) || 0), 0) || 0,
      byDevice: {} as Record<string, { name: string; count: number; cost: number }>,
    };

    // 按设备统计维修
    maintenanceRecords?.forEach(record => {
      const deviceId = record.device_id;
      const deviceName = (record.devices as any)?.name || '未知设备';
      
      if (!maintenanceStats.byDevice[deviceId]) {
        maintenanceStats.byDevice[deviceId] = {
          name: deviceName,
          count: 0,
          cost: 0,
        };
      }
      
      maintenanceStats.byDevice[deviceId].count++;
      maintenanceStats.byDevice[deviceId].cost += parseFloat(record.cost) || 0;
    });

    // 计算保养统计
    const serviceStats = {
      total: serviceRecords?.length || 0,
      inFactory: serviceRecords?.filter(r => r.service_type === '本厂保养').length || 0,
      outFactory: serviceRecords?.filter(r => r.service_type === '非本厂保养').length || 0,
      byDevice: {} as Record<string, { name: string; count: number }>,
    };

    // 按设备统计保养
    serviceRecords?.forEach(record => {
      const deviceId = record.device_id;
      const deviceName = (record.devices as any)?.name || '未知设备';
      
      if (!serviceStats.byDevice[deviceId]) {
        serviceStats.byDevice[deviceId] = {
          name: deviceName,
          count: 0,
        };
      }
      
      serviceStats.byDevice[deviceId].count++;
    });

    return NextResponse.json({
      success: true,
      data: {
        month,
        maintenance: {
          ...maintenanceStats,
          records: maintenanceRecords,
        },
        service: {
          ...serviceStats,
          records: serviceRecords,
        },
      },
    });
  } catch (error) {
    console.error('获取月总结报告失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '获取月总结报告失败' },
      { status: 500 }
    );
  }
}
