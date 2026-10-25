export type CasePanelRecord = {
  key: string;
  kind: "task" | "requirement" | "document";
  label: string;
  caseIndex: number;
  taskIndex: number;
  requirementIndex: number;
  agentIndex: number | null;
  actionExpanded: boolean;
  actionFocusVersion: number;
};

export type OpenCasePanelRecord = Pick<
  CasePanelRecord,
  "key" | "kind" | "label" | "caseIndex" | "taskIndex" | "requirementIndex"
> & {
  agentIndex?: number | null;
  actionExpanded?: boolean;
  revealAction?: boolean;
};

export type CasePanelState = {
  entries: CasePanelRecord[];
  activeKey: string;
  visible: boolean;
};

export type CasePanelAction =
  | {
      type: "open";
      record: OpenCasePanelRecord;
      initialActionExpanded: boolean;
    }
  | { type: "select"; key: string }
  | { type: "hide" }
  | { type: "clear"; key: string }
  | {
      type: "update";
      key: string;
      patch: Partial<Pick<CasePanelRecord, "agentIndex" | "actionExpanded">>;
    };

export const initialCasePanelState: CasePanelState = {
  entries: [],
  activeKey: "assistant",
  visible: false,
};

export function casePanelReducer(
  state: CasePanelState,
  action: CasePanelAction,
): CasePanelState {
  switch (action.type) {
    case "open": {
      const incoming = action.record;
      const existingIndex = state.entries.findIndex(
        (entry) => entry.key === incoming.key,
      );
      const existing = state.entries[existingIndex];
      const record: CasePanelRecord = {
        key: incoming.key,
        kind: incoming.kind,
        label: incoming.label,
        caseIndex: incoming.caseIndex,
        taskIndex: incoming.taskIndex,
        requirementIndex: incoming.requirementIndex,
        agentIndex:
          incoming.agentIndex !== undefined
            ? incoming.agentIndex
            : (existing?.agentIndex ?? null),
        actionExpanded: incoming.revealAction
          ? true
          : (incoming.actionExpanded ??
            existing?.actionExpanded ??
            action.initialActionExpanded),
        actionFocusVersion:
          (existing?.actionFocusVersion ?? 0) + (incoming.revealAction ? 1 : 0),
      };
      const entries =
        existingIndex < 0
          ? [...state.entries, record]
          : state.entries.map((entry, index) =>
              index === existingIndex ? record : entry,
            );
      return { entries, activeKey: incoming.key, visible: true };
    }

    case "select": {
      if (
        action.key !== "assistant" &&
        !state.entries.some((entry) => entry.key === action.key)
      ) {
        return state;
      }
      if (state.activeKey === action.key && state.visible) return state;
      return { ...state, activeKey: action.key, visible: true };
    }

    case "hide":
      return state.visible ? { ...state, visible: false } : state;

    case "clear": {
      const index = state.entries.findIndex(
        (entry) => entry.key === action.key,
      );
      if (index < 0) return state;
      const entries = state.entries.filter((entry) => entry.key !== action.key);
      const activeKey =
        state.activeKey === action.key
          ? (entries[index - 1]?.key ?? entries[index]?.key ?? "assistant")
          : state.activeKey;
      return { ...state, entries, activeKey };
    }

    case "update": {
      const index = state.entries.findIndex(
        (entry) => entry.key === action.key,
      );
      if (index < 0) return state;
      const current = state.entries[index];
      const agentIndex =
        action.patch.agentIndex !== undefined
          ? action.patch.agentIndex
          : current.agentIndex;
      const actionExpanded =
        action.patch.actionExpanded ?? current.actionExpanded;
      if (
        agentIndex === current.agentIndex &&
        actionExpanded === current.actionExpanded
      )
        return state;
      const entries = state.entries.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, agentIndex, actionExpanded } : entry,
      );
      return { ...state, entries };
    }
  }
}
