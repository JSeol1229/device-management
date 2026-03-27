import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET - 获取单个检测提醒详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;

    const { data, error } = await client
      .from('inspection_reminders')
      .select('*, devices(name, model, manufacturer)')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`查询检测提醒失败: ${error.message}`);
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: '检测提醒不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('获取检测提醒详情失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '获取检测提醒详情失败' },
      { status: 500 }
    );
  }
}

// PUT - 更新检测提醒
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;
    const body = await request.json();

    const { device_id, reminder_date, description, status, is_notified } = body;

    const { data, error } = await client
      .from('inspection_reminders')
      .update({
        device_id,
        reminder_date,
        description,
        status,
        is_notified,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`更新检测提醒失败: ${error.message}`);
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('更新检测提醒失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '更新检测提醒失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除检测提醒
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;

    const { error } = await client
      .from('inspection_reminders')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`删除检测提醒失败: ${error.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除检测提醒失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '删除检测提醒失败' },
      { status: 500 }
    );
  }
}
