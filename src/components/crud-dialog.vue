<template>
  <Teleport to="body">
    <div
      v-if="open"
      style="
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      "
      @click.self="cancel"
    >
      <div
        style="
          background: #fff;
          padding: 24px;
          border-radius: 8px;
          min-width: 360px;
          max-width: 560px;
          max-height: 80vh;
          overflow-y: auto;
        "
        role="dialog"
        aria-modal="true"
      >
        <h3 style="margin-top: 0">{{ title }}</h3>
        <p v-if="description" style="color: #666; margin-bottom: 16px">{{ description }}</p>
        <form @submit.prevent="submit">
          <div
            v-for="f in fields"
            :key="f.name"
            style="margin-bottom: 12px"
          >
            <label :for="`crud-field-${f.name}`" style="display: block; font-size: 13px; margin-bottom: 4px">
              {{ f.label }}
              <span v-if="f.required" style="color: #c00">*</span>
            </label>
            <textarea
              v-if="f.type === 'textarea'"
              :id="`crud-field-${f.name}`"
              :value="String(values[f.name] ?? '')"
              :placeholder="f.placeholder"
              @input="setField(f.name, ($event.target as HTMLTextAreaElement).value)"
              style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px"
            />
            <select
              v-else-if="f.type === 'select' && f.options"
              :id="`crud-field-${f.name}`"
              :value="String(values[f.name] ?? '')"
              @change="setField(f.name, ($event.target as HTMLSelectElement).value)"
              style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px"
            >
              <option value="" disabled>{{ f.placeholder ?? "请选择" }}</option>
              <option v-for="o in f.options" :key="o.value" :value="o.value">
                {{ o.label }}
              </option>
            </select>
            <label v-else-if="f.type === 'checkbox'" style="display: inline-flex; align-items: center; gap: 8px">
              <input
                :id="`crud-field-${f.name}`"
                type="checkbox"
                :checked="Boolean(values[f.name])"
                @change="setField(f.name, ($event.target as HTMLInputElement).checked)"
              />
              <span v-if="f.hint" style="font-size: 12px; color: #666">{{ f.hint }}</span>
            </label>
            <input
              v-else
              :id="`crud-field-${f.name}`"
              :type="f.type ?? 'text'"
              :value="String(values[f.name] ?? '')"
              :placeholder="f.placeholder"
              @input="
                setField(
                  f.name,
                  f.type === 'number'
                    ? Number(($event.target as HTMLInputElement).value)
                    : ($event.target as HTMLInputElement).value,
                )
              "
              style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px"
            />
          </div>
          <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px">
            <button
              type="button"
              @click="cancel"
              :disabled="loading"
              style="padding: 6px 12px"
              data-fn="crud.cancel"
            >
              {{ cancelText }}
            </button>
            <button
              type="submit"
              :disabled="loading"
              style="padding: 6px 12px; background: #1f2937; color: #fff; border: 0; border-radius: 4px"
              data-fn="crud.submit"
            >
              {{ loading ? "提交中…" : submitText }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { reactive, watch } from "vue";

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

const props = withDefaults(
  defineProps<{
    open: boolean;
    title: string;
    description?: string;
    fields: FieldDef[];
    initialValues?: Record<string, FieldValue>;
    submitText?: string;
    cancelText?: string;
    loading?: boolean;
  }>(),
  { submitText: "保存", cancelText: "取消", loading: false },
);

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

// open 重新打开时重置 values
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) initValues();
  },
  { immediate: true },
);

function setField(name: string, value: FieldValue) {
  values[name] = value;
}

function cancel() {
  emit("update:open", false);
}

async function submit() {
  emit("submit", { ...values });
}
</script>