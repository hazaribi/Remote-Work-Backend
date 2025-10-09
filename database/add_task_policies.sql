-- Add RLS policies for task updates
CREATE POLICY "Workspace members can update tasks" ON tasks FOR UPDATE 
USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "Workspace members can insert tasks" ON tasks FOR INSERT 
WITH CHECK (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "Workspace members can delete tasks" ON tasks FOR DELETE 
USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));