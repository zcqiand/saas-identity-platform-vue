// Saas 身份平台的 lab-管理 应用 fixtures（M01.F04.I04 lab 集成）。
// saas-vue 提供 lab 集成服务（clientId='lab-management'）→ 返回 labadmin 身份。
// 与 saas-identity-platform（React）/msw/identity.ts 等价字段；
// 仅本仓（Vue）多 clientId='lab-management' 分支路径。

export const IDENTITY_CONTRACT_VERSION = 'v1'

/** 应用菜单（与 saas-react/mocks/db.ts fields 对齐） */
export interface IdentityMenu {
  id: string
  name: string
  /** 路由路径（相对 app base，无前导 /） */
  path: string
  icon?: string
  sort: number
  appId: string
  /** 父级 ID（顶级为 null） */
  parentId: string | null
  enabled: boolean
  /** 显隐所需权限码；缺省表示不鉴权 */
  permission?: string
  createdAt?: string
  updatedAt?: string
}

const T = { appId: 'app-lab', enabled: true }

/** lab 应用菜单（与 saas-React REF LAB_LAB_MENUS 对齐：5 分组 + 检测能力 + 基础数据叶子） */
export const LAB_APP_MENUS: IdentityMenu[] = [
  // 顶级
  { id: 'm-dash', name: '仪表盘', path: 'dashboard', parentId: null, sort: 1, ...T },
  // 分组父节点
  { id: 'grp-res', name: '资源管理', path: '', parentId: null, sort: 15, ...T },
  { id: 'grp-biz', name: '实验过程管理', path: '', parentId: null, sort: 20, ...T },
  { id: 'grp-stat', name: '统计报表', path: '', parentId: null, sort: 30, ...T },
  { id: 'grp-insp', name: '检测能力', path: '', parentId: null, sort: 40, ...T },
  { id: 'grp-master', name: '基础数据', path: '', parentId: null, sort: 50, ...T },
  // 资源管理
  { id: 'm-contracts', name: '合同管理', path: 'contracts', parentId: 'grp-res', sort: 1, permission: 'project:read', ...T },
  // 实验过程管理
  { id: 'm-receipts', name: '接样管理', path: 'receipts', parentId: 'grp-biz', sort: 1, permission: 'sample:read', ...T },
  { id: 'm-task', name: '任务安排', path: 'task-assignment', parentId: 'grp-biz', sort: 2, permission: 'report:write', ...T },
  { id: 'm-entry', name: '数据录入', path: 'data-entry', parentId: 'grp-biz', sort: 3, permission: 'report:write', ...T },
  { id: 'm-review', name: '报告审核', path: 'report-review', parentId: 'grp-biz', sort: 4, permission: 'report:read', ...T },
  { id: 'm-approve', name: '报告批准', path: 'report-approve', parentId: 'grp-biz', sort: 5, permission: 'report:issue', ...T },
  { id: 'm-issue', name: '报告发放', path: 'report-issue', parentId: 'grp-biz', sort: 6, permission: 'report:read', ...T },
  { id: 'm-archive', name: '报告归档', path: 'report-archive', parentId: 'grp-biz', sort: 7, permission: 'report:read', ...T },
  // 基础数据（路径用 lab-vue 实际路由：report-names→inspection-report-names）
  { id: 'm-report-names', name: '报告名称', path: 'inspection-report-names', parentId: 'grp-master', sort: 1, ...T },
  { id: 'm-param-ifs', name: '参数界面', path: 'param-interfaces', parentId: 'grp-master', sort: 2, ...T },
  { id: 'm-models', name: '型号维护', path: 'models', parentId: 'grp-master', sort: 3, ...T },
  { id: 'm-specs', name: '规格维护', path: 'specifications', parentId: 'grp-master', sort: 4, ...T },
  { id: 'm-grades', name: '等级维护', path: 'grades', parentId: 'grp-master', sort: 5, ...T },
  { id: 'm-brands', name: '牌号维护', path: 'brands', parentId: 'grp-master', sort: 6, ...T },
  { id: 'm-calc-rules', name: '计算规则', path: 'inspection-calculation-rules', parentId: 'grp-master', sort: 7, ...T },
  { id: 'm-tech-req', name: '技术要求', path: 'inspection-technical-requirements', parentId: 'grp-master', sort: 8, ...T },
  // 检测能力
  { id: 'm-insp-spec', name: '检测专项', path: 'inspection-specialties', parentId: 'grp-insp', sort: 1, ...T },
  { id: 'm-insp-obj', name: '检测项目', path: 'inspection-objects', parentId: 'grp-insp', sort: 2, ...T },
  { id: 'm-insp-param', name: '检测参数', path: 'inspection-parameters', parentId: 'grp-insp', sort: 3, ...T },
  { id: 'm-insp-std', name: '检测标准', path: 'inspection-standards', parentId: 'grp-insp', sort: 4, ...T },
  // 统计
  { id: 'm-summary', name: '统计汇总', path: 'summary', parentId: 'grp-stat', sort: 1, permission: 'report:read', ...T },
]

/** 租户角色目录（tenant-scoped）。lab 单租户：tenant-lab */
export interface IdentityRole {
  id: string
  name: string
  permissions: string[]
}

const ADMIN_PERMS = [
  'project:read', 'project:write',
  'sample:read', 'sample:write',
  'report:read', 'report:write', 'report:issue',
  'user:read', 'user:delete',
  'role:read', 'role:write',
  'audit:read',
]
const TECH_PERMS = [
  'project:read', 'sample:read', 'sample:write', 'report:read', 'report:write',
]

export const LAB_ROLES: IdentityRole[] = [
  { id: 'role-admin', name: 'labadmin', permissions: ADMIN_PERMS },
  { id: 'role-tech', name: 'technician', permissions: TECH_PERMS },
]

/** 按角色名取权限集；未知角色回退到 labadmin */
export function permissionsForRole(roleName: string): string[] {
  return (LAB_ROLES.find((r) => r.name === roleName) ?? LAB_ROLES[0]!).permissions
}
