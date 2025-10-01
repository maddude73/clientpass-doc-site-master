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
import { docApi } from '@/api/docs';
import { useQuery } from '@tanstack/react-query';

const DocViewerPage = () => {
  const { docName } = useParams<{ docName: string }>();
  const [markdown, setMarkdown] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedMarkdown, setEditedMarkdown] = useState('');
  const { signOut } = useAuth();

  const safeDocName = docName?.replace(/[^a-z0-9_-]/gi, '') || '';

  const { data: dbDoc, isLoading, isError, error } = useQuery({
    queryKey: ['document', safeDocName],
    queryFn: () => docApi.getDocument(safeDocName),
    enabled: !!safeDocName, // Only run query if docName is available
    staleTime: 5 * 60 * 1000, // Data is considered fresh for 5 minutes
    cacheTime: 10 * 60 * 1000, // Keep data in cache for 10 minutes
  });

  useEffect(() => {
    const loadDocumentContent = async () => {
      if (isLoading) return;

      if (dbDoc) {
        setMarkdown(dbDoc.content);
        setEditedMarkdown(marked.parse(dbDoc.content));
      } else if (isError && error) {
        // If there was an error fetching from DB (e.g., 404), try static file
        console.error("Error fetching document from DB:", error);
        try {
          const response = await fetch(`/docs/${safeDocName.toUpperCase()}.md`);
          if (response.ok) {
            const fetchedContent = await response.text();
            setMarkdown(fetchedContent);
            setEditedMarkdown(marked.parse(fetchedContent));
            // Optionally, seed the DB with this content for future edits
            docApi.createDocument(safeDocName, fetchedContent).catch(console.error);
          } else {
            setMarkdown('# Document Not Found\n\nCould not load the requested document.');
            setEditedMarkdown(marked.parse('# Document Not Found\n\nCould not load the requested document.'));
          }
        } catch (staticError) {
          console.error("Failed to fetch static document:", staticError);
          setMarkdown('# Error\n\nThere was an error loading the document.');
          setEditedMarkdown(marked.parse('# Error\n\nThere was an error loading the document.'));
        }
      } else if (!dbDoc && !isLoading && !isError) {
        // Document not found in DB, and no error, try static file
        try {
          const response = await fetch(`/docs/${safeDocName.toUpperCase()}.md`);
          if (response.ok) {
            const fetchedContent = await response.text();
            setMarkdown(fetchedContent);
            setEditedMarkdown(marked.parse(fetchedContent));
            // Optionally, seed the DB with this content for future edits
            docApi.createDocument(safeDocName, fetchedContent).catch(console.error);
          } else {
            setMarkdown('# Document Not Found\n\nCould not load the requested document.');
            setEditedMarkdown(marked.parse('# Document Not Found\n\nCould not load the requested document.'));
          }
        } catch (staticError) {
          console.error("Failed to fetch static document:", staticError);
          setMarkdown('# Error\n\nThere was an error loading the document.');
          setEditedMarkdown(marked.parse('# Error\n\nThere was an error loading the document.'));
        }
      }
    };

    loadDocumentContent();
  }, [dbDoc, isLoading, isError, error, safeDocName]);

  useEffect(() => {
    if (!isLoading && markdown) {
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
  }, [isLoading, markdown]);

  const handleSave = async () => {
    const turndownService = new TurndownService();
    const markdownToSave = turndownService.turndown(editedMarkdown);

    try {
      await docApi.updateDocument(safeDocName, markdownToSave);
      setMarkdown(markdownToSave); // Update view mode with new markdown
      setIsEditing(false);
      console.log('Document saved successfully to simulated DB:', markdownToSave);
    } catch (error) {
      console.error('Failed to save document:', error);
      // Optionally, show an error message to the user
    }
  };

  const handleCancel = () => {
    setEditedMarkdown(marked.parse(markdown)); // Revert changes to HTML
    setIsEditing(false);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading document...</div>;
  }

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
            {isLoading ? (
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