"use client";

import { createContext, use } from "react";
import type { BoardMember } from "./types";

// The project's members, for the assignee picker in every task dialog.
// A context saves passing the list through Board → Column → Card → Dialog.
const MembersContext = createContext<BoardMember[]>([]);

export const MembersProvider = MembersContext.Provider;

export function useBoardMembers() {
  return use(MembersContext);
}
