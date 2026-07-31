import { ReactNode } from "react";

export function ChatBubble({
  role,
  children,
}: {
  role: "user" | "assistant";
  children: ReactNode;
}) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} animate-gs-fade-in`}>
      <div
        className={`max-w-[85%] rounded-lg px-3.5 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-gs-accent text-white rounded-br-sm"
            : "bg-gs-surface-2 border border-gs-border text-gs-text rounded-bl-sm"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
