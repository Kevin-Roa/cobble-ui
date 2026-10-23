import { Button, Dialog, DialogClose } from 'cobble-ui';
import { useState, type JSX } from 'react';
import { Code, CodeBlock, Demo, H2, P, PropsTable } from '../../components/Prose.tsx';

export function DialogPage(): JSX.Element {
  const [open, setOpen] = useState(false);
  return (
    <>
      <P>
        A modal popup: the screen is dimmed with the menu gradient and a nine-sliced{' '}
        <Code>popup/background</Code> panel is centred over it. Built on Base UI&apos;s Dialog, so
        focus is trapped and Escape closes it. Like vanilla popups, clicking the backdrop does not
        close it unless you pass <Code>dismissOnBackdrop</Code>. The panel padding is an
        approximation of the game&apos;s. The example is the delete-world confirmation.
      </P>
      <Demo>
        <Button width={150} onClick={() => setOpen(true)}>
          Open dialog
        </Button>
        <Dialog
          open={open}
          onOpenChange={setOpen}
          title="Are you sure you want to delete this world?"
          width={304}
          actions={
            <>
              <DialogClose render={<Button />}>Delete</DialogClose>
              <DialogClose render={<Button />}>Cancel</DialogClose>
            </>
          }
        >
          &lsquo;New World&rsquo; will be lost forever! (A long time!)
        </Dialog>
      </Demo>
      <CodeBlock
        code={`<Dialog
  open={open}
  onOpenChange={setOpen}
  title="Are you sure you want to delete this world?"
  actions={
    <>
      <DialogClose render={<Button />}>Delete</DialogClose>
      <DialogClose render={<Button />}>Cancel</DialogClose>
    </>
  }
>
  ‘New World’ will be lost forever! (A long time!)
</Dialog>`}
      />
      <H2>Props</H2>
      <PropsTable
        rows={[
          {
            name: 'open / defaultOpen',
            type: 'boolean',
            description: 'Controlled or initial state.',
          },
          {
            name: 'onOpenChange',
            type: '(open: boolean) => void',
            description: 'Called when it opens or closes.',
          },
          { name: 'title', type: 'ReactNode', description: 'Centred heading.' },
          { name: 'children', type: 'ReactNode', description: 'The message, centred.' },
          {
            name: 'actions',
            type: 'ReactNode',
            description:
              'Buttons in one centred row that shares the panel width equally; they need no width.',
          },
          {
            name: 'width',
            type: 'number',
            defaultValue: '250',
            description: 'Panel width in GUI units.',
          },
          {
            name: 'dismissOnBackdrop',
            type: 'boolean',
            defaultValue: 'false',
            description: 'Close on backdrop click.',
          },
          {
            name: 'slotProps',
            type: 'object',
            description: 'Props for backdrop, popup, title and body.',
          },
        ]}
      />
    </>
  );
}
