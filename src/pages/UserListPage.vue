<script setup lang="ts">
// M01.F01 — tenant-scoped 成员管理（列表 / 创建 / 邀请 / 详情 / 编辑 / 启停 / 角色 / 删除）
// 走 tenantMembersListTenantUsers / createTenantUser / updateTenantUser /
// getTenantUser / inviteTenantUser / changeTenantUserStatus / deleteTenantUser /
// assignTenantMemberRoles（orval 1:1 端点，类型只用生成物）
// @entry M00.F02.I01 — 成员列表（本页表格，tenantMembersListTenantUsers，支持分页与状态过滤）
// @entry M00.F02.I02 — 创建成员（「创建成员」弹窗，createTenantUser + 二步 assignRoles）
// @entry M00.F02.I03 — 成员详情（行内「详情」弹层，tenantMembersGetTenantUser）
// @entry M00.F02.I04 — 编辑成员（email/mobile 全字段，updateTenantUser）
// @entry M00.F02.I06 — 邀请成员（「邀请成员」弹窗，tenantMembersInviteTenantUser）
// @entry M00.F02.I08 — 独立启停（行内「停用/启用」+ ConfirmDialog，changeTenantUserStatus）

import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "reka-ui";
import { useTenantRolesListSysRoles } from "../api/endpoints/tenant-roles/tenant-roles";
import {
  useTenantMembersAssignTenantMemberRoles,
  useTenantMembersChangeTenantUserStatus,
  useTenantMembersCreateTenantUser,
  useTenantMembersDeleteTenantUser,
  useTenantMembersGetTenantUser,
  useTenantMembersInviteTenantUser,
  useTenantMembersListTenantUsers,
  useTenantMembersUpdateTenantUser,
} from "../api/endpoints/tenant-members/tenant-members";
import type {
  CreateSysUserRequest,
  TenantMemberStatus,
  UpdateSysUserRequest,
} from "../api/endpoints/title.schemas";
import Button from "../components/ui/button.vue";
import Card from "../components/ui/card.vue";
import CardContent from "../components/ui/card-content.vue";
import CardHeader from "../components/ui/card-header.vue";
import CardTitle from "../components/ui/card-title.vue";
import Table from "../components/ui/table.vue";
import TableBody from "../components/ui/table-body.vue";
import TableCell from "../components/ui/table-cell.vue";
import TableHead from "../components/ui/table-head.vue";
import TableHeader from "../components/ui/table-header.vue";
import TableRow from "../components/ui/table-row.vue";
import PageHeader from "../components/app/page-header.vue";
import StatusBadge from "../components/app/status-badge.vue";
import ConfirmDialog from "../components/app/confirm-dialog.vue";
import CrudDialog from "../components/app/crud-dialog.vue";
import type { FieldDef } from "../components/app/crud-dialog.vue";
import { toApiError } from "../api/http-client";
import { toast } from "vue-sonner";
import { useTenantStore } from "../state/tenant-store";

// 含 2：分页行为断言需要「每页 2 条」档（tenant1 种子 3 人 → 首页 2 行 + 第 2 页 1 行）
const PAGE_SIZES = [2, 5, 10, 20];

/** ADR-0029 双形态兼容：嵌套 TenantMemberView（aspnetcore）/扁平 User（msw/nextjs）统一归一化。
 *  状态取生成 TenantMemberStatus（active|invited|suspended|disabled）。 */
interface MemberUserRow {
  id: string;
  username: string;
  email: string;
  mobile?: string;
  status: TenantMemberStatus;
  roleIds?: string[];
}
function normalizeMemberRow(raw: unknown): MemberUserRow {
  const r = raw as Record<string, unknown>;
  if (r.member && r.user) {
    const member = r.member as { id: string; status?: TenantMemberStatus };
    const user = r.user as {
      id: string;
      username: string;
      email: string;
      mobile?: string;
      status?: TenantMemberStatus;
    };
    const status = (member.status ?? user.status ?? "active") as TenantMemberStatus;
    return {
      id: user.id ?? member.id,
      username: user.username,
      email: user.email,
      mobile: user.mobile,
      status,
      roleIds: (r.roles as string[] | undefined) ?? [],
    };
  }
  return r as unknown as MemberUserRow;
}

