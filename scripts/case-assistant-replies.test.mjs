import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCaseAssistantReply,
  caseAssistantPrompts,
} from "../app/case-assistant-replies.ts";

function fixture(overrides = {}) {
  return {
    status: "In progress",
    owner: "Lina Chen",
    stage: "Review",
    priority: "Normal",
    due: "Tomorrow",
    policy: {
      "Policy number": "DEMO–204",
      Insured: "Jordan Lee",
      Type: "Life insurance",
      Request: "Policy change",
    },
    tasks: [
      {
        index: 2,
        name: "Review the application",
        status: "Completed",
        assignee: "Application Review",
        stage: "Intake",
        description: "Verify the signed application.",
        agent: "Application Review",
        analysis: "Application completeness checked.",
        action: {
          title: "Check application completeness",
          status: "Completed",
          requirements: [4],
        },
      },
      {
        index: 7,
        name: "Review financial data",
        status: "In review",
        assignee: "Lina Chen",
        stage: "Review",
        due: "Tomorrow",
        description: "Assess the company and personal statements.",
        action: {
          title: "Assess financial evidence",
          requirements: [8, 11],
        },
      },
      {
        index: 12,
        name: "Record the decision",
        status: "Blocked",
        assignee: "Marcus Reed",
        stage: "Decision",
        description: "Record the decision after the preceding review.",
        blocker: "Waiting for the financial review.",
      },
    ],
    requirements: [
      {
        index: 4,
        name: "Signed application",
        status: "Fulfilled",
        taskIndices: [2],
      },
      {
        index: 8,
        name: "Audited financial statements",
        status: "Received",
        taskIndices: [7],
      },
      {
        index: 11,
        name: "Personal financial statement",
        status: "Ordered",
        taskIndices: [7],
      },
    ],
    documents: [
      { requirementIndex: 4, name: "Signed application.pdf" },
      { requirementIndex: 8, name: "Audited financial statements.pdf" },
    ],
    activity: [
      {
        title: "Application checked",
        actor: "Application Review",
        at: "26 Oct, 09:18",
        agent: true,
        taskIndex: 2,
      },
    ],
    ...overrides,
  };
}

function reply(
  question,
  context = fixture(),
  caseRef = "CS–204",
  client = "Jordan Lee",
) {
  return buildCaseAssistantReply(question, caseRef, client, context);
}

test("policy answers quote only the filed fictional values", () => {
  const context = fixture();
  const result = reply("What policy is this?", context);
  assert.deepEqual(
    result.facts,
    Object.entries(context.policy).map(([label, value]) => ({ label, value })),
  );
  assert.deepEqual(result.records[0].target, { type: "overview" });

  const unavailable = reply("What is the coverage amount?", context);
  assert.match(unavailable.paragraphs.join(" "), /not recorded/);
  assert.doesNotMatch(JSON.stringify(unavailable), /\$[0-9]|million|500,000/);
});

test("each case answers from its own identity, owner, work and policy", () => {
  const first = reply("Summarise this case");
  assert.match(first.paragraphs.join(" "), /Jordan Lee/);
  assert.match(first.paragraphs.join(" "), /Lina Chen/);

  const otherContext = fixture({
    owner: "Morgan James",
    stage: "Intake",
    tasks: [
      {
        index: 9,
        name: "Verify the beneficiary declaration",
        status: "To do",
        assignee: "Morgan James",
        stage: "Intake",
        description: "Verify the submitted declaration.",
      },
    ],
    policy: { "Policy number": "DEMO–905", Insured: "Rowan Parker" },
    requirements: [],
    documents: [],
    activity: [],
  });
  const second = reply(
    "Summarise this case",
    otherContext,
    "CS–905",
    "Rowan Parker",
  );
  assert.match(second.paragraphs.join(" "), /Rowan Parker/);
  assert.match(second.paragraphs.join(" "), /Morgan James/);
  assert.equal(second.records[0].target.index, 9);
  assert.doesNotMatch(
    JSON.stringify(second),
    /Jordan Lee|Lina Chen|financial statement/,
  );

  const crossCase = reply("Summarise CS–905");
  assert.match(crossCase.paragraphs[0], /conversation is about CS–204/);
  assert.equal(crossCase.records, undefined);
});

test("document and task links use supplied record indices rather than canned offsets", () => {
  const task = reply("Tell me about financial review");
  assert.deepEqual(task.records[0].target, { type: "task", index: 7 });

  const document = reply("Show me Audited financial statements.pdf");
  assert.deepEqual(document.records[0].target, { type: "document", index: 8 });

  const receivedDocuments = reply("Which documents have been received?");
  assert.equal(receivedDocuments.records.length, 2);
  assert.ok(
    receivedDocuments.records.every(
      (record) => record.target.type === "document",
    ),
  );
});

