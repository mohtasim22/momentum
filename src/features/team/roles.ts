import type { Role } from "@/generated/prisma/enums";

export const ROLE_LABEL: Record<Role, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Member",
};

export const ROLE_ORDER: Role[] = ["OWNER", "ADMIN", "MEMBER"];