// 创建走契约 CreateSysUserRequest {username, password, email?, mobile?}——status
// 不在 create body（成员初始态由后端定），状态变更走 changeTenantUserStatus。
// 角色不在 create body（契约无 roleIds）——勾选项在创建成功后二步走 assignRoles。
const CREATE_FIELDS: FieldDef[] = [
  { name: "username", label: "用户名", required: true, placeholder: "alice" },
  { name: "password", label: "初始密码", required: true, placeholder: "至少 8 位" },
  { name: "email", label: "邮箱", required: true, placeholder: "alice@acme.io" },
];
const CREATE_ROLE_FIELD: FieldDef = { name: "roleIds", label: "角色（多选）" };

// 编辑只走契约 UpdateSysUserRequest {email?, mobile?}——status 已移出编辑弹窗，
// 独立启停走行内按钮 + changeTenantUserStatus（I08）。
const EDIT_FIELDS: FieldDef[] = [
  { name: "email", label: "邮箱", required: true, placeholder: "alice@acme.io" },
  { name: "mobile", label: "手机号", placeholder: "13800000000" },
];

// 邀请（I06）：契约 tenantMembersInviteTenantUser {email?, mobile?}——后端语义=
// 新建 status=invited 的 sys_user、username 取邮箱前缀，响应无邀请链接展示面。
const INVITE_FIELDS: FieldDef[] = [
  { name: "email", label: "邮箱", required: true, placeholder: "ivy@acme.io" },
  { name: "mobile", label: "手机号", placeholder: "13800000000" },
];

const route = useRoute();
const tenantStore = useTenantStore();
const tenantId = computed(() => String(route.params.tenantId ?? ""));
// 租户名走 GET /api/v1/admin/tenants/:id，加载中/失败显示「租户未知」。
// 集中到 tenant-store.tenantFor()，缓存交给 vue-query。
const tenant = tenantStore.tenantFor(tenantId);
const tenantLabel = computed(() => {
  return tenant.value ? `租户 ${tenant.value.name}（${tenant.value.tenantKey}）` : "租户未知";
});

// I01 分页 + 状态过滤（page 0-based，家族约定 page=0/ps=20）；过滤/翻页变更回第 1 页。
const statusFilter = ref<TenantMemberStatus | "">("");
const page = ref(0);
const pageSize = ref(20);
const listParams = computed(() => ({
  page: page.value,
  pageSize: pageSize.value,
  ...(statusFilter.value ? { status: statusFilter.value } : {}),
}));

const usersQ = useTenantMembersListTenantUsers(tenantId, listParams);
const rolesQ = useTenantRolesListSysRoles(tenantId);
const createMut = useTenantMembersCreateTenantUser();
const inviteMut = useTenantMembersInviteTenantUser();
const updateMut = useTenantMembersUpdateTenantUser();
// 状态走专用端点（TenantMembersChangeTenantUserStatusBody.status = TenantMemberStatus）
const statusMut = useTenantMembersChangeTenantUserStatus();
const deleteMut = useTenantMembersDeleteTenantUser();
const roleAssignMut = useTenantMembersAssignTenantMemberRoles();

const users = computed<MemberUserRow[]>(() =>
  ((usersQ.data.value?.data?.items ?? []) as unknown as MemberUserRow[]).map(normalizeMemberRow),
);
const total = computed(() => usersQ.data.value?.data?.total ?? 0);
const roles = computed(() => rolesQ.data.value?.data?.items ?? []);

const createOpen = ref(false);
const inviteOpen = ref(false);
const editTarget = ref<MemberUserRow | null>(null);
const deleteTarget = ref<MemberUserRow | null>(null);
const roleTarget = ref<MemberUserRow | null>(null);
const detailTarget = ref<MemberUserRow | null>(null);
const statusTarget = ref<MemberUserRow | null>(null);

// I03 详情：GetTenantUser 完整信息（TenantMemberUserView），只读展示。
// userId 空串时生成 hook 的 enabled（!!tenantId && !!userId）自动关闸。
const detailQ = useTenantMembersGetTenantUser(
  tenantId,
  computed(() => detailTarget.value?.id ?? ""),
);
const detail = computed(() => detailQ.data.value?.data ?? null);
const detailRoleText = computed(() => {
  const d = detail.value;
  if (!d) return "加载中…";
  return (
    (d.roleIds ?? [])
      .map((id) => roles.value.find((r) => r.id === id)?.roleCode)
      .filter(Boolean)
      .join("、") || "—"
  );
});

function onFilterChange() {
  page.value = 0;
}

