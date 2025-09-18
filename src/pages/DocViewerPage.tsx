import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import mermaid from 'mermaid';

const DocViewerPage = () => {
  const { docName } = useParams<{ docName: string }>();
  const [markdown, setMarkdown] = useState('');
  const [loading, setLoading] = useState(true);
  const { signOut } = useAuth();

  useEffect(() => {
    const fetchMarkdown = async () => {
      if (!docName) return;

      const safeDocName = docName.replace(/[^a-z0-9_-]/gi, '');
      
      try {
        const response = await fetch(`/docs/${safeDocName.toUpperCase()}.md`);
        if (response.ok) {
          const text = await response.text();
          setMarkdown(text);
        } else {
          setMarkdown('# Document Not Found\n\nCould not load the requested document.');
        }
      } catch (error) {
        console.error("Failed to fetch document:", error);
        setMarkdown('# Error\n\nThere was an error loading the document.');
      } finally {
        setLoading(false);
      }
    };

    fetchMarkdown();
  }, [docName]);

  useEffect(() => {
    if (!loading && markdown) {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'neutral',
        securityLevel: 'loose',
      });
      setTimeout(() => {
        try {
          mermaid.run({ querySelector: '.mermaid' });
        } catch (e) {
          console.error("Mermaid rendering error:", e);
        }
      }, 100);
    }
  }, [loading, markdown]);

  return (
    <div className="min-h-screen bg-background no-print">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
            <div className="max-w-5xl mx-auto h-14 flex items-center justify-between px-4">
                <Link to="/docs" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Documentation Hub
                </Link>
                <button onClick={signOut} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                    <LogOut className="h-4 w-4" />
                    Logout
                </button>
            </div>
        </header>
        <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
            {loading ? (
                <p>Loading document...</p>
            ) : (
                <article className="prose dark:prose-invert lg:prose-xl">
                    <ReactMarkdown
                        key={markdown}
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                        components={{
                            code({ node, inline, className, children, ...props }) {
                                const match = /language-(\w+)/.exec(className || '');
                                if (!inline && match && match[1] === 'mermaid') {
                                    return (
                                        <pre className="mermaid" {...props}>
                                            {String(children).replace(/\n$/, '')}
                                        </pre>
                                    );
                                }
                                return !inline && match ? (
                                    <code className={className} {...props}>
                                        {children}
                                    </code>
                                ) : (
                                    <code className={className} {...props}>
                                        {children}
                                    </code>
                                );
                            },
                        }}
                    >
                        {markdown}
                    </ReactMarkdown>
                </article>
            )}
        </main>
    </div>
  );
};

export default DocViewerPage;