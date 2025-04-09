
import Link from "next/link";

export default async function PrivacyPolicy() {
  return (
    <div className="flex flex-row mt-10 items-center justify-center min-h-screen">
      <Link href="/legal/privacy">View Privacy Policy</Link>
    </div>
  );

}
