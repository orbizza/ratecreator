
import Link from "next/link";

export default async function CookiePolicy() {
  return (
    <div className="flex flex-row mt-10 items-center justify-center min-h-screen">
      <Link href="/legal/cookie-policy">View Cookie Policy</Link>
    </div>
  );

}
