/** ClickUp list options — update IDs here when lists change */
export const CLICKUP_LISTS = [
  { id: "901414871453", name: "GH" },
  { id: "901414983966", name: "Personal" },
  { id: "901415149428", name: "Innovative" },
] as const;

export type ClickUpListId = (typeof CLICKUP_LISTS)[number]["id"];
