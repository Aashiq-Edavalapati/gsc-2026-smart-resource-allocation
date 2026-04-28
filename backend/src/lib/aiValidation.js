const ISSUE_CATEGORIES = new Set([
  'HEALTH',
  'EDUCATION',
  'SANITATION',
  'ENVIRONMENT',
  'WOMEN_AND_CHILD',
  'DISASTER',
  'FOOD',
  'OTHER'
]);

const normalizeCategory = (value, fallback = 'OTHER') => {
  if (typeof value !== 'string') {
    return fallback;
  }

  const normalized = value.trim().toUpperCase().replace(/[\s-]+/g, '_');
  return ISSUE_CATEGORIES.has(normalized) ? normalized : fallback;
};

const normalizeStringList = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(
    value
      .map(item => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean)
  )];
};

const normalizeUrgency = (value) => {
  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed)) {
    return 3;
  }

  return Math.max(1, Math.min(5, parsed));
};

const normalizeVolunteersNeeded = (value) => {
  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
};

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '');

export const normalizeIssueExtractionResult = (rawResult) => {
  if (!rawResult || typeof rawResult !== 'object') {
    throw new Error('Invalid AI extraction payload');
  }

  const rawIssues = Array.isArray(rawResult.issues) ? rawResult.issues : [];

  const issues = rawIssues
    .map((issue) => {
      if (!issue || typeof issue !== 'object') {
        return null;
      }

      const title = normalizeText(issue.title);
      const description = normalizeText(issue.description);

      if (!title || !description) {
        return null;
      }

      const category = normalizeCategory(issue.category);
      const tasks = (Array.isArray(issue.tasks) ? issue.tasks : [])
        .map((task) => {
          if (!task || typeof task !== 'object') {
            return null;
          }

          const taskTitle = normalizeText(task.title);
          const taskDescription = normalizeText(task.description);

          if (!taskTitle || !taskDescription) {
            return null;
          }

          return {
            title: taskTitle,
            description: taskDescription,
            category: normalizeCategory(task.category, category),
            requiredSkills: normalizeStringList(task.requiredSkills),
            volunteersNeeded: normalizeVolunteersNeeded(task.volunteersNeeded)
          };
        })
        .filter(Boolean);

      if (!tasks.length) {
        return null;
      }

      return {
        title,
        description,
        category,
        urgency: normalizeUrgency(issue.urgency),
        tasks
      };
    })
    .filter(Boolean);

  if (!issues.length) {
    throw new Error('No valid issues returned by the AI extractor');
  }

  return {
    issues
  };
};

export { ISSUE_CATEGORIES };