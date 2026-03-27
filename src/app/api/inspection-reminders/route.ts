import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET - 获取检测提醒列表
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const device_id = searchParams.get('device_id');
    const status = searchParams.get('status');
    const upcoming = searchParams.get('upcoming'); // 是否获取即将到期的提醒

    let query = client
      .from('inspection_reminders')
      .select('*, devices(name, model, manufacturer)')
      .order('reminder_date', { ascending: true });

    if (device_id) {
      query = query.eq('device_id', device_id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    // 获取即将到期的提醒（提前一个月）
    if (upcoming === 'true') {
      const today = new Date();
      const oneMonthLater = new Date();
      oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
      
      query = query
        .gte('reminder_date', today.toISOString())
        .lte('reminder_date', oneMonthLater.toISOString())
        .eq('status', '待提醒');
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`查询检测提醒失败: ${error.message}`);
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('获取检测提醒列表失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '获取检测提醒列表失败' },
      { status: 500 }
    );
  }
}

// POST - 创建检测提醒
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const { device_id, reminder_date, description } = body;

    if (!device_id || !reminder_date || !description) {
      return NextResponse.json(
        { success: false, error: '设备、提醒日期和描述为必填项' },
        { status: 400 }
      );
    }

    const { data, error } = await client
      .from('inspection_reminders')
      .insert({
        device_id,
        reminder_date,
        description,
        status: '待提醒',
        is_notified: false,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`创建检测提醒失败: ${error.message}`);
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('创建检测提醒失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '创建检测提醒失败' },
      { status: 500 }
    );
  }
}
