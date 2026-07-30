// 岗位管理类型定义
// 与 React 姊妹仓 src/types/position.ts 字段一致。
// 原 Vue 仓 src/types/org.ts 合并持有；本文件独立后 src/types/org.ts 改为 re-export。

export interface Position {
  id: string;
  name: string;
  code: string;
  description?: string;
  sort: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PositionMember {
  id: string;
  positionId: string;
  userId: string;
  userName: string;
  displayName: string;
  joinedAt: string;
}

export interface PositionCreateInput {
  name: string;
  code: string;
  description?: string;
  sort?: number;
  enabled?: boolean;
}

export type PositionUpdateInput = Partial<PositionCreateInput>;
