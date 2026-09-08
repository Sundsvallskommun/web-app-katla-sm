import { ErrandSubmissionContext } from '@contexts/errand-submission-context';
import { useContext } from 'react';

export function useErrandSubmission() {
  const submission = useContext(ErrandSubmissionContext);
  if (!submission) throw new Error('useErrandSubmission requires ErrandSubmissionProvider.');
  return submission;
}
