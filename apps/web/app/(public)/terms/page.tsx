import Link from "next/link";

export default async function TermsOfService() {
  return (
    <div className='flex flex-row mt-10 items-center justify-center min-h-screen'>
      <Link href='/legal/terms'>View Terms of Service</Link>
    </div>
  );
}
