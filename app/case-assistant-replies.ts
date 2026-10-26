export type CaseAssistantContext = {
  status: string;
  owner: string;
  stage: string;
  priority: string;
  due: string;
  policy?: Record<string, string>;
  tasks: {
    index: number;
    name: string;
    status: string;
    assignee: string;
    stage: string;
    due?: string;
    description: string;
    agent?: string;
    analysis?: string;
    blocker?: string;
    action?: { title: string; status?: string; requirements: number[] };
  }[];
  requirements: {
    index: number;
    name: string;
    status: string;
    taskIndices: number[];
    description?: string;
    source?: string;
    receivedAt?: string;
  }[];
  documents: {
    requirementIndex: number;
    name: string;
    receivedAt?: string;
    source?: string;
  }[];
  activity: {
    title: string;
    actor: string;
    at: string;
    agent?: boolean;
    taskIndex?: number;
    requirementIndex?: number;
  }[];
};

export type AssistantTarget =
  | { type: "overview" }
  | { type: "task" | "requirement" | "document"; index: number };

export type AssistantRecord = {
  title: string;
  detail?: string;
  status?: string;
  target?: AssistantTarget;
  ai?: boolean;
};

export type CaseAssistantReply = {
  paragraphs: string[];
  records?: AssistantRecord[];
  facts?: { label: string; value: string }[];
  suggestions?: string[];
};

type Task = CaseAssistantContext["tasks"][number];
type Requirement = CaseAssistantContext["requirements"][number];
type DocumentRecord = CaseAssistantContext["documents"][number];

