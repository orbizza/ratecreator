export default function Page({ params }: { params: { todo: string } }) {
  return (
    <div className="flex flex-col gap-4 items-center justify-center">
      <h1 className="text-2xl font-bold">Todo</h1>
      <p>{params.todo}</p>
    </div>
  );
}