async function onCreate(values: Record<string, unknown>) {
  const roleIds = Array.isArray(values.roleIds) ? (values.roleIds as string[]) : [];
  try {
    const res = await createMut.mutateAsync({
      tenantId: tenantId.value,
      data: {
        username: String(values.username ?? "").trim(),
        password: String(values.password ?? ""),
        email: (values.email as string) || undefined,
      } as CreateSysUserRequest,
    });
    if (roleIds.length > 0) {
      await roleAssignMut.mutateAsync({
        tenantId: tenantId.value,
        userId: res.data.id,
        data: { roleIds },
      });
    }
    createOpen.value = false;
    usersQ.refetch();
    toast.success("用户已创建");
  } catch (err) {
    toast.error(`创建失败：${toApiError(err).message}`);
  }
}

async function onInvite(values: Record<string, unknown>) {
  try {
    await inviteMut.mutateAsync({
      tenantId: tenantId.value,
      data: {
        email: (values.email as string) || undefined,
        mobile: (values.mobile as string) || undefined,
      },
    });
    inviteOpen.value = false;
    usersQ.refetch();
    toast.success("邀请已发送");
  } catch (err) {
    toast.error(`邀请失败：${toApiError(err).message}`);
  }
}

async function onUpdate(values: Record<string, unknown>) {
  if (!editTarget.value) return;
  try {
    // 5.13-①（2026-09-20 人裁）：编辑弹窗只走契约 UpdateSysUserRequest
    // { email, mobile }；status 已移出编辑弹窗，独立启停走 I08 行内按钮。
    await updateMut.mutateAsync({
      tenantId: tenantId.value,
      userId: editTarget.value.id,
      data: {
        email: values.email as string,
        mobile: (values.mobile as string) || undefined,
      } as UpdateSysUserRequest,
    });
    editTarget.value = null;
    usersQ.refetch();
    toast.success("用户已更新");
  } catch (err) {
    toast.error(`更新失败：${toApiError(err).message}`);
  }
}

async function onAssignRoles(values: Record<string, unknown>) {
  if (!roleTarget.value) return;
  const roleIds = Array.isArray(values.roleIds) ? (values.roleIds as string[]) : [];
  try {
    await roleAssignMut.mutateAsync({
      tenantId: tenantId.value,
      userId: roleTarget.value.id,
      data: { roleIds },
    });
    roleTarget.value = null;
    usersQ.refetch();
    toast.success("角色已分配");
  } catch (err) {
    toast.error(`角色分配失败：${toApiError(err).message}`);
  }
}

async function confirmDelete() {
  if (!deleteTarget.value) return;
  try {
    await deleteMut.mutateAsync({ tenantId: tenantId.value, userId: deleteTarget.value.id });
    deleteTarget.value = null;
    usersQ.refetch();
    toast.success("用户已删除");
  } catch (err) {
    toast.error(`删除失败：${toApiError(err).message}`);
  }
}

