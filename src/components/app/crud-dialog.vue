<script setup lang="ts">
// 通用 CRUD Dialog（创建/编辑共用）
// 字段配置驱动（fields: FieldDef[]），统一提交/取消/loading。
// 弹窗内 form 标签 + 控件布局用 <Field> 包，子组件负责渲染控件。
// 通过 renderField(slot) 支持自定义字段渲染（多选 checkbox 列表等）。

import { reactive, watch } from "vue";
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "reka-ui";
import { X } from "lucide-vue-next";
import Button from "../ui/button.vue";
import Input from "../ui/input.vue";
import Textarea from "../ui/textarea.vue";
import SelectField from "../ui/select.vue";
import Checkbox from "../ui/checkbox.vue";
import FieldComp from "./field.vue";

export type FieldValue = string | number | boolean | string[] | undefined | null;

export interface FieldDef {
  name: string;
  label: string;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  type?: "text" | "number" | "textarea" | "select" | "checkbox";
  options?: Array<{ value: string; label: string }>;
  defaultValue?: FieldValue;
}

interface Props {
  open: boolean;
  title: string;
  description?: string;
  fields: FieldDef[];
  initialValues?: Record<string, FieldValue>;
  submitText?: string;
  cancelText?: string;
  loading?: boolean;
  /** 字段名 → 用这个 slot 自定义渲染；不传则用默认控件类型 */
  renderFieldNames?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  submitText: "保存",
  cancelText: "取消",
  loading: false,
  renderFieldNames: () => [],
});

const emit = defineEmits<{
  "update:open": [value: boolean];
  submit: [values: Record<string, FieldValue>];
}>();

const values = reactive<Record<string, FieldValue>>({});

function initValues() {
  for (const f of props.fields) {
    values[f.name] = props.initialValues?.[f.name] ?? f.defaultValue ?? "";
  }
}

watch(
  () => props.open,
  (open) => {
    if (open) initValues();
  },
  { immediate: true },
);

function setField(name: string, value: FieldValue) {
  values[name] = value;
}

function handleSubmit(e: Event) {
  e.preventDefault();
  emit("submit", { ...values });
}

function handleCancel() {
  emit("update:open", false);
}

function shouldRender(name: string): boolean {
  return props.renderFieldNames.includes(name);
}
</script>

<template>
  <DialogRoot :open="props.open" @update:open="(v) => emit('update:open', v)">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-50 bg-black/80" />
      <DialogContent
        class="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg"
      >
        <form class="space-y-4" @submit="handleSubmit">
          <div class="flex flex-col space-y-1.5">
            <DialogTitle class="text-lg font-semibold leading-none tracking-tight">
              {{ props.title }}
            </DialogTitle>
            <DialogDescription v-if="props.description" class="text-sm text-muted-foreground">
              {{ props.description }}
            </DialogDescription>
          </div>

          <div class="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            <FieldComp
              v-for="f in props.fields"
              :key="f.name"
              :label="f.label"
              :html-for="`crud-field-${f.name}`"
              :required="f.required"
              :hint="f.hint"
            >
              <!-- 自定义 slot 优先：caller 传了 renderFieldNames 包含本字段时用 slot 渲染 -->
              <slot
                v-if="shouldRender(f.name)"
                :name="`field.${f.name}`"
                :field="f"
                :value="values[f.name]"
                :onChange="(v: FieldValue) => setField(f.name, v)"
              />
              <template v-else-if="f.type === 'textarea'">
                <Textarea
                  :id="`crud-field-${f.name}`"
                  :model-value="String(values[f.name] ?? '')"
                  :placeholder="f.placeholder"
                  @update:model-value="(v) => setField(f.name, v)"
                />
              </template>
              <template v-else-if="f.type === 'select' && f.options">
                <SelectField
                  :id="`crud-field-${f.name}`"
                  :model-value="String(values[f.name] ?? '')"
                  :items="f.options"
                  :placeholder="f.placeholder ?? '请选择'"
                  @update:model-value="(v) => setField(f.name, v)"
                />
              </template>
              <template v-else-if="f.type === 'checkbox'">
                <div class="flex items-center gap-2">
                  <Checkbox
                    :id="`crud-field-${f.name}`"
                    :model-value="Boolean(values[f.name])"
                    @update:model-value="(v) => setField(f.name, v)"
                  />
                  <span v-if="f.hint" class="text-sm text-slate-600">{{ f.hint }}</span>
                </div>
              </template>
              <template v-else>
                <Input
                  :id="`crud-field-${f.name}`"
                  :type="f.type ?? 'text'"
                  :model-value="String(values[f.name] ?? '')"
                  :placeholder="f.placeholder"
                  @update:model-value="(v) => setField(f.name, f.type === 'number' ? Number(v) : v)"
                />
              </template>
            </FieldComp>
          </div>

          <div class="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <Button
              type="button"
              variant="ghost"
              :disabled="props.loading"
              @click="handleCancel"
              data-fn="crud.cancel"
            >
              {{ props.cancelText }}
            </Button>
            <Button type="submit" :disabled="props.loading" data-fn="crud.submit">
              {{ props.loading ? "提交中…" : props.submitText }}
            </Button>
          </div>
        </form>

        <DialogClose
          class="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
        >
          <X class="h-4 w-4" />
          <span class="sr-only">关闭</span>
        </DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
