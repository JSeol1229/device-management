import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET - 获取单个设备详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;

    const { data, error } = await client
      .from('devices')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`查询设备失败: ${error.message}`);
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: '设备不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('获取设备详情失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '获取设备详情失败' },
      { status: 500 }
    );
  }
}

// PUT - 更新设备
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;
    const body = await request.json();

    const { name, model, manufacturer, serial_number, purchase_date, status, description } = body;

    const { data, error } = await client
      .from('devices')
      .update({
        name,
        model,
        manufacturer,
        serial_number,
        purchase_date,
        status,
        description,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`更新设备失败: ${error.message}`);
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('更新设备失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '更新设备失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除设备
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;

    const { error } = await client
      .from('devices')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`删除设备失败: ${error.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除设备失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '删除设备失败' },
      { status: 500 }
    );
  }
}
