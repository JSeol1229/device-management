import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET - 获取维修记录列表
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const device_id = searchParams.get('device_id');
    const maintenance_type = searchParams.get('maintenance_type');
    const month = searchParams.get('month'); // 格式: YYYY-MM

    let query = client
      .from('maintenance_records')
      .select('*, devices(name, model, manufacturer)')
      .order('maintenance_date', { ascending: false });

    if (device_id) {
      query = query.eq('device_id', device_id);
    }

    if (maintenance_type) {
      query = query.eq('maintenance_type', maintenance_type);
    }

    if (month) {
      const startDate = `${month}-01`;
      const endDate = `${month}-31`;
      query = query.gte('maintenance_date', startDate).lte('maintenance_date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`查询维修记录失败: ${error.message}`);
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('获取维修记录列表失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '获取维修记录列表失败' },
      { status: 500 }
    );
  }
}

// POST - 创建维修记录
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const {
      device_id,
      maintenance_type,
      description,
      maintenance_date,
      cost,
      technician,
      photos,
    } = body;

    if (!device_id || !maintenance_type || !description || !maintenance_date) {
      return NextResponse.json(
        { success: false, error: '设备、维修类型、描述和维修日期为必填项' },
        { status: 400 }
      );
    }

    const { data, error } = await client
      .from('maintenance_records')
      .insert({
        device_id,
        maintenance_type,
        description,
        maintenance_date,
        cost,
        technician,
        photos,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`创建维修记录失败: ${error.message}`);
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('创建维修记录失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '创建维修记录失败' },
      { status: 500 }
    );
  }
}
