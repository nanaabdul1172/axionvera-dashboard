export type DiagnosticEvent = {
  type: string;
  data?: Record<string, unknown>;
  timestamp: string;
};

const MAX_EVENTS = 100;
const buffer: DiagnosticEvent[] = [];

export function emit(type: string, data?: Record<string, unknown>) {
  const event: DiagnosticEvent = { type, data, timestamp: new Date().toISOString() };
  buffer.unshift(event);
  if (buffer.length > MAX_EVENTS) buffer.pop();
}

export function getEvents(): DiagnosticEvent[] {
  return [...buffer];
}

export function clear() {
  buffer.length = 0;
}