async function confirmStatus() {
  if (!statusTarget.value) return;
  try {
    await statusMut.mutateAsync({
      tenantId: tenantId.value,
      userId: statusTarget.value.id,
      data: { status: statusTarget.value.status === "active" ? "suspended" : "active" },
    });
    statusTarget.value = null;
    usersQ.refetch();
  } catch (err) {
    toast.error(`状态变更失败：${toApiError(err).message}`);
  }
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="用户管理" :description="`${tenantLabel} 的所有用户`">
      <template #actions>
        <div class="flex items-center gap-2">
          <Button variant="outline" data-fn="M00.F02.I06" @click="inviteOpen = true">
            邀请成员
          </Button>
          <Button data-fn="M01.F04.I03" @click="createOpen = true">创建成员</Button>
        </div>
      </template>
    </PageHeader>
    <Card>
      <CardHeader>
        <CardTitle data-testid="user-total">用户列表 (共 {{ total }} 人)</CardTitle>
        <div class="flex items-center gap-2">
          <select
            v-model="statusFilter"
            aria-label="状态过滤"
            class="border rounded px-2 py-1 text-sm"
            @change="onFilterChange"
          >
            <option value="">全部状态</option>
            <option value="active">启用</option>
            <option value="invited">已邀请</option>
            <option value="suspended">暂停</option>
            <option value="disabled">停用</option>
          </select>
          <select
            v-model="pageSize"
            aria-label="每页"
            class="border rounded px-2 py-1 text-sm"
            @change="onFilterChange"
          >
            <option v-for="n in PAGE_SIZES" :key="n" :value="n">{{ n }} 条/页</option>
          </select>
        </div>
      </CardHeader>
      <CardContent class="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>用户名</TableHead>
              <TableHead>邮箱</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>角色</TableHead>
              <TableHead class="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="u in users" :key="u.id" data-testid="user-row">
              <TableCell class="font-medium">{{ u.username }}</TableCell>
              <TableCell class="text-slate-500">{{ u.email }}</TableCell>
              <TableCell>
                <StatusBadge :status="u.status" />
              </TableCell>
              <TableCell>
                <span class="text-xs text-slate-500">{{ (u.roleIds ?? []).length }} 项</span>
              </TableCell>
              <TableCell class="text-right space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  data-fn="M00.F02.I03"
                  @click="() => (detailTarget = u)"
                >
                  详情
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  data-fn="M01.F02.I01"
                  @click="() => (roleTarget = u)"
                >
                  分配角色
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  data-fn="M00.F02.I04"
                  @click="() => (editTarget = u)"
                >
                  编辑
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  data-fn="M00.F02.I08"
                  @click="() => (statusTarget = u)"
                >
                  {{ u.status === "active" ? "停用" : "启用" }}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  data-fn="M00.F02.I05"
                  class="text-red-600 hover:text-red-700"
                  @click="() => (deleteTarget = u)"
                >
                  删除
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
      <div class="flex items-center justify-between px-6 py-3 text-sm">
        <span data-testid="user-page-indicator">第 {{ page + 1 }} 页</span>
        <div class="space-x-2">
          <Button variant="outline" size="sm" :disabled="page === 0" @click="page--">
            上一页
          </Button>
          <Button
            variant="outline"
            size="sm"
            :disabled="(page + 1) * pageSize >= total"
            @click="page++"
          >
            下一页
          </Button>
        </div>
      </div>
    </Card>

    <CrudDialog
      :open="createOpen"
      @update:open="(v) => (createOpen = v)"
      title="创建成员"
      description="向租户添加一个新用户（契约 CreateSysUserRequest：用户名 + 初始密码 + 邮箱；角色创建后二步绑定）。"
      :fields="[...CREATE_FIELDS, CREATE_ROLE_FIELD]"
      :initial-values="{ roleIds: [] }"
      :render-field-names="['roleIds']"
      submit-text="创建"
      :loading="createMut.isPending.value || roleAssignMut.isPending.value"
      @submit="onCreate"
    >
      <template #field.roleIds="{ value, onChange }">
        <div class="space-y-1 max-h-48 overflow-y-auto border rounded p-2">
          <div v-if="roles.length === 0" class="text-xs text-slate-400">暂无角色</div>
          <label v-for="r in roles" :key="r.id" class="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              :checked="Array.isArray(value) && value.includes(r.id)"
              class="h-4 w-4"
              @change="
                (e) => {
                  const next = new Set(Array.isArray(value) ? value : []);
                  if ((e.target as HTMLInputElement).checked) next.add(r.id);
                  else next.delete(r.id);
                  onChange(Array.from(next));
                }
              "
            />
            <span class="font-mono text-xs">{{ r.roleCode }}</span>
            <span>{{ r.roleName }}</span>
          </label>
        </div>
      </template>
    </CrudDialog>

    <CrudDialog
      :open="inviteOpen"
      @update:open="(v) => (inviteOpen = v)"
      title="邀请成员"
      description="发送邀请（后端语义：新建 status=invited 的成员，username 取邮箱前缀；无邀请链接展示面）。"
      :fields="INVITE_FIELDS"
      submit-text="发送邀请"
      :loading="inviteMut.isPending.value"
      @submit="onInvite"
    />

    <CrudDialog
      :open="editTarget !== null"
      @update:open="(v) => !v && (editTarget = null)"
      title="编辑用户"
      :fields="EDIT_FIELDS"
      :initial-values="
        editTarget ? { email: editTarget.email, mobile: editTarget.mobile ?? '' } : undefined
      "
      :loading="updateMut.isPending.value"
      @submit="onUpdate"
    />

    <CrudDialog
      :open="roleTarget !== null"
      @update:open="(v) => !v && (roleTarget = null)"
      :title="`分配角色：${roleTarget?.username ?? ''}`"
      :fields="[
        {
          name: 'roleIds',
          label: '角色（多选）',
          type: 'select',
          options: roles.map((r) => ({ value: r.id, label: `${r.roleCode} · ${r.roleName}` })),
        },
      ]"
      submit-text="保存角色"
      :loading="roleAssignMut.isPending.value"
      :initial-values="roleTarget ? { roleIds: roleTarget.roleIds ?? [] } : undefined"
      :render-field-names="['roleIds']"
      @submit="onAssignRoles"
    >
      <template #field.roleIds="{ value, onChange }">
        <div class="space-y-1 max-h-48 overflow-y-auto border rounded p-2">
          <div v-if="roles.length === 0" class="text-xs text-slate-400">暂无角色</div>
          <label v-for="r in roles" :key="r.id" class="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              :checked="Array.isArray(value) && value.includes(r.id)"
              class="h-4 w-4"
              @change="
                (e) => {
                  const next = new Set(Array.isArray(value) ? value : []);
                  if ((e.target as HTMLInputElement).checked) next.add(r.id);
                  else next.delete(r.id);
                  onChange(Array.from(next));
                }
              "
            />
            <span class="font-mono text-xs">{{ r.roleCode }}</span>
            <span>{{ r.roleName }}</span>
          </label>
        </div>
      </template>
    </CrudDialog>

    <!-- I03 成员详情：reka Dialog 只读展示（契约 TenantMemberUserView 完整信息） -->
    <DialogRoot :open="detailTarget !== null" @update:open="(v) => !v && (detailTarget = null)">
      <DialogPortal>
        <DialogOverlay class="fixed inset-0 z-50 bg-black/80" />
        <DialogContent
          data-testid="member-detail-dialog"
          class="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg"
        >
          <div class="flex flex-col space-y-1.5">
            <DialogTitle class="text-lg font-semibold leading-none tracking-tight">
              成员详情：{{ detail?.username ?? detailTarget?.username ?? "" }}
            </DialogTitle>
            <DialogDescription class="text-sm text-muted-foreground">
              契约 TenantMemberUserView 完整信息（只读）。
            </DialogDescription>
          </div>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between gap-4">
              <span class="text-slate-500">用户名</span>
              <span>{{ detail?.username ?? detailTarget?.username ?? "—" }}</span>
            </div>
            <div class="flex justify-between gap-4">
              <span class="text-slate-500">邮箱</span>
              <span>{{ detail?.email ?? detailTarget?.email ?? "—" }}</span>
            </div>
            <div class="flex justify-between gap-4">
              <span class="text-slate-500">手机号</span>
              <span>{{ detailTarget?.mobile ?? "—" }}</span>
            </div>
            <div class="flex justify-between gap-4">
              <span class="text-slate-500">状态</span>
              <StatusBadge :status="(detail?.status ?? detailTarget?.status)!" />
            </div>
            <div class="flex justify-between gap-4">
              <span class="text-slate-500">所属租户</span>
              <span class="font-mono text-xs">{{ detail?.tenantId ?? tenantId }}</span>
            </div>
            <div class="flex justify-between gap-4">
              <span class="text-slate-500">角色</span>
              <span>{{ detailRoleText }}</span>
            </div>
            <div class="flex justify-between gap-4">
              <span class="text-slate-500">创建时间</span>
              <span>{{ detail?.createdAt ?? "—" }}</span>
            </div>
            <div class="flex justify-between gap-4">
              <span class="text-slate-500">更新时间</span>
              <span>{{ detail?.updatedAt ?? "—" }}</span>
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>

    <ConfirmDialog
      :open="deleteTarget !== null"
      @update:open="(v) => !v && (deleteTarget = null)"
      :title="`删除用户「${deleteTarget?.username ?? ''}」？`"
      description="用户删除后不可恢复，已分配的关联角色也会一并解除。"
      confirm-text="删除"
      destructive
      :loading="deleteMut.isPending.value"
      @confirm="confirmDelete"
    />

    <!-- I08 独立启停：文案随状态取反（active→停用为 suspended，否则启用回 active） -->
    <ConfirmDialog
      :open="statusTarget !== null"
      @update:open="(v) => !v && (statusTarget = null)"
      :title="`确认${statusTarget?.status === 'active' ? '停用' : '启用'}「${statusTarget?.username ?? ''}」？`"
      :description="
        statusTarget?.status === 'active'
          ? '停用后该成员将无法登录本租户。'
          : '启用后该成员恢复登录本租户。'
      "
      confirm-text="确认"
      :loading="statusMut.isPending.value"
      @confirm="confirmStatus"
    />
  </div>
</template>
