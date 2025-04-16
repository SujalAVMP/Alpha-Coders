const getLatestSubmissionForTest = (test) => {
  if (!test.submissions || test.submissions.length === 0) return null;
  // Filter out assessment-level submissions
  const testSubmissions = test.submissions.filter(sub => !sub.isAssessmentSubmission);
  if (testSubmissions.length === 0) return null;
  return testSubmissions.reduce((latest, sub) =>
    !latest || new Date(sub.submittedAt) > new Date(latest.submittedAt) ? sub : latest
  , null);
};