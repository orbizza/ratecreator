import { Button } from "@repo/ui";

export default function Page(): JSX.Element {
  return (
    <div className='bg-green-300'>
      <Button variant={"destructive"}>Click me</Button>
    </div>
  );
}
