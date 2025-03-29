import { PostsNavbar } from "@ratecreator/ui/content";

export default function RateCreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <PostsNavbar />

      {children}
    </div>
  );
}
