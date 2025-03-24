-- Create document_feedback table
CREATE TABLE IF NOT EXISTS document_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  document_version_id UUID NOT NULL REFERENCES document_versions(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES mentors(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feedback_content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS document_feedback_document_id_idx ON document_feedback(document_id);
CREATE INDEX IF NOT EXISTS document_feedback_document_version_id_idx ON document_feedback(document_version_id);
CREATE INDEX IF NOT EXISTS document_feedback_mentor_id_idx ON document_feedback(mentor_id);
CREATE INDEX IF NOT EXISTS document_feedback_student_id_idx ON document_feedback(student_id);

-- Add row level security
ALTER TABLE document_feedback ENABLE ROW LEVEL SECURITY;

-- Mentors can read and write their own feedback
CREATE POLICY "Mentors can read and write their own feedback" ON document_feedback
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM mentors
      WHERE mentors.auth_id = auth.uid()
      AND mentors.id = document_feedback.mentor_id
    )
  );

-- Students can read feedback on their documents
CREATE POLICY "Students can read feedback on their documents" ON document_feedback
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_id = auth.uid()
      AND users.id = document_feedback.student_id
    )
  );