test("every offered record target resolves within the current case", () => {
  const context = fixture();
  const questions = [
    ...caseAssistantPrompts(context),
    "Show all tasks",
    "Show all requirements",
    "Which documents do we have?",
    "What have the AI specialists done?",
    "Who is assigned to the open work?",
    "What changed on this case?",
    "When is this due?",
    "What is the policy?",
    "Tell me about Personal financial statement",
  ];
  for (const question of questions) {
    for (const { target } of reply(question, context).records ?? []) {
      if (!target || target.type === "overview") continue;
      const resolves =
        target.type === "task"
          ? context.tasks.some((task) => task.index === target.index)
          : target.type === "requirement"
            ? context.requirements.some(
                (requirement) => requirement.index === target.index,
              )
            : context.documents.some(
                (document) => document.requirementIndex === target.index,
              );
      assert.ok(resolves, `${question}: ${JSON.stringify(target)}`);
    }
  }
});

test("mutation requests stay read-only and leave source state untouched", () => {
  const context = fixture();
  const before = structuredClone(context);
  for (const question of [
    "Mark the task completed",
    "Can you reassign the task?",
    "Upload the document",
    "Approve this case",
  ]) {
    const result = reply(question, context);
    assert.match(result.paragraphs[0], /cannot change/);
    assert.equal(result.records, undefined);
  }
  assert.deepEqual(context, before);
});

test("unsupported prompts do not pivot to a financial gap or invented records", () => {
  const result = reply("What is the weather in Paris?");
  assert.match(result.paragraphs[0], /can’t answer/);
  assert.doesNotMatch(
    result.paragraphs.join(" "),
    /financial|received|missing statement/,
  );
  assert.equal(result.records, undefined);
});

test("action status changes appear in fresh answers without completing the task", () => {
  const context = fixture();
  const before = reply("Tell me about Review financial data", context);
  assert.ok(!before.facts.some((fact) => fact.label === "Action status"));

  context.tasks[1].action.status = "Waived";
  const after = reply("Tell me about Review financial data", context);
  assert.ok(
    after.facts.some(
      (fact) => fact.label === "Action status" && fact.value === "Waived",
    ),
  );
  assert.equal(after.records[0].status, "In review");
  assert.equal(context.tasks[1].status, "In review");
});

test("empty sources report their absence without fabricating complete work", () => {
  const empty = fixture({
    tasks: [],
    requirements: [],
    documents: [],
    activity: [],
  });
  const next = reply("What should I do next?", empty);
  assert.match(next.paragraphs[0], /No tasks are recorded/);
  assert.doesNotMatch(next.paragraphs[0], /All.*complete/);
  assert.equal(next.records.length, 0);
  assert.match(
    reply("Which documents do we have?", empty).paragraphs[0],
    /No documents are filed/,
  );
  assert.match(
    reply("What changed on this case?", empty).paragraphs[0],
    /No activity/,
  );
});

test("document questions never turn metadata into claims about the document contents", () => {
  const result = reply(
    "What does the Audited financial statements.pdf document prove?",
  );
  assert.match(result.paragraphs[0], /does not interpret document contents/);
  assert.deepEqual(result.records[0].target, { type: "document", index: 8 });
  assert.doesNotMatch(
    result.paragraphs.join(" "),
    /revenue|liabilities|income is|confirms that/,
  );
});

test("current-case references accept compact, spaced and dashed forms", () => {
  for (const ref of ["CS204", "CS 204", "CS-204", "CS–204"]) {
    const result = reply(`Summarise ${ref}`);
    assert.doesNotMatch(result.paragraphs.join(" "), /Open the other case/);
    assert.match(result.paragraphs.join(" "), /Jordan Lee/);
  }
});

test("activity opens the requirement when an event also references its task", () => {
  const result = reply(
    "What changed?",
    fixture({
      activity: [
        {
          title: "Evidence received",
          actor: "Lina Chen",
          at: "26 Oct, 09:58",
          taskIndex: 7,
          requirementIndex: 8,
        },
      ],
    }),
  );
  assert.deepEqual(result.records[0].target, { type: "requirement", index: 8 });
});

test("policy product questions recognize the recorded Type field", () => {
  const result = reply("What product is this policy?");
  assert.doesNotMatch(result.paragraphs.join(" "), /not recorded/);
  assert.ok(
    result.facts.some(
      (fact) => fact.label === "Type" && fact.value === "Life insurance",
    ),
  );
});
