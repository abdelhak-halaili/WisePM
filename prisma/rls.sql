-- Enable RLS on all tables
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "workflows" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tickets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "integrations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can view own profile" ON "profiles"
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON "profiles"
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON "profiles"
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Workflows
CREATE POLICY "Users can CRUD own workflows" ON "workflows"
  FOR ALL USING (auth.uid() = "userId");

-- Documents
CREATE POLICY "Users can CRUD own documents" ON "documents"
  FOR ALL USING (auth.uid() = "userId");

-- Tickets
CREATE POLICY "Users can CRUD own tickets" ON "tickets"
  FOR ALL USING (auth.uid() = "userId");

-- Projects
CREATE POLICY "Users can CRUD own projects" ON "projects"
  FOR ALL USING (auth.uid() = "userId");

-- Integrations
CREATE POLICY "Users can CRUD own integrations" ON "integrations"
  FOR ALL USING (auth.uid() = "userId");

-- Subscriptions
CREATE POLICY "Users can view own subscription" ON "subscriptions"
  FOR SELECT USING (auth.uid() = "userId");
