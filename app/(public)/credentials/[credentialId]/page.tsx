import { redirect } from 'next/navigation';

/**
 * Legacy public URL — certificate verification lives under the dashboard route
 * so learners see the same LMS chrome. This keeps old /credentials/… links working.
 */
export default async function LegacyCredentialRedirect({
  params,
}: {
  params: Promise<{ credentialId: string }>;
}) {
  const { credentialId } = await params;
  redirect(`/dashboard/credentials/${credentialId}`);
}
