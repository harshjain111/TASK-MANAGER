// Chat photo attachments are served from the Supabase Storage public bucket,
// so next/image needs that host allow-listed. Derived from the same env var
// the rest of the app uses rather than hard-coding a project ref.
const remotePatterns = [];

if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  try {
    const { protocol, hostname } = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
    remotePatterns.push({
      protocol: protocol.replace(':', ''),
      hostname,
      pathname: '/storage/v1/object/public/**',
    });
  } catch {
    // Malformed URL — leave the list empty; <ChatPhoto> falls back to
    // unoptimized rendering rather than failing to display the photo.
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { remotePatterns },
};

export default nextConfig;
