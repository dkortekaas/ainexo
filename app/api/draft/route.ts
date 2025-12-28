import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const secret = searchParams.get('secret')
  const slug = searchParams.get('slug')
  const type = searchParams.get('type') // 'page' or 'blog'
  const locale = searchParams.get('locale') || 'nl'

  // Check the secret
  if (secret !== process.env.SANITY_PREVIEW_SECRET) {
    return new Response('Invalid token', { status: 401 })
  }

  // Check required params
  if (!slug || !type) {
    return new Response('Missing slug or type parameter', { status: 400 })
  }

  // Enable Draft Mode
  const draft = await draftMode()
  draft.enable()

  // Redirect to the path
  const path = type === 'blog' ? `/${locale}/blog/${slug}` : `/${locale}/${slug}`
  redirect(path)
}
