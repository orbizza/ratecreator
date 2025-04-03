import { PostsNavbar } from "@ratecreator/ui/content";

export default function RateCreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-7xl">
      <PostsNavbar />

      {children}
    </div>
  );
}
