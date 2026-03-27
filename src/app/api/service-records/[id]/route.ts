import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET - 获取单个保养记录详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;

    const { data, error } = await client
      .from('service_records')
      .select('*, devices(name, model, manufacturer)')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`查询保养记录失败: ${error.message}`);
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: '保养记录不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('获取保养记录详情失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '获取保养记录详情失败' },
      { status: 500 }
    );
  }
}

// PUT - 更新保养记录
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;
    const body = await request.json();

    const {
      device_id,
      service_type,
      description,
      service_date,
      technician,
      photos,
    } = body;

    const { data, error } = await client
      .from('service_records')
      .update({
        device_id,
        service_type,
        description,
        service_date,
        technician,
        photos,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`更新保养记录失败: ${error.message}`);
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('更新保养记录失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '更新保养记录失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除保养记录
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;

    const { error } = await client
      .from('service_records')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`删除保养记录失败: ${error.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除保养记录失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '删除保养记录失败' },
      { status: 500 }
    );
  }
}
