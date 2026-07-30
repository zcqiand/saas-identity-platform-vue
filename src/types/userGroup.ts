// 用户组类型定义
// 与 React 姊妹仓 src/types/userGroup.ts 字段一致。
// 原 Vue 仓 src/types/org.ts 合并持有；本文件独立后 src/types/org.ts 改为 re-export。

export interface UserGroup {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserGroupMember {
  id: string;
  groupId: string;
  userId: string;
  userName: string;
  displayName: string;
  joinedAt: string;
}

export interface UserGroupCreateInput {
  name: string;
  description?: string;
  enabled?: boolean;
}

export type UserGroupUpdateInput = Partial<UserGroupCreateInput>;
