import { ContentNavbar } from "@ratecreator/ui/content";

export default function ContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='min-h-[calc(100vh-20vh)] max-w-screen-xl mx-auto mt-12'>
      <ContentNavbar />
      {children}
    </div>
  );
}
