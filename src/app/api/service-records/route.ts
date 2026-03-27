import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET - 获取保养记录列表
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const device_id = searchParams.get('device_id');
    const service_type = searchParams.get('service_type');
    const month = searchParams.get('month'); // 格式: YYYY-MM

    let query = client
      .from('service_records')
      .select('*, devices(name, model, manufacturer)')
      .order('service_date', { ascending: false });

    if (device_id) {
      query = query.eq('device_id', device_id);
    }

    if (service_type) {
      query = query.eq('service_type', service_type);
    }

    if (month) {
      const startDate = `${month}-01`;
      const endDate = `${month}-31`;
      query = query.gte('service_date', startDate).lte('service_date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`查询保养记录失败: ${error.message}`);
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('获取保养记录列表失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '获取保养记录列表失败' },
      { status: 500 }
    );
  }
}

// POST - 创建保养记录
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const {
      device_id,
      service_type,
      description,
      service_date,
      technician,
      photos,
    } = body;

    if (!device_id || !service_type || !description || !service_date) {
      return NextResponse.json(
        { success: false, error: '设备、保养类型、描述和保养日期为必填项' },
        { status: 400 }
      );
    }

    const { data, error } = await client
      .from('service_records')
      .insert({
        device_id,
        service_type,
        description,
        service_date,
        technician,
        photos,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`创建保养记录失败: ${error.message}`);
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('创建保养记录失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '创建保养记录失败' },
      { status: 500 }
    );
  }
}
