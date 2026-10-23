import { Button, ChatInput, ChatLog, Text, type ChatMessage } from 'cobble-ui';
import { useState, type JSX } from 'react';
import { Code, ComponentDoc } from '../../components/Prose.tsx';

const AS = {
  name: 'as',
  type: 'ElementType',
  description: 'Render a different element or component.',
};

export function ChatLogPage(): JSX.Element {
  const [messages, setMessages] = useState<readonly ChatMessage[]>([]);
  const [open, setOpen] = useState(false);
  const add = (content: string): void => {
    setMessages((current) => [
      ...current,
      { id: current.length + 1, content, timestamp: Date.now() },
    ]);
  };
  return (
    <ComponentDoc
      intro={
        <>
          The chat window: up to 10 lines while closed, each message fading out after about 10
          seconds, or 20 lines all fully visible while <Code>open</Code> (scroll with the mouse
          wheel; Shift scrolls seven lines). Each line sits on a half-transparent black row that
          reaches 4 units past the text on both sides, newest at the bottom. Messages are{' '}
          <Code>{'{ id, content, timestamp }'}</Code>, and the content can be formatted text. The
          wheel step is an approximation of the game&apos;s.
        </>
      }
      demo={
        <div className="site-stack">
          <ChatLog messages={messages} open={open} />
          <div className="site-row">
            <Button
              width={100}
              onClick={() => add(`<Steve> message ${String(messages.length + 1)}`)}
            >
              Send a line
            </Button>
            <Button
              width={100}
              onClick={() =>
                add(
                  'A much longer message that is certain to wrap onto a second line of the log, like chat does.',
                )
              }
            >
              Send a long one
            </Button>
            <Button width={100} onClick={() => setOpen(!open)}>
              {open ? 'Close chat' : 'Open chat'}
            </Button>
          </div>
          {messages.length === 0 ? <Text color="gray">Send a line to see it fade.</Text> : null}
        </div>
      }
      code={`const [messages, setMessages] = useState<ChatMessage[]>([]);
<ChatLog messages={messages} open={chatOpen} />
// on a new message:
setMessages((m) => [...m, { id: nextId, content: text, timestamp: Date.now() }]);`}
      rows={[
        { name: 'messages', type: 'ChatMessage[]', description: 'Oldest first.' },
        {
          name: 'open',
          type: 'boolean',
          defaultValue: 'false',
          description: 'Show 20 lines, all fully visible, and enable scrolling.',
        },
        {
          name: 'width',
          type: 'number',
          defaultValue: '320',
          description: 'Width of the text, in GUI units.',
        },
        {
          name: 'now',
          type: 'number',
          description: 'Override the clock (milliseconds), e.g. for tests.',
        },
        AS,
      ]}
    />
  );
}

export function ChatInputPage(): JSX.Element {
  const [sent, setSent] = useState<readonly string[]>([]);
  return (
    <ComponentDoc
      intro={
        <>
          The chat line: a borderless 12-unit text field on a half-transparent black bar. Enter
          sends a non-empty line, and Up and Down walk through what was sent before. Messages are
          limited to 256 characters. Pass <Code>history</Code> to keep the history yourself.
        </>
      }
      demo={
        <div className="site-stack">
          <ChatInput
            onSubmit={(message) => setSent([...sent, message])}
            placeholder="Type a message"
          />
          <Text color="gray">
            {sent.length === 0 ? 'Nothing sent yet.' : `Last sent: ${sent.at(-1) ?? ''}`}
          </Text>
        </div>
      }
      code="<ChatInput onSubmit={(message) => socket.send(message)} />"
      rows={[
        {
          name: 'onSubmit',
          type: '(message: string) => void',
          description: 'Enter was pressed on a non-empty line.',
        },
        { name: 'history', type: 'string[]', description: 'Previously sent lines, oldest first.' },
        { name: 'maxLength', type: 'number', defaultValue: '256', description: 'Longest message.' },
        { name: 'width', type: 'number', defaultValue: '328', description: 'Width in GUI units.' },
        AS,
      ]}
    />
  );
}
