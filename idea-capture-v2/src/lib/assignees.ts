export interface Assignee {
  name: string;
  clickupId: number;
}

export const ASSIGNEES: Assignee[] = [
  { name: "Michael", clickupId: 94209984 },
  { name: "Ann", clickupId: 94438580 },
];

export const ASSIGNEE_BY_NAME: Record<string, number> = Object.fromEntries(
  ASSIGNEES.map((a) => [a.name, a.clickupId])
);

export function resolveAssigneeId(name: string): number | undefined {
  return ASSIGNEE_BY_NAME[name];
}
