import { Button } from "@repo/ui";

export default function Page(): JSX.Element {
  return (
    <div className='bg-green-400'>
      <Button variant={"destructive"}>Click me - Admin</Button>
    </div>
  );
}
