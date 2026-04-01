import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { NextRequest, NextResponse } from 'next/server';

import { getAdminSessionOrNull } from '@/lib/admin/admin-session';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function extForMime(mime: string): string {
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/gif') return 'gif';
  return 'bin';
}

export async function POST(request: NextRequest) {
  const session = await getAdminSessionOrNull();
  if (!session) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ detail: 'Invalid form data' }, { status: 400 });
  }

  const file = form.get('file');
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ detail: 'file field required' }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ detail: 'File too large (max 5MB)' }, { status: 400 });
  }

  const mime = file.type || 'application/octet-stream';
  if (!ALLOWED.has(mime)) {
    return NextResponse.json({ detail: 'Only JPEG, PNG, WebP, or GIF images allowed' }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const dir = path.join(process.cwd(), 'public', 'uploads', 'admin-courses');
  await mkdir(dir, { recursive: true });
  const name = `${randomUUID()}.${extForMime(mime)}`;
  const fsPath = path.join(dir, name);
  await writeFile(fsPath, buf);

  const publicPath = `/uploads/admin-courses/${name}`;
  return NextResponse.json({ url: publicPath });
}
