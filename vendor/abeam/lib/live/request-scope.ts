/** Owns one request; cancellation also rejects responses from transports that ignore abort. */
export function createRequestScope() {
  let current: AbortController | null = null;
  return {
    begin() {
      if (current) return null;
      current = new AbortController();
      return current;
    },
    isCurrent(request: AbortController) { return current === request && !request.signal.aborted; },
    finish(request: AbortController) {
      if (current !== request) return false;
      current = null;
      return true;
    },
    cancel() {
      current?.abort();
      current = null;
    },
  };
}
