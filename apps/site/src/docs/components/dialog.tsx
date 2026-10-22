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
        approximation of the game&apos;s.
      </P>
      <Demo>
        <Button width={150} onClick={() => setOpen(true)}>
          Open dialog
        </Button>
        <Dialog open={open} onOpenChange={setOpen} title="Delete world?">
          <p style={{ margin: '0 0 calc(12 * var(--cobble-px))' }}>This cannot be undone.</p>
          <div className="site-row">
            <DialogClose render={<Button width={95} />}>Delete</DialogClose>
            <DialogClose render={<Button width={95} />}>Cancel</DialogClose>
          </div>
        </Dialog>
      </Demo>
      <CodeBlock
        code={`<Dialog open={open} onOpenChange={setOpen} title="Delete world?">
  This cannot be undone.
  <DialogClose render={<Button width={95} />}>Cancel</DialogClose>
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
