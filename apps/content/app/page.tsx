export default function Home() {
  return (
    <div className=" items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <h1 className="text-2xl font-bold">Content Writer Home Page</h1>
      <h2 className="text-lg mt-10">
        This is the home page for the content writer app. Here you can see your
        dashboard and your tasks.
      </h2>
      <h2 className="text-lg mt-10">
        You can also see your profile and your settings. <br />
        <span className="text-lg text-red-700 dark:text-red-500">
          Update your profile picture and name in the User Profile page.
        </span>
      </h2>
      <p className="text-sm mt-20 italic text-red-700 dark:text-red-500">
        {" "}
        Start by clicking on the Rate Creator link in the sidebar to create
        content for Rate Creator Application
      </p>
    </div>
  );
}
