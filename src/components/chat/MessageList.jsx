import MessageBubble from './MessageBubble';
import TypingDots from './TypingDots';

export default function MessageList({ messages, isSending, onEditMessage }) {
  return (
    <div>
      {messages.map((msg) => {
        const isUser = msg.role === 'user';
        return (
          <MessageBubble
            key={msg.id}
            message={msg}
            isUser={isUser}
            onEdit={onEditMessage}
          />
        );
      })}

      {/* Typing indicator */}
      {isSending && <TypingDots />}
    </div>
  );
}
