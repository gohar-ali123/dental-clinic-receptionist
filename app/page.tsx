"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import { clinic } from "@/lib/clinic";

// The model sometimes replies in Markdown, so render it instead of showing raw ** and - symbols.
const markdownComponents: Components = {
  ul: ({ children }) => <ul className="list-disc pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5">{children}</ol>,
  a: ({ children, href }) => (
    <a href={href} className="underline" target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
};

export default function Chat() {
  const [input, setInput] = useState("");
  // A fixed id stops useChat generating a random one during prerender, which Cache Components rejects.
  const { messages, sendMessage, status, error } = useChat({
    id: "receptionist",
  });
  const isBusy = status === "submitted" || status === "streaming";
  const bottomRef = useRef<HTMLDivElement>(null);

  // Keep the newest message in view as messages arrive and replies stream in.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, status, error]);

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 font-sans dark:bg-black">
      <header className="sticky top-0 z-10 w-full border-b border-black/[.08] bg-white px-4 py-3 text-center dark:border-white/[.145] dark:bg-zinc-900">
        <h1 className="font-semibold text-zinc-950 dark:text-zinc-50">
          {clinic.name}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Virtual receptionist
        </p>
      </header>

      <main className="flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 pt-6 pb-32">
        <div className="max-w-[85%] self-start whitespace-pre-wrap rounded-2xl bg-white px-4 py-2 text-zinc-950 shadow-sm dark:bg-zinc-900 dark:text-zinc-50">
          Hello! I&apos;m {clinic.receptionistName}, the virtual receptionist
          at {clinic.name}. I can answer questions about our services and
          opening hours, or help you request an appointment. How can I help?
        </div>

        {messages.map((message) => (
          <div
            key={message.id}
            className={
              message.role === "user"
                ? "max-w-[85%] self-end whitespace-pre-wrap rounded-2xl bg-foreground px-4 py-2 text-background"
                : "max-w-[85%] self-start whitespace-pre-wrap rounded-2xl bg-white px-4 py-2 text-zinc-950 shadow-sm dark:bg-zinc-900 dark:text-zinc-50"
            }
          >
            {message.parts.map((part, i) => {
              if (part.type !== "text") return null;
              const key = `${message.id}-${i}`;
              return message.role === "user" ? (
                <span key={key}>{part.text}</span>
              ) : (
                <div key={key} className="flex flex-col gap-2 whitespace-normal">
                  <ReactMarkdown components={markdownComponents}>
                    {part.text}
                  </ReactMarkdown>
                </div>
              );
            })}
          </div>
        ))}

        {status === "submitted" && (
          <p className="self-start text-sm text-zinc-500 dark:text-zinc-400">
            Thinking...
          </p>
        )}

        {error && (
          <p className="self-start text-sm text-red-600 dark:text-red-400">
            Something went wrong: {error.message}
          </p>
        )}
      </main>
      <div ref={bottomRef} />

      <form
        className="fixed bottom-0 flex w-full max-w-2xl gap-2 bg-zinc-50 px-4 pt-2 pb-8 dark:bg-black"
        onSubmit={(e) => {
          e.preventDefault();
          if (!input.trim() || isBusy) return;
          sendMessage({ text: input });
          setInput("");
        }}
      >
        <input
          className="flex-1 rounded-full border border-black/[.08] bg-white px-4 py-3 text-zinc-950 outline-none focus:border-zinc-400 dark:border-white/[.145] dark:bg-zinc-900 dark:text-zinc-50"
          value={input}
          placeholder="Type your message..."
          onChange={(e) => setInput(e.currentTarget.value)}
        />
        <button
          type="submit"
          disabled={!input.trim() || isBusy}
          className="rounded-full bg-foreground px-5 font-medium text-background transition-colors disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </div>
  );
}
