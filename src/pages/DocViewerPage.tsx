import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { ArrowLeft, LogOut, Pencil, MessageSquare, ChevronDown, ChevronUp, ZoomIn, ZoomOut, ExternalLink } from 'lucide-react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

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
  lastUpdatedBy?: string;
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

const MermaidDiagram = ({ content }: { content: string }) => {
  const [zoom, setZoom] = useState(1);
  const [modalZoom, setModalZoom] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const modalDiagramId = `mermaid-modal-${Math.random().toString(36).substr(2, 9)}`;

  const handleZoomIn = () => setZoom(prev => prev + 0.1);
  const handleZoomOut = () => setZoom(prev => prev > 0.2 ? prev - 0.1 : 0.1);

  const handleModalZoomIn = () => setModalZoom(prev => prev + 0.1);
  const handleModalZoomOut = () => setModalZoom(prev => prev > 0.2 ? prev - 0.1 : 0.1);

  useEffect(() => {
    if (isModalOpen) {
      setTimeout(() => {
        try {
          const element = document.getElementById(modalDiagramId);
          if (element) {
            mermaid.run({
              nodes: [element]
            });
          }
        } catch (e) {
          console.error("Mermaid rendering error in modal:", e);
        }
      }, 0);
    }
  }, [isModalOpen, modalDiagramId]);

  return (
    <div className="relative group my-6">
      <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" onClick={handleZoomIn} className="h-8 w-8">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleZoomOut} className="h-8 w-8">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Mermaid Diagram</DialogTitle>
            </DialogHeader>
            <div className="flex-grow overflow-auto">
              <pre
                id={modalDiagramId}
                className="mermaid"
                style={{
                  transform: `scale(${modalZoom})`,
                  transformOrigin: 'top left',
                  transition: 'transform 0.2s ease-in-out',
                }}
              >
                {content}
              </pre>
            </div>
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={handleModalZoomOut}>
                <ZoomOut className="h-4 w-4 mr-2" />
                Zoom Out
              </Button>
              <Button variant="outline" onClick={handleModalZoomIn}>
                <ZoomIn className="h-4 w-4 mr-2" />
                Zoom In
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="overflow-auto">
        <pre
          className="mermaid"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            transition: 'transform 0.2s ease-in-out',
          }}
        >
          {content}
        </pre>
      </div>
    </div>
  );
};

function DocViewerPage() {
  const { docName } = useParams<{ docName: string }>();
  const [markdown, setMarkdown] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedMarkdown, setEditedMarkdown] = useState('');
  const [isCommentsVisible, setIsCommentsVisible] = useState(false);
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
    if (isLoading) return; // Wait for the query to settle

    if (dbDoc) {
      // Document found in DB, use its content
      setMarkdown(dbDoc.content);
      setEditedMarkdown(marked.parse(dbDoc.content));
    } else if (!dbDoc && !isLoading) {
      // Document not found in DB, or DB query finished and returned null
      // Attempt to load from static markdown file as a fallback
      const loadStaticDocument = async () => {
        try {
          const response = await fetch(`/docs/${safeDocName.toUpperCase()}.md`);
          if (response.ok) {
            const fetchedContent = await response.text();
            setMarkdown(fetchedContent);
            setEditedMarkdown(marked.parse(fetchedContent));
            // Optionally, create the document in DB if it was found statically
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
      };
      loadStaticDocument();
    } else if (isError) {
      // An error occurred during DB fetch, fallback to static markdown
      console.error("Error fetching document from DB:", error);
      const loadStaticDocumentOnError = async () => {
        try {
          const response = await fetch(`/docs/${safeDocName.toUpperCase()}.md`);
          if (response.ok) {
            const fetchedContent = await response.text();
            setMarkdown(fetchedContent);
            setEditedMarkdown(marked.parse(fetchedContent));
          } else {
            setMarkdown('# Document Not Found\n\nCould not load the requested document.');
            setEditedMarkdown(marked.parse('# Document Not Found\n\nCould not load the requested document.'));
          }
        } catch (staticError) {
          console.error("Failed to fetch static document on error fallback:", staticError);
          setMarkdown('# Error\n\nThere was an error loading the document.');
          setEditedMarkdown(marked.parse('# Error\n\nThere was an error loading the document.'));
        }
      };
      loadStaticDocumentOnError();
    }
  }, [dbDoc, isLoading, isError, error, safeDocName]);

  useEffect(() => {
    if (!isLoading && markdown) {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'base',
        themeVariables: {
          'primaryColor': '#3B82F6',
          'primaryTextColor': '#FFFFFF',
          'primaryBorderColor': '#3B82F6',
          'lineColor': '#6B7280',
          'textColor': '#1F2937',
          'tertiaryColor': '#F3F4F6',
        },
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

    if (!profile?.full_name) {
      console.error("User full name not available for lastUpdatedBy.");
      // Optionally, show a toast notification
      return;
    }

    try {
      await docApi.updateDocument(safeDocName, markdownToSave, profile.full_name);
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
    <div className="h-screen bg-background no-print flex flex-col">
      <header className="flex-shrink-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="mx-auto h-14 flex items-center justify-between px-4 max-w-7xl">
          <div className="flex items-center gap-4">
            <Link to="/docs" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back to Hub
            </Link>
            {!isEditing && (
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="flex items-center gap-1">
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setIsCommentsVisible(!isCommentsVisible)} className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              {isCommentsVisible ? 'Hide Comments' : 'Show Comments'}
            </Button>
          </div>
          <button onClick={signOut} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </header>
      <div className="flex flex-grow overflow-hidden">
        <div className="flex-grow overflow-y-auto">
          <main className={cn("mx-auto p-4 sm:p-6 lg:p-8 w-full", isCommentsVisible ? "max-w-4xl" : "max-w-7xl")}>
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
                <div className="mb-4 text-sm text-muted-foreground">
                  <p>Last updated: {dbDoc?.updatedAt ? new Date(dbDoc.updatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}</p>
                  <p>Revision: {dbDoc?.revision ?? 'N/A'}</p>
                  <p>Last updated by: {dbDoc?.lastUpdatedBy ?? 'N/A'}</p>
                </div>
                <ReactMarkdown
                  key={markdown}
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      if (!inline && match && match[1] === 'mermaid') {
                        const content = String(children).replace(/\n$/, '');
                        return <MermaidDiagram content={content} />;
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
        {isCommentsVisible && (
          <CommentSection
            docName={safeDocName}
            comments={dbDoc?.comments || []}
            ownerId={user?.id || ''}
            ownerName={profile?.full_name || 'Anonymous'}
            onAddComment={handleAddComment}
          />
        )}
      </div>
    </div>
  );
}

export default DocViewerPage;