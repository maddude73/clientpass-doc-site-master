import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { ArrowLeft, LogOut, Pencil } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import mermaid from 'mermaid';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Import Quill's CSS
import TurndownService from 'turndown';
import { marked } from 'marked'; // For Markdown to HTML conversion

const DocViewerPage = () => {
  const { docName } = useParams<{ docName: string }>();
  const [markdown, setMarkdown] = useState('');
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedMarkdown, setEditedMarkdown] = useState('');
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
          setEditedMarkdown(marked.parse(text)); // Convert Markdown to HTML for editor
        } else {
          const errorText = '# Document Not Found\n\nCould not load the requested document.';
          setMarkdown(errorText);
          setEditedMarkdown(marked.parse(errorText));
        }
      } catch (error) {
        console.error("Failed to fetch document:", error);
        const errorText = '# Error\n\nThere was an error loading the document.';
        setMarkdown(errorText);
        setEditedMarkdown(marked.parse(errorText));
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

  const handleSave = async () => {
    const turndownService = new TurndownService();
    const markdownToSave = turndownService.turndown(editedMarkdown);

    setMarkdown(markdownToSave); // Update view mode with new markdown
    setIsEditing(false);
    console.log('Simulating save:', markdownToSave);

    // Here's where a backend call would go to persist the changes.
    // Example: await fetch('/api/save-doc', { method: 'POST', body: JSON.stringify({ docName, content: markdownToSave }) });
    // For now, I will use the write_file tool to simulate saving.
    const safeDocName = docName.replace(/[^a-z0-9_-]/gi, '');
    const filePath = `/Users/rhfluker/Projects/clientpass-doc-site-master/public/docs/${safeDocName.toUpperCase()}.md`;
    // This is a placeholder for the actual write_file call by the Gemini agent.
    // print(default_api.write_file(file_path=filePath, content=markdownToSave));
  };

  const handleCancel = () => {
    setEditedMarkdown(marked.parse(markdown)); // Revert changes to HTML
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-background no-print">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
            <div className="max-w-5xl mx-auto h-14 flex items-center justify-between px-4">
                <div className="flex items-center gap-4">
                    <Link to="/docs" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Documentation Hub
                    </Link>
                    {!isEditing && (
                        <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="flex items-center gap-1">
                            <Pencil className="h-4 w-4" />
                            Edit
                        </Button>
                    )}
                </div>
                <button onClick={signOut} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                    <LogOut className="h-4 w-4" />
                    Logout
                </button>
            </div>
        </header>
        <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
            {loading ? (
                <p>Loading document...</p>
            ) : isEditing ? (
                <div className="space-y-4">
                    <ReactQuill
                        theme="snow"
                        value={editedMarkdown}
                        onChange={setEditedMarkdown}
                        className="min-h-[500px]"
                    />
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                        <Button onClick={handleSave}>Save</Button>
                    </div>
                </div>
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