import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { ArrowLeft, LogOut, Pencil, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import mermaid from 'mermaid';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Import Quill's CSS
import TurndownService from 'turndown';
import { marked } from 'marked'; // For Markdown to HTML conversion
import { docApi } from '@/api/docs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface Comment {
  ownerId: string;
  ownerName: string;
  text: string;
  createdAt: string;
}

interface DocumentData {
  name: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  revision: number;
  comments: Comment[];
}

const CommentSection = ({ docName, comments, ownerId, ownerName, onAddComment }: {
  docName: string;
  comments: Comment[];
  ownerId: string;
  ownerName: string;
  onAddComment: (text: string) => void;
}) => {
  const [newCommentText, setNewCommentText] = useState('');
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

  const toggleExpand = (commentId: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const handlePostComment = () => {
    if (newCommentText.trim()) {
      onAddComment(newCommentText);
      setNewCommentText('');
    }
  };

  return (
    <div className="w-full lg:w-80 border-l bg-background p-4 flex flex-col h-full">
      <h3 className="text-xl font-semibold mb-4">Comments</h3>
      <div className="flex-grow overflow-y-auto space-y-4 mb-4">
        {comments.length === 0 ? (
          <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment, index) => (
            <div key={index} className="border rounded-lg p-3 bg-muted/20">
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-sm">{comment.ownerName}</span>
                <span className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleDateString()}</span>
              </div>
              <p className={cn("text-sm", { "line-clamp-2": !expandedComments.has(comment.createdAt) })}>{comment.text}</p>
              {comment.text.length > 100 && (
                <Button variant="link" size="sm" onClick={() => toggleExpand(comment.createdAt)} className="p-0 h-auto text-xs">
                  {expandedComments.has(comment.createdAt) ? 'Show Less' : 'Show More'}
                </Button>
              )}
            </div>
          ))
        )}
      </div>
      <div className="border-t pt-4">
        <Textarea
          placeholder="Write a comment..."
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          rows={3}
          className="mb-2"
        />
        <Button onClick={handlePostComment} className="w-full">
          Post Comment
        </Button>
      </div>
    </div>
  );
};

const DocViewerPage = () => {
  const { docName } = useParams<{ docName: string }>();
  const [markdown, setMarkdown] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedMarkdown, setEditedMarkdown] = useState('');
  const { user, profile, signOut } = useAuth();
  const queryClient = useQueryClient();

  const safeDocName = docName?.replace(/[^a-z0-9_-]/gi, '') || '';

  const { data: dbDoc, isLoading, isError, error } = useQuery<DocumentData>({
    queryKey: ['document', safeDocName],
    queryFn: () => docApi.getDocument(safeDocName),
    enabled: !!safeDocName, // Only run query if docName is available
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });

  const addCommentMutation = useMutation({
    mutationFn: ({ docName, ownerId, ownerName, text }: { docName: string; ownerId: string; ownerName: string; text: string }) =>
      docApi.addComment(docName, ownerId, ownerName, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', safeDocName] }); // Invalidate document to refetch comments
    },
    onError: (err) => {
      console.error("Failed to add comment:", err);
      // Optionally, show a toast notification
    },
  });

  useEffect(() => {
    const loadDocumentContent = async () => {
      if (isLoading) return;

      if (dbDoc) {
        setMarkdown(dbDoc.content);
        setEditedMarkdown(marked.parse(dbDoc.content));
      } else if (isError && error) {
        console.error("Error fetching document from DB:", error);
        try {
          const response = await fetch(`/docs/${safeDocName.toUpperCase()}.md`);
          if (response.ok) {
            const fetchedContent = await response.text();
            setMarkdown(fetchedContent);
            setEditedMarkdown(marked.parse(fetchedContent));
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
        try {
          const response = await fetch(`/docs/${safeDocName.toUpperCase()}.md`);
          if (response.ok) {
            const fetchedContent = await response.text();
            setMarkdown(fetchedContent);
            setEditedMarkdown(marked.parse(fetchedContent));
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
      setMarkdown(markdownToSave);
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['document', safeDocName] });
      queryClient.invalidateQueries({ queryKey: ['allDocs'] });
      console.log('Document saved successfully to simulated DB:', markdownToSave);
    } catch (error) {
      console.error('Failed to save document:', error);
    }
  };

  const handleCancel = () => {
    setEditedMarkdown(marked.parse(markdown));
    setIsEditing(false);
  };

  const handleAddComment = (text: string) => {
    if (user && profile) {
      addCommentMutation.mutate({ docName: safeDocName, ownerId: user.id, ownerName: profile.full_name, text });
    } else {
      console.error("User not logged in to add comment.");
      // Optionally, show a toast notification
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading document...</div>;
  }

  return (
    <div className="min-h-screen bg-background no-print flex">
        <div className="flex-grow flex flex-col">
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
            <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 flex-grow">
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
        <CommentSection
          docName={safeDocName}
          comments={dbDoc?.comments || []}
          ownerId={user?.id || ''}
          ownerName={profile?.full_name || 'Anonymous'}
          onAddComment={handleAddComment}
        />
    </div>
  );
};