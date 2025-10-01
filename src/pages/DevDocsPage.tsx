import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, LogOut, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

const discoveryDocs = [
  { name: "SRS.md", description: "The Software Requirements Specification." },
];

const planningDocs = [
  { name: "USER_STORIES.md", description: "High-level features from the user's perspective." },
  { name: "MVP_ESTIMATE.md", description: "Defining the scope of the first deliverable." },
  { name: "ESTIMATES.md", description: "Detailed estimates for the work." },
  { name: "QA_PLAN.md", description: "How the quality of the product will be ensured." },
  { name: "CICD_STRATEGY.md", description: "How the product will be delivered." },
];

const architectureDocs = [
  { name: "SAD.md", description: "Software Architecture Document." },
  { name: "SYSTEM_DESIGN.md", description: "The detailed design, responding to the SRS." },
  { name: "HLA.md", description: "High Level Architecture." },
  { name: "FRONTEND_OVERVIEW.md", description: "Specifics of the frontend." },
  { name: "DATABASE_SCHEMA.md", description: "The data model." },
  { name: "EDGE_FUNCTIONS.md", description: "The backend logic." },
  { name: "USE_CASE_MODELS.md", description: "Detailed user flows." },
  { name: "PROCESS_MODELS.md", description: "State diagrams and process flows." },
  { name: "SEQUENCE_DIAGRAMS.md", description: "Detailed interaction diagrams." },
  { name: "INTEGRATION_GUIDE.md", description: "For external connections." },
];

const featuresDocs = [
  { name: "DEMO_MODE.md", description: "Explains the new demo mode." },
  { name: "AUTO_MATCH_SYSTEM.md", description: "Documents the AutoMatchSystem component." },
  { name: "WALK_IN_REFERRALS.md", description: "Documents the WalkInReferralForm component." },
  { name: "SERVICE_SELECTION.md", description: "Documents the ServiceSelection component." },
  { name: "SUITE_TOOLS.md", description: "Documents the new suite tools for salon owners." },
];

const componentsDocs = [
  { name: "SIGN_UP_FORM.md", description: "Documents the updated sign-up form." },
  { name: "STYLIST_PROFILE_SETUP.md", description: "Documents the updated stylist profile setup." },
  { name: "OPEN_CHAIR_FORM.md", description: "Documents the updated open chair form." },
];

const DocSectionHeader = ({ title }: { title: string }) => (
  <h2 className="text-2xl font-semibold border-b pb-3 mb-6">{title}</h2>
);

const DocCard = ({ doc }: { doc: { name: string, description: string } }) => {
  return (
    <Link
      key={doc.name}
      to={`/docs/${doc.name.replace('.md', '')}`}
      className="block hover:no-underline"
    >
      <Card className="h-full hover:border-primary/50 hover:shadow-lg transition-all">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-primary" />
            {doc.name.replace('.md', '')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{doc.description}</p>
        </CardContent>
      </Card>
    </Link>
  );
};

const InviteUserForm = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const { error } = await supabase.functions.invoke('send-doc-invite', {
      body: { inviteEmail: email },
    });
    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage(`Invitation sent successfully to ${email}!`);
      setEmail('');
    }
    setLoading(false);
  };

  return (
    <section className="mt-12">
      <DocSectionHeader title="Admin: Invite User" />
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleInvite} className="flex items-center gap-4">
            <Input 
              type="email" 
              placeholder="new.user@example.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              className="h-12"
            />
            <Button type="submit" disabled={loading} className="h-12">
              <Send className="mr-2 h-4 w-4" />
              {loading ? 'Sending...' : 'Send Invite'}
            </Button>
          </form>
          {message && <p className="mt-4 text-sm text-muted-foreground">{message}</p>}
        </CardContent>
      </Card>
    </section>
  );
};

const DevDocsPage = () => {
  const { profile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <header className="max-w-5xl mx-auto mb-8 flex justify-end">
        <button onClick={signOut} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4" />
            Logout
        </button>
      </header>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold">Project Documentation</h1>
          <p className="text-muted-foreground mt-2">
            A central hub for all project planning and architecture documents.
          </p>
        </div>

        {profile?.role === 'admin' && <InviteUserForm />}

        <div className="space-y-12">
          <section>
            <DocSectionHeader title="Discovery" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {discoveryDocs.map((doc) => <DocCard key={doc.name} doc={doc} />)}
            </div>
          </section>

          <section>
            <DocSectionHeader title="Planning Documents" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {planningDocs.map((doc) => <DocCard key={doc.name} doc={doc} />)}
            </div>
          </section>

          <section>
            <DocSectionHeader title="Architecture & Design" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {architectureDocs.map((doc) => <DocCard key={doc.name} doc={doc} />)}
            </div>
          </section>

          <section>
            <DocSectionHeader title="Features" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuresDocs.map((doc) => <DocCard key={doc.name} doc={doc} />)}
            </div>
          </section>

          <section>
            <DocSectionHeader title="Components" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {componentsDocs.map((doc) => <DocCard key={doc.name} doc={doc} />)}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default DevDocsPage;
