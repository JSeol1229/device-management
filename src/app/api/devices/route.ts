import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET - 获取设备列表
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const manufacturer = searchParams.get('manufacturer');

    let query = client
      .from('devices')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (manufacturer) {
      query = query.ilike('manufacturer', `%${manufacturer}%`);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`查询设备失败: ${error.message}`);
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('获取设备列表失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '获取设备列表失败' },
      { status: 500 }
    );
  }
}

// POST - 创建设备
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const { name, model, manufacturer, serial_number, purchase_date, status, description, photos } = body;

    if (!name || !manufacturer) {
      return NextResponse.json(
        { success: false, error: '设备名称和厂家名称为必填项' },
        { status: 400 }
      );
    }

    const { data, error } = await client
      .from('devices')
      .insert({
        name,
        model,
        manufacturer,
        serial_number,
        purchase_date,
        status: status || '正常',
        description,
        photos,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`创建设备失败: ${error.message}`);
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('创建设备失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '创建设备失败' },
      { status: 500 }
    );
  }
}
