// 应用管理 & 菜单管理类型定义（与 React 姊妹仓 src/types/app.ts 对齐）
// 共享契约：字段名/类型/枚举与 React 仓一致，便于双栈对照。

/** 菜单项 */
export interface MenuItem {
  id: string
  /** 菜单名称 */
  name: string
  /** 路由路径（相对应用） */
  path: string
  /** 菜单图标（可选） */
  icon?: string
  /** 排序序号 */
  sort: number
  /** 所属应用 ID */
  appId: string
  /** 上级菜单 ID（顶级为 null） */
  parentId: string | null
  /** 是否启用 */
  enabled: boolean
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
}

/** 应用 */
export interface App {
  id: string
  /** 应用名称 */
  name: string
  /** 应用编码（唯一） */
  code: string
  /** 应用描述 */
  description?: string
  /** 主题色 */
  theme: string
  /** 排序号 */
  sort: number
  /** 是否启用 */
  enabled: boolean
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
}

/** 应用 + 旗下菜单（用于菜单管理页） */
export interface AppWithMenus extends App {
  menus: MenuItem[]
}

/** 创建应用入参 */
export interface AppCreateInput {
  name: string
  code: string
  description?: string
  theme?: string
  sort?: number
  enabled?: boolean
}

/** 创建菜单入参 */
export interface MenuCreateInput {
  name: string
  path: string
  appId: string
  parentId?: string | null
  icon?: string
  sort?: number
  enabled?: boolean
}

/** 更新应用入参（部分字段） */
export type AppUpdateInput = Partial<AppCreateInput>

/** 更新菜单入参（部分字段） */
export type MenuUpdateInput = Partial<Omit<MenuCreateInput, 'appId'>>
