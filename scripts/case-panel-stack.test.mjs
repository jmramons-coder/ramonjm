import assert from "node:assert/strict";
import test from "node:test";
import {
  casePanelReducer,
  initialCasePanelState,
} from "../app/case-panel-stack.ts";

function record(key, overrides = {}) {
  return {
    key,
    kind: "task",
    label: `Record ${key}`,
    caseIndex: 0,
    taskIndex: 3,
    requirementIndex: 2,
    ...overrides,
  };
}

function open(state, key, overrides = {}, initialActionExpanded = false) {
  return casePanelReducer(state, {
    type: "open",
    record: record(key, overrides),
    initialActionExpanded,
  });
}

function keys(state) {
  return state.entries.map((entry) => entry.key);
}

test("new records use their initial UI defaults and open the dock", () => {
  const state = open(initialCasePanelState, "task:3", {}, true);
  assert.equal(state.visible, true);
  assert.equal(state.activeKey, "task:3");
  assert.equal(state.entries[0].agentIndex, null);
  assert.equal(state.entries[0].actionExpanded, true);
  assert.equal(state.entries[0].actionFocusVersion, 0);
  assert.deepEqual(initialCasePanelState, {
    entries: [], activeKey: "assistant", visible: false,
  });

  const explicit = open(initialCasePanelState, "task:3", {
    agentIndex: 2, actionExpanded: false,
  }, true);
  assert.equal(explicit.entries[0].agentIndex, 2);
  assert.equal(explicit.entries[0].actionExpanded, false);
});

test("revisiting a record refreshes context without duplicates, reordering, or losing UI", () => {
  let state = open(initialCasePanelState, "task:3", {
    agentIndex: 2, actionExpanded: true,
  });
  state = open(state, "requirement:2", { kind: "requirement" });
  state = open(state, "document:1", { kind: "document" });
  const before = state;
  state = open(state, "task:3", {
    label: "Updated financial review",
    caseIndex: 1,
    taskIndex: 4,
    requirementIndex: 1,
  });

  assert.deepEqual(keys(state), ["task:3", "requirement:2", "document:1"]);
  assert.equal(state.activeKey, "task:3");
  assert.equal(state.entries[0].label, "Updated financial review");
  assert.equal(state.entries[0].caseIndex, 1);
  assert.equal(state.entries[0].taskIndex, 4);
  assert.equal(state.entries[0].requirementIndex, 1);
  assert.equal(state.entries[0].agentIndex, 2);
  assert.equal(state.entries[0].actionExpanded, true);
  assert.equal(before.entries[0].label, "Record task:3");
  assert.strictEqual(state.entries[1], before.entries[1]);
});

test("explicit open UI values override remembered values, including false and null", () => {
  const state = open(initialCasePanelState, "task:3", {
    agentIndex: 2, actionExpanded: true,
  });
  const reopened = open(state, "task:3", {
    agentIndex: null, actionExpanded: false,
  }, true);
  assert.equal(reopened.entries[0].agentIndex, null);
  assert.equal(reopened.entries[0].actionExpanded, false);
});

test("revealAction expands a record and issues a fresh focus version each time", () => {
  let state = open(initialCasePanelState, "task:3", {
    revealAction: true, actionExpanded: false,
  });
  assert.equal(state.entries[0].actionExpanded, true);
  assert.equal(state.entries[0].actionFocusVersion, 1);
  state = open(state, "task:3", { revealAction: true });
  assert.equal(state.entries[0].actionFocusVersion, 2);
  state = open(state, "task:3");
  assert.equal(state.entries[0].actionFocusVersion, 2);
  assert.equal(state.entries.length, 1);
});

test("select reopens known records or the assistant and ignores missing records", () => {
  const state = casePanelReducer(open(initialCasePanelState, "task:3"), { type: "hide" });
  assert.strictEqual(casePanelReducer(state, { type: "select", key: "missing" }), state);
  const selected = casePanelReducer(state, { type: "select", key: "task:3" });
  assert.equal(selected.visible, true);
  assert.equal(selected.activeKey, "task:3");
  assert.strictEqual(selected.entries, state.entries);
  const assistant = casePanelReducer(state, { type: "select", key: "assistant" });
  assert.equal(assistant.activeKey, "assistant");
  assert.equal(assistant.visible, true);
  assert.strictEqual(assistant.entries, state.entries);
});

