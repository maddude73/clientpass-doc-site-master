import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, LogOut } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth

const ChatbotPage: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ type: 'user' | 'bot'; text: string; sources?: string[] }>>([]);
  const [loading, setLoading] = useState(false);
  const { signOut } = useAuth(); // Destructure signOut from useAuth

  const handleSendMessage = async () => {
    if (input.trim() === '') return;

    const userMessage = { type: 'user' as const, text: input };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5001/api/docs/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: userMessage.text }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Backend response data:', data);
      const botMessage = { type: 'bot' as const, text: data.answer, sources: data.sources };
      setMessages(prevMessages => [...prevMessages, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prevMessages => [...prevMessages, { type: 'bot', text: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="bg-primary text-primary-foreground p-4 shadow-md flex justify-between items-center">
        <h1 className="text-2xl font-bold">Documentation Chatbot</h1>
        <button onClick={signOut} className="flex items-center gap-2 text-sm text-primary-foreground/80 hover:text-primary-foreground">
            <LogOut className="h-4 w-4" />
            Logout
        </button>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-screen-2xl mx-auto">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <Card
              className={`w-fit ${msg.type === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
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
          className="w-full"
        />
        <Button
          onClick={handleSendMessage}
          disabled={loading}
        >
          <Send className="h-4 w-4 mr-2" />
          {loading ? 'Sending...' : 'Send'}
        </Button>
      </div>
    </div>
  );
};

export default ChatbotPage;