function normalize(value: string) {
  return value
    .toLocaleLowerCase()
    .replace(/[’']/g, "")
    .replace(/[–—_-]/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const genericWords = new Set([
  "the",
  "a",
  "an",
  "of",
  "for",
  "to",
  "and",
  "on",
  "case",
  "task",
  "review",
  "check",
  "record",
  "required",
  "data",
  "evidence",
  "document",
]);

function namedRecord<T>(
  question: string,
  records: T[],
  name: (record: T) => string,
): T | undefined {
  const padded = ` ${question} `;
  const exact = records.find((record) => {
    const title = normalize(name(record).replace(/\.pdf$/i, ""));
    return title.length > 5 && padded.includes(` ${title} `);
  });
  if (exact) return exact;

  const words = new Set(question.split(" "));
  const matches = records
    .map((record) => {
      const titleWords = normalize(name(record).replace(/\.pdf$/i, "")).split(
        " ",
      );
      const terms = titleWords.filter((word) => !genericWords.has(word));
      const hits = terms.filter((word) => words.has(word)).length;
      return {
        record,
        score: terms.length ? hits / terms.length : 0,
        hits,
        namedWords: titleWords.filter(
          (word) => words.has(word) && word !== "the",
        ).length,
      };
    })
    .filter(
      (match) =>
        match.hits >= 1 && match.namedWords >= 2 && match.score >= 0.65,
    )
    .sort((left, right) => right.score - left.score);
  return matches.length === 1 ||
    (matches[0] && matches[0].score > (matches[1]?.score ?? 0))
    ? matches[0]?.record
    : undefined;
}

function taskRecord(task: Task): AssistantRecord {
  return {
    title: task.name,
    detail: [task.assignee, task.stage, task.due && `Due ${task.due}`]
      .filter(Boolean)
      .join(" · "),
    status: task.status,
    target: { type: "task", index: task.index },
    ai: Boolean(task.agent && task.assignee === task.agent),
  };
}

function requirementRecord(requirement: Requirement): AssistantRecord {
  return {
    title: requirement.name,
    detail:
      requirement.status === "Ordered"
        ? "Evidence requested"
        : requirement.status === "Received"
          ? "Evidence available for review"
          : requirement.status === "Fulfilled"
            ? "Requirement met"
            : requirement.description,
    status: requirement.status,
    target: { type: "requirement", index: requirement.index },
  };
}

function documentRecord(
  document: DocumentRecord,
  context: CaseAssistantContext,
): AssistantRecord {
  const requirement = context.requirements.find(
    (item) => item.index === document.requirementIndex,
  );
  return {
    title: document.name,
    detail: [requirement?.name, document.receivedAt, document.source]
      .filter(Boolean)
      .join(" · "),
    target: { type: "document", index: document.requirementIndex },
  };
}

function availableWork(context: CaseAssistantContext) {
  return context.tasks.filter(
    (task) => !["Completed", "Cancelled", "Waived"].includes(task.status),
  );
}

export function caseAssistantPrompts(context: CaseAssistantContext): string[] {
  return [
    "Summarise this case",
    ...(Object.keys(context.policy ?? {}).length
      ? ["Show policy details"]
      : []),
    ...(availableWork(context).length ? ["What should I do next?"] : []),
    ...(context.requirements.some((item) => item.status === "Ordered")
      ? ["Which requirements are still waiting on evidence?"]
      : ["What have the AI specialists done?"]),
  ];
}

function taskReply(
  task: Task,
  context: CaseAssistantContext,
): CaseAssistantReply {
  const related = context.requirements.filter((requirement) =>
    task.action?.requirements.includes(requirement.index),
  );
  return {
    paragraphs: [
      `${task.name} is ${task.status.toLocaleLowerCase()}, assigned to ${task.assignee}.${task.blocker ? ` ${task.blocker}` : ""}`,
      task.description,
    ],
    facts: [
      { label: "Stage", value: task.stage },
      ...(task.due ? [{ label: "Due", value: task.due }] : []),
      ...(task.action
        ? [
            { label: "Action", value: task.action.title },
            ...(task.action.status
              ? [{ label: "Action status", value: task.action.status }]
              : []),
          ]
        : []),
    ],
    records: [taskRecord(task), ...related.map(requirementRecord)],
    suggestions: [
      "Which documents do we have?",
      "What have the AI specialists done?",
    ],
  };
}

function requirementReply(
  requirement: Requirement,
  context: CaseAssistantContext,
): CaseAssistantReply {
  const documents = context.documents.filter(
    (document) => document.requirementIndex === requirement.index,
  );
  const tasks = context.tasks.filter((task) =>
    requirement.taskIndices.includes(task.index),
  );
  const state =
    requirement.status === "Ordered"
      ? "has been ordered; receipt has not been recorded"
      : requirement.status === "Received"
        ? "has been received and is available for review"
        : requirement.status === "Fulfilled"
          ? "is fulfilled"
          : `is ${requirement.status.toLocaleLowerCase()}`;
  return {
    paragraphs: [
      `${requirement.name} ${state}.`,
      ...(requirement.description ? [requirement.description] : []),
    ],
    records: [
      requirementRecord(requirement),
      ...documents.map((document) => documentRecord(document, context)),
      ...tasks.slice(0, 2).map(taskRecord),
    ],
    suggestions: ["Show all requirements", "What should I do next?"],
  };
}

function documentReply(
  documents: DocumentRecord[],
  context: CaseAssistantContext,
  readingContents: boolean,
): CaseAssistantReply {
  return {
    paragraphs: [
      documents.length
        ? readingContents
          ? "I can show the filed documents and their linked requirements. Open the viewer to inspect the pages and cited findings; the chat does not interpret document contents."
          : `There ${documents.length === 1 ? "is 1 filed document" : `are ${documents.length} filed documents`} in this selection. Open a record to inspect its pages, findings, and linked requirement.`
        : "No documents are filed in this demo case yet.",
    ],
    records: documents
      .slice(0, 6)
      .map((document) => documentRecord(document, context)),
    suggestions: [
      "Which requirements are still waiting on evidence?",
      "Summarise this case",
    ],
  };
}

function summaryReply(
  caseRef: string,
  clientName: string,
  context: CaseAssistantContext,
): CaseAssistantReply {
  const open = availableWork(context);
  const ordered = context.requirements.filter(
    (item) => item.status === "Ordered",
  );
  const active = open.find((task) => task.status !== "Blocked") ?? open[0];
  return {
    paragraphs: [
      `${caseRef} is the case for ${clientName}. It is ${context.status.toLocaleLowerCase()} at ${context.stage}, with ${context.owner}.`,
      ...(active?.blocker ? [active.blocker] : []),
    ],
    facts: [
      { label: "Open tasks", value: String(open.length) },
      { label: "Awaiting evidence", value: String(ordered.length) },
      { label: "Case due", value: context.due },
    ],
    records: active
      ? [taskRecord(active)]
      : [
          {
            title: "Case overview",
            detail: context.stage,
            target: { type: "overview" },
          },
        ],
    suggestions: [
      "What should I do next?",
      "What have the AI specialists done?",
    ],
  };
}

/** Read-only replies over the same public records the portfolio UI displays. */
export function buildCaseAssistantReply(
  input: string,
  caseRef: string,
  clientName: string,
  context: CaseAssistantContext,
): CaseAssistantReply {
  const question = normalize(input);
  const contains = (pattern: RegExp) => pattern.test(question);
  const requestedCase = question.match(/\bcs\s*\d+\b/)?.[0];
  if (
    requestedCase &&
    requestedCase.replace(/\s/g, "") !== normalize(caseRef).replace(/\s/g, "")
  ) {
    return {
      paragraphs: [
        `This conversation is about ${caseRef}. Open the other case and its assistant to ask about that record.`,
      ],
    };
  }

  if (
    /^(?:(?:please|can you|could you|will you|would you)\s+)*(?:mark|approve|reject|complete|delete|create|upload|reassign|send|waive|order|change|update|cancel)\b/.test(
      question,
    )
  ) {
    return {
      paragraphs: [
        "The portfolio assistant can explain and open records, but it cannot change a case, complete work, send requests, or upload files.",
      ],
      suggestions: ["What should I do next?", "Summarise this case"],
    };
  }

  const namedTask = namedRecord(question, context.tasks, (task) => task.name);
  const namedRequirement = namedRecord(
    question,
    context.requirements,
    (item) => item.name,
  );
  const namedDocument = namedRecord(
    question,
    context.documents,
    (item) => item.name,
  );
  const documentQuestion = contains(
    /\b(document|documents|file|files|pdf|attachment|attachments|preview|report)\b/,
  );

  if (documentQuestion && namedDocument) {
    return documentReply(
      [namedDocument],
      context,
      contains(
        /\b(say|says|show|shows|contain|contents|prove|interpret|summarise|summarize|analyse|analyze)\b/,
      ) && !contains(/\b(open|preview|show me)\b/),
    );
  }
  if (
    namedTask &&
    !contains(/\b(all|every)\b/) &&
    contains(/\b(ai|agent|specialist|did|done)\b/) &&
    namedTask.analysis
  ) {
    return {
      paragraphs: [namedTask.analysis],
      records: [taskRecord(namedTask)],
      suggestions: ["What should I do next?", "What changed on this case?"],
    };
  }
  if (namedTask && !contains(/\b(all|every)\b/))
    return taskReply(namedTask, context);
  if (namedRequirement && !contains(/\b(all|every)\b/))
    return requirementReply(namedRequirement, context);

  if (
    contains(/\bpriority\b/) &&
    !contains(/\b(next|recommend|start|focus|do first)\b/)
  ) {
    return {
      paragraphs: [
        `${caseRef} has ${context.priority.toLocaleLowerCase()} priority and is due ${context.due}.`,
      ],
      records: [
        {
          title: "Case overview",
          detail: `${context.owner} · ${context.stage}`,
          target: { type: "overview" },
        },
      ],
      suggestions: ["What should I do next?", "What is blocking this case?"],
    };
  }

  if (documentQuestion && !contains(/\b(requirement|requirements)\b/))
    return documentReply(
      context.documents,
      context,
      contains(
        /\b(contents|interpret|summarise|summarize|analyse|analyze|prove)\b/,
      ),
    );

  if (
    contains(
      /\b(policy|policies|coverage|cover|premium|beneficiary|beneficiaries|product|insured|client|applicant)\b/,
    )
  ) {
    const policy = Object.entries(context.policy ?? {}).filter(([, value]) =>
      value.trim(),
    );
    const specific =
      /\b(coverage|cover|premium|beneficiary|beneficiaries|insured|product)\b/.exec(
        question,
      )?.[0];
    const matching =
      specific &&
      policy.filter(
        ([label]) =>
          normalize(label).includes(
            specific === "cover" ? "coverage" : specific,
          ) ||
          (specific === "product" &&
            /^(type|policy type)$/.test(normalize(label))),
      );
    return {
      paragraphs: [
        specific && !matching?.length
          ? `That ${specific} detail is not recorded in this public demo. The available case and policy information is shown below.`
          : policy.length
            ? `These are the policy details recorded for ${clientName}.`
            : `No policy details are included in ${caseRef}’s public demo record.`,
      ],
      facts: policy.map(([label, value]) => ({ label, value })),
      records: [
        {
          title: "Case overview",
          detail: `${caseRef} · ${clientName}`,
          target: { type: "overview" },
        },
      ],
      suggestions: ["Summarise this case", "Who is assigned to the open work?"],
    };
  }

  if (
    contains(
      /\b(agent|agents|specialist|specialists|automation|automated|ai)\b/,
    )
  ) {
    const specialists = context.tasks.filter((task) => task.agent);
    return {
      paragraphs: [
        specialists.length
          ? "These specialists have a recorded role in this case. Their findings support the caseworker; an AI finding does not complete a task or approve the case."
          : "No specialist work is recorded in this demo case.",
      ],
      records: specialists.map((task) => ({
        title: task.agent!,
        detail: task.analysis ?? `${task.name} · ${task.status}`,
        status: task.status,
        ai: true,
        target: { type: "task" as const, index: task.index },
      })),
      suggestions: ["What changed on this case?", "What should I do next?"],
    };
  }

  if (
    contains(
      /\b(next|prioritise|prioritize|priority|focus|recommend|recommendation|start)\b/,
    ) ||
    contains(/\bwhat should i do\b/)
  ) {
    const open = availableWork(context);
    const next = open.find((task) => task.status !== "Blocked");
    if (!next)
      return {
        paragraphs: [
          open.length
            ? "The remaining tasks are blocked. Open a blocked task to inspect its recorded dependency before proceeding."
            : context.tasks.length
              ? "No tasks remain open. The case status remains a separate record; task completion does not by itself issue a decision."
              : "No tasks are recorded in this demo case yet.",
        ],
        records: open.slice(0, 2).map(taskRecord),
        suggestions: ["What is blocking this case?", "Summarise this case"],
      };
    const waiting = context.requirements.filter(
      (requirement) =>
        requirement.status === "Ordered" &&
        next.action?.requirements.includes(requirement.index),
    );
    return {
      paragraphs: [
        `The next available task is “${next.name}”, assigned to ${next.assignee}.${next.blocker ? ` ${next.blocker}` : ""}`,
        ...(waiting.length
          ? [
              `${waiting.map((item) => item.name).join(" and ")} ${waiting.length === 1 ? "is" : "are"} still ordered. Receipt and review must be tracked separately.`,
            ]
          : [next.description]),
      ],
      records: [
        taskRecord(next),
        ...waiting.slice(0, 2).map(requirementRecord),
      ],
      suggestions: [
        "Which requirements are still waiting on evidence?",
        "Who is assigned to the open work?",
      ],
    };
  }

  if (
    contains(/\b(block|blocked|blocking|stuck|delay|delayed|holding|hold)\b/)
  ) {
    const blocked = context.tasks.filter((task) => task.status === "Blocked");
    return {
      paragraphs: [
        blocked.length
          ? `${blocked.length} ${blocked.length === 1 ? "task is" : "tasks are"} marked blocked. A blocked status identifies work that cannot proceed; the record below names the reason where one is provided.`
          : "No task is marked blocked in this demo case.",
      ],
      records: blocked.map((task) => ({
        ...taskRecord(task),
        detail: task.blocker ?? "The record does not name the dependency.",
      })),
      suggestions: [
        "What should I do next?",
        "Which requirements are still waiting on evidence?",
      ],
    };
  }

  if (
    contains(
      /\b(requirement|requirements|evidence|missing|outstanding|received|fulfilled|ordered|waiting|medical|physician|financial)\b/,
    )
  ) {
    const outstanding = contains(
      /\b(missing|outstanding|waiting|needed|need)\b/,
    );
    const status = contains(/\breceived\b/)
      ? "Received"
      : contains(/\bfulfilled\b/)
        ? "Fulfilled"
        : contains(/\bordered\b/)
          ? "Ordered"
          : null;
    const requirements = context.requirements.filter((item) =>
      status
        ? item.status === status
        : !outstanding || item.status === "Ordered",
    );
    return {
      paragraphs: [
        requirements.length
          ? outstanding
            ? "These requirements are ordered and still awaiting evidence. Received means a document is available; Fulfilled means the requirement itself is met."
            : "Requirement status and task status are tracked separately. Received evidence remains available for review; Fulfilled records a met requirement."
          : outstanding
            ? "No requirement is marked Ordered in this demo case. Received evidence can still need a review."
            : `No ${status?.toLocaleLowerCase() ?? "matching"} requirements are recorded.`,
      ],
      records: requirements.map(requirementRecord),
      suggestions: ["Which documents do we have?", "What should I do next?"],
    };
  }

  if (documentQuestion)
    return documentReply(
      context.documents,
      context,
      contains(
        /\b(contents|interpret|summarise|summarize|analyse|analyze|prove)\b/,
      ),
    );

  if (
    contains(
      /\b(activity|activities|history|changed|change|happened|recent|recently|timeline)\b/,
    )
  ) {
    return {
      paragraphs: [
        context.activity.length
          ? "These are the recorded events for this demo case, most recent first."
          : "No activity has been recorded in this demo case.",
      ],
      records: context.activity.slice(0, 6).map((event) => ({
        title: event.title,
        detail: `${event.actor} · ${event.at}`,
        ai: event.agent,
        target:
          event.requirementIndex !== undefined
            ? { type: "requirement", index: event.requirementIndex }
            : event.taskIndex !== undefined
              ? { type: "task", index: event.taskIndex }
              : undefined,
      })),
      suggestions: [
        "What have the AI specialists done?",
        "Summarise this case",
      ],
    };
  }

  if (contains(/\b(due|deadline|sla|overdue|late|when|dates|date)\b/)) {
    const dueTasks = availableWork(context).filter((task) => task.due);
    return {
      paragraphs: [
        `${caseRef} is due ${context.due}. Only the dates recorded in this demo are available; no separate service-level calculation is included.`,
      ],
      records: dueTasks.slice(0, 5).map(taskRecord),
      suggestions: [
        "What should I do next?",
        "Who is assigned to the open work?",
      ],
    };
  }

  if (
    contains(
      /\b(who|owner|assigned|assignee|team|people|responsible|handling)\b/,
    )
  ) {
    const open = availableWork(context);
    return {
      paragraphs: [
        `${context.owner} owns ${caseRef}. Open task assignments are listed below; a specialist finding may be attached to a task assigned to a person.`,
      ],
      records: open.slice(0, 6).map(taskRecord),
      suggestions: [
        "What have the AI specialists done?",
        "What should I do next?",
      ],
    };
  }

  if (contains(/\b(task|tasks|actions|work|todo)\b/) || contains(/\bto do\b/)) {
    const filtered = contains(/\b(completed|finished|done)\b/)
      ? context.tasks.filter((task) => task.status === "Completed")
      : contains(/\b(open|remaining|todo)\b/) || contains(/\bto do\b/)
        ? availableWork(context)
        : context.tasks;
    return {
      paragraphs: [
        filtered.length
          ? `These are the ${filtered.length} matching tasks recorded on ${caseRef}. Open one to inspect its action and related evidence.`
          : "No tasks match that selection in this demo case.",
      ],
      records: filtered.slice(0, 8).map(taskRecord),
      suggestions: [
        "What should I do next?",
        "Which requirements are still waiting on evidence?",
      ],
    };
  }

  if (
    contains(
      /\b(summary|summarise|summarize|overview|recap|status|progress|hello|hi)\b/,
    ) ||
    contains(/\b(where are we|bring me up to speed|whats going on)\b/)
  ) {
    return summaryReply(caseRef, clientName, context);
  }

  if (contains(/\b(help|capabilities)\b/) || contains(/\bwhat can you do\b/)) {
    return {
      paragraphs: [
        "I can summarise this demo case, explain tasks and their actions, list evidence, show assignments and recent activity, and open the related records. I can read the information shown here; I cannot change it.",
      ],
      suggestions: caseAssistantPrompts(context),
    };
  }

  return {
    paragraphs: [
      "I can’t answer that from the information in this public demo. Ask about the case, a named task, policy details, requirements, filed documents, or specialist work.",
    ],
    suggestions: ["Summarise this case", "Which documents do we have?"],
  };
}