test("hiding preserves more than six records and each record's UI state", () => {
  let state = initialCasePanelState;
  for (let index = 0; index < 12; index++) {
    state = open(state, `task:${index}`, {
      taskIndex: index,
      agentIndex: index % 3,
      actionExpanded: index % 2 === 0,
    });
  }
  const hidden = casePanelReducer(state, { type: "hide" });
  assert.equal(hidden.visible, false);
  assert.equal(hidden.entries.length, 12);
  assert.equal(hidden.activeKey, "task:11");
  assert.strictEqual(hidden.entries, state.entries);
  const reopened = casePanelReducer(hidden, { type: "select", key: "task:0" });
  assert.equal(reopened.entries[0].agentIndex, 0);
  assert.equal(reopened.entries[0].actionExpanded, true);
  assert.deepEqual(keys(reopened), keys(state));
});

test("clearing the active record picks the nearest left neighbor, then right, then assistant", () => {
  let state = open(initialCasePanelState, "left");
  state = open(state, "middle");
  state = open(state, "right");
  state = casePanelReducer(state, { type: "select", key: "middle" });
  state = casePanelReducer(state, { type: "clear", key: "middle" });
  assert.deepEqual(keys(state), ["left", "right"]);
  assert.equal(state.activeKey, "left");
  assert.equal(state.visible, true);

  state = casePanelReducer(state, { type: "clear", key: "left" });
  assert.equal(state.activeKey, "right");
  assert.equal(state.visible, true);
  state = casePanelReducer(state, { type: "clear", key: "right" });
  assert.equal(state.activeKey, "assistant");
  assert.equal(state.visible, true);
  assert.deepEqual(state.entries, []);
});

test("clearing an inactive parent keeps child records, the active record, and visibility", () => {
  let state = open(initialCasePanelState, "task:3");
  state = open(state, "requirement:2", { kind: "requirement" });
  state = open(state, "document:2", { kind: "document" });
  const before = state;
  state = casePanelReducer(state, { type: "clear", key: "task:3" });
  assert.deepEqual(keys(state), ["requirement:2", "document:2"]);
  assert.equal(state.activeKey, "document:2");
  assert.equal(state.visible, before.visible);
  assert.strictEqual(state.entries[0], before.entries[1]);
  assert.strictEqual(state.entries[1], before.entries[2]);
  assert.strictEqual(casePanelReducer(state, { type: "clear", key: "missing" }), state);
});

test("UI updates only affect the targeted record and cannot replace its identity or context", () => {
  let state = open(initialCasePanelState, "task:3");
  state = open(state, "requirement:2", { kind: "requirement" });
  const before = state;
  const updated = casePanelReducer(state, {
    type: "update",
    key: "task:3",
    patch: {
      agentIndex: 2,
      actionExpanded: true,
      key: "unexpected",
      label: "Unexpected label",
      caseIndex: 99,
      actionFocusVersion: 99,
    },
  });
  assert.equal(updated.entries[0].agentIndex, 2);
  assert.equal(updated.entries[0].actionExpanded, true);
  assert.equal(updated.entries[0].key, "task:3");
  assert.equal(updated.entries[0].label, "Record task:3");
  assert.equal(updated.entries[0].caseIndex, 0);
  assert.equal(updated.entries[0].actionFocusVersion, 0);
  assert.strictEqual(updated.entries[1], before.entries[1]);
  assert.equal(updated.activeKey, before.activeKey);
  assert.equal(updated.visible, before.visible);
  assert.equal(before.entries[0].agentIndex, null);
  assert.strictEqual(casePanelReducer(updated, { type: "update", key: "missing", patch: { agentIndex: 1 } }), updated);
});
