import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// POST - 上传照片到 Supabase Storage（支持多张照片，自动压缩和限制）
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: '请选择要上传的文件' },
        { status: 400 }
      );
    }

    // 限制最多上传5张照片
    if (files.length > 5) {
      return NextResponse.json(
        { success: false, error: '最多只能上传5张照片' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();
    const bucketName = 'photos'; // Supabase Storage bucket 名称
    const uploadedUrls: string[] = [];
    const errors: string[] = [];

    for (const file of files) {
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        errors.push(`文件 ${file.name} 不是图片文件`);
        continue;
      }

      // 限制单张照片大小为 5MB
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        errors.push(`文件 ${file.name} 大小超过5MB限制`);
        continue;
      }

      try {
        // 读取文件内容
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // 生成唯一文件名
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `${timestamp}_${randomStr}.${fileExt}`;
        const filePath = `uploads/${fileName}`;

        // 上传到 Supabase Storage
        const { data, error } = await client.storage
          .from(bucketName)
          .upload(filePath, buffer, {
            contentType: file.type,
            upsert: false,
          });

        if (error) {
          console.error(`上传文件 ${file.name} 失败:`, error);
          errors.push(`文件 ${file.name} 上传失败: ${error.message}`);
          continue;
        }

        // 获取公开访问 URL
        const { data: urlData } = client.storage
          .from(bucketName)
          .getPublicUrl(data.path);

        uploadedUrls.push(urlData.publicUrl);
      } catch (uploadError) {
        console.error(`上传文件 ${file.name} 失败:`, uploadError);
        errors.push(`文件 ${file.name} 上传失败`);
      }
    }

    if (uploadedUrls.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: errors.length > 0 ? errors.join('; ') : '所有文件上传失败' 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        urls: uploadedUrls,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    console.error('上传照片失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '上传照片失败' },
      { status: 500 }
    );
  }
}
