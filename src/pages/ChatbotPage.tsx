import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, LogOut, Loader } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth

const ChatbotPage: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ type: 'user' | 'bot'; text: string; sources?: string[] }>>([]);
  const [loading, setLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const { signOut } = useAuth(); // Destructure signOut from useAuth

  const handleSendMessage = async () => {
    if (input.trim() === '') return;

    const userMessage = { type: 'user' as const, text: input };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInput('');
    setLoading(true);
    setIsThinking(true);

    const thinkingTimeout = setTimeout(() => {
      setIsThinking(false);
      setLoading(false);
      setMessages(prevMessages => [...prevMessages, { type: 'bot', text: 'We are busy, please try again later.' }]);
    }, 15000);

    try {
      const response = await fetch('/api/docs/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: userMessage.text }),
      });

      clearTimeout(thinkingTimeout);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Backend response data:', data);
      const botMessage = { type: 'bot' as const, text: data.answer, sources: data.sources };
      setMessages(prevMessages => [...prevMessages, botMessage]);
    } catch (error) {
      clearTimeout(thinkingTimeout);
      console.error('Error sending message:', error);
      setMessages(prevMessages => [...prevMessages, { type: 'bot', text: 'We are having technical difficulties.' }]);
    } finally {
      setIsThinking(false);
      setLoading(false);
    }
  };

  return (
        <div className="flex flex-col bg-background">
          <div className="flex-1 p-4 space-y-4">
            {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <Card
className={`w-fit ${msg.type === 'user' ? 'bg-primary text-primary-foreground' : 'bg-[#c1c2c3]'}`}
            >
              <CardContent className="p-3">
                {msg.type === 'bot' ? (
                  <div className="prose dark:prose-invert">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm">{msg.text}</p>
                )}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <strong>Sources:</strong>
                    <ul className="list-disc list-inside">
                      {msg.sources.map((source, srcIndex) => (
                        <li key={srcIndex}>
                          <a
                            href={`/docs/${source.replace('.md', '')}`} // Assuming docs are served under /docs/
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-blue-700 hover:underline text-base"
                          >
                            {source}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
        {isThinking && (
          <div className="flex justify-start">
            <Card className="w-fit bg-[#c1c2c3]">
              <CardContent className="p-3">
                <div className="prose dark:prose-invert">
                  Thinking...
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      <div className="p-4 bg-background border-t border-border flex items-center max-w-screen-2xl mx-auto">
        <Input
          type="text"
          placeholder="Ask a question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSendMessage();
            }
          }}
          disabled={loading}
          className="w-[512px]"
        />
        <Button
          onClick={handleSendMessage}
          disabled={loading}
        >
          {loading ? (
            <Loader className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default ChatbotPage;