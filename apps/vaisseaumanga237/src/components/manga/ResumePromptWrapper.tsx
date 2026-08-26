'use client';
import { useState } from 'react';
import { ResumePrompt } from './MangaReader';

export function ResumePromptWrapper({
  savedPage,
  total,
  title,
}: {
  savedPage: number;
  total: number;
  title: string;
}) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <ResumePrompt
      savedPage={savedPage}
      total={total}
      title={title}
      onResume={() => setDismissed(true)}
      onRestart={() => setDismissed(true)}
    />
  );
}
