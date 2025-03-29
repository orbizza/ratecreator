import { PostsEditNavbar } from "@ratecreator/ui/content";

export default function PostsEditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='flex flex-col gap-4 dark:bg-[#1F1F1F] rounded-md '>
      <PostsEditNavbar />
      {children}
    </div>
  );
}
