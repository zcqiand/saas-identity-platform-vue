<script setup lang="ts" generic="T extends Record<string, unknown>">
// 统一的数据表格。内建三态：loading 出骨架屏、空数据出 EmptyState、有数据出表。
// 每个列表页都走这里，禁止各自手写 <table> 和"加载中…"。

import { cn } from "../../lib/utils";
import Table from "../ui/table.vue";
import TableBody from "../ui/table-body.vue"
import TableCell from "../ui/table-cell.vue"
import TableHead from "../ui/table-head.vue"
import TableHeader from "../ui/table-header.vue"
import TableRow from "../ui/table-row.vue"
import Skeleton from "../ui/skeleton.vue";
import EmptyState from "empty-state.vue";

interface Column {
  header: string;
  key: keyof T | string;
  className?: string;
  headClassName?: string;
  cell?: (row: T) => unknown;
}

interface Props {
  columns: Column[];
  data: T[];
  loading?: boolean;
  rowKey: keyof T | ((row: T) => string | number);
  emptyTitle?: string;
  emptyDescription?: string;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  emptyTitle: "暂无数据",
});

function getCellValue(row: T, col: Column): unknown {
  if (col.cell) return col.cell(row);
  if (typeof col.key === "string") return row[col.key];
  return row[col.key];
}

function getRowKey(row: T): string | number {
  if (typeof props.rowKey === "function") return props.rowKey(row);
  return row[props.rowKey] as string | number;
}
</script>

<template>
  <div v-if="props.loading" class="rounded-lg border">
    <Table :class="props.class">
      <TableHeader>
        <TableRow>
          <TableHead v-for="(col, i) in props.columns" :key="i" :class="col.headClassName">
            {{ col.header }}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="r in 5" :key="r">
          <TableCell v-for="(_, c) in props.columns" :key="c">
            <Skeleton class="h-4 w-full" />
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>

  <EmptyState
    v-else-if="props.data.length === 0"
    :title="props.emptyTitle"
    :description="props.emptyDescription"
  >
    <template v-if="$slots.empty" #action>
      <slot name="empty" />
    </template>
  </EmptyState>

  <div v-else class="rounded-lg border">
    <Table :class="props.class">
      <TableHeader>
        <TableRow>
          <TableHead v-for="(col, i) in props.columns" :key="i" :class="col.headClassName">
            {{ col.header }}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="row in props.data" :key="getRowKey(row)" :class="'cursor-pointer'">
          <TableCell v-for="(col, i) in props.columns" :key="i" :class="col.className">
            {{ getCellValue(row, col) }}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>
