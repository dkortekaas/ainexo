import { redirect } from 'next/navigation'

/**
 * CMS Admin Page
 *
 * Redirects to Sanity Studio which is now the primary CMS.
 * The old custom CMS has been replaced by Sanity.io for a professional
 * content management experience.
 *
 * Access Sanity Studio at: /studio
 */
export default function CmsAdminPage() {
  redirect('/studio')
}
