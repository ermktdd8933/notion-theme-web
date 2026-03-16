import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID as string
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID as string
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY as string
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME as string
const R2_PUBLIC_BASE_URL = process.env.R2_PUBLIC_BASE_URL as string // e.g. https://cdn.example.com
const R2_STATIC_BASE_URL = process.env.R2_STATIC_BASE_URL as string

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME || !R2_PUBLIC_BASE_URL) {
  // Do not throw at import-time in edge/dev; return 500 at request time instead
}

export async function POST(req: NextRequest) {
  try {
    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME || !R2_PUBLIC_BASE_URL) {
      return NextResponse.json({ error: 'R2 env is not configured' }, { status: 500 })
    }

    const body = await req.json()
    const contentType = (body.contentType || '').trim()
    const fileName = (body.fileName || '').trim()
    const isThumbnail = body.isThumbnail === true

    if (!contentType || !fileName) {
      return NextResponse.json({ error: 'Missing contentType or fileName' }, { status: 400 })
    }

    const ext = fileName.includes('.') ? fileName.split('.').pop() : 'bin'
    // 缩略图保存到 cover_thum 目录，原图保存到 cover 目录
    const directory = isThumbnail ? 'cover_thum' : 'cover'
    const objectKey = `${directory}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY
      }
    })

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: objectKey,
      ContentType: contentType,
      ACL: undefined
    })

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 * 5 })

    const publicUrl = `${R2_STATIC_BASE_URL.replace(/\/$/, '')}/${objectKey}`

    return NextResponse.json({ uploadUrl, key: objectKey, publicUrl })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Unknown error' }, { status: 500 })
  }
}


