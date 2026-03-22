<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from "vue";
import { formatCents } from "@pdv/shared";

const props = defineProps<{
  items: any[];
  selectedProductId: string | null;
  disabled: boolean;
}>();

const emit = defineEmits<{
  (e: "update:selectedProductId", id: string | null): void;
  (e: "increment", id: string): void;
  (e: "decrement", id: string): void;
  (e: "remove", id: string): void;
}>();

const selectedIndex = ref(-1);

watch(
  () => props.items.length,
  (newLength, oldLength) => {
    if (newLength > oldLength && newLength > 0) {
      selectedIndex.value = newLength - 1;
      emit("update:selectedProductId", props.items[selectedIndex.value].product_id);
    } else if (newLength < oldLength) {
      selectedIndex.value = Math.min(selectedIndex.value, newLength - 1);
      if (selectedIndex.value >= 0 && props.items[selectedIndex.value]) {
        emit("update:selectedProductId", props.items[selectedIndex.value].product_id);
      } else {
        emit("update:selectedProductId", null);
      }
    } else if (newLength === 0) {
      selectedIndex.value = -1;
      emit("update:selectedProductId", null);
    }
  }
);

watch(
  () => props.selectedProductId,
  (newId) => {
    if (!newId) {
      selectedIndex.value = -1;
      return;
    }
    const index = props.items.findIndex(i => i.product_id === newId);
    if (index !== -1) {
      selectedIndex.value = index;
    }
  }
);

function handleKeydown(event: KeyboardEvent) {
  if (props.disabled) return;

  const target = event.target as HTMLElement | null;
  const isTyping = target && ["input", "textarea", "select"].includes((target.tagName || "").toLowerCase());

  if (isTyping) return;

  if (event.key === "ArrowUp") {
    if (props.items.length > 0) {
      event.preventDefault();
      selectedIndex.value = Math.max(0, selectedIndex.value - 1);
      emit("update:selectedProductId", props.items[selectedIndex.value].product_id);
    }
    return;
  }

  if (event.key === "ArrowDown") {
    if (props.items.length > 0) {
      event.preventDefault();
      selectedIndex.value = selectedIndex.value === -1 ? 0 : Math.min(props.items.length - 1, selectedIndex.value + 1);
      emit("update:selectedProductId", props.items[selectedIndex.value].product_id);
    }
    return;
  }

  if (event.key === "+" || event.key === "Add") {
    if (selectedIndex.value >= 0 && selectedIndex.value < props.items.length) {
      event.preventDefault();
      emit("increment", props.items[selectedIndex.value].product_id);
    }
    return;
  }

  if (event.key === "-" || event.key === "Subtract") {
    if (selectedIndex.value >= 0 && selectedIndex.value < props.items.length) {
      event.preventDefault();
      emit("decrement", props.items[selectedIndex.value].product_id);
    }
    return;
  }

  if (event.key === "Delete") {
    if (selectedIndex.value >= 0 && selectedIndex.value < props.items.length) {
      event.preventDefault();
      emit("remove", props.items[selectedIndex.value].product_id);
    }
    return;
  }
}

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
});

function selectItem(productId: string) {
  emit("update:selectedProductId", productId);
}
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0 rounded-lg border border-slate-200 overflow-hidden">
    <!-- Tabela Desktop -->
    <div class="hidden h-full flex-1 flex-col overflow-y-auto overflow-x-auto md:flex">
      <table class="min-w-[640px] w-full text-sm">
        <caption class="sr-only">Itens adicionados no carrinho da venda atual</caption>
        <thead class="sticky top-0 bg-slate-100 text-left text-slate-700">
          <tr>
            <th scope="col" class="px-2 py-2">#</th>
            <th scope="col" class="px-2 py-2">Código</th>
            <th scope="col" class="px-2 py-2">Produto</th>
            <th scope="col" class="px-2 py-2">Qtd</th>
            <th scope="col" class="px-2 py-2">Valor Unit.</th>
            <th scope="col" class="px-2 py-2">Total Item</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(item, index) in items"
            :key="`${item.product_id}-${item.unit_price_cents}-${index}`"
            :class="[
              index === selectedIndex ? 'bg-primary/10 border-primary outline outline-2 outline-primary/50' : '',
              selectedProductId === item.product_id && index !== selectedIndex ? 'bg-primary/5 outline-2 outline-primary/30' : '',
              'border-t border-slate-200 cursor-pointer'
            ]"
            tabindex="0"
            @click="selectItem(item.product_id)"
            @keydown.enter="selectItem(item.product_id)"
          >
            <td class="px-2 py-2">{{ index + 1 }}</td>
            <td class="px-2 py-2">{{ item.product_barcode || "-" }}</td>
            <td class="px-2 py-2">
              <div>
                <span>{{ item.product_name }}</span>
                <span
                  v-if="item.product_description"
                  class="ml-1 cursor-help text-xs text-slate-500"
                  :title="item.product_description"
                >
                  ⓘ
                </span>
              </div>
            </td>
            <td class="px-2 py-2">
              <span class="font-medium text-slate-700">
                {{ item.is_bulk ? item.quantity.toFixed(3).replace('.', ',') : item.quantity }}
              </span>
            </td>
            <td class="px-2 py-2">{{ formatCents(item.unit_price_cents) }}</td>
            <td class="px-2 py-2">
              {{ formatCents((item.is_bulk ? (item.total_cents || 0) : (item.unit_price_cents * item.quantity)) - item.discount_cents) }}
            </td>
          </tr>
          <tr v-if="items.length === 0">
            <td colspan="6" class="px-3 py-6 text-center text-slate-500">
              Nenhum item no carrinho.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Lista Mobile -->
    <ul class="flex-1 overflow-y-auto divide-y divide-slate-100 md:hidden">
      <li
        v-for="(item, index) in items"
        :key="`${item.product_id}-${item.unit_price_cents}-${index}`"
        class="flex items-start justify-between gap-3 px-3 py-3"
        :class="{ 'bg-primary/5 ring-1 ring-inset ring-primary/20': selectedProductId === item.product_id }"
        @click="selectItem(item.product_id)"
      >
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium text-gray-800">{{ item.product_name }}</p>
          <p class="mt-0.5 text-xs text-gray-500">{{ item.product_barcode || '-' }}</p>
          <div class="mt-1.5 text-sm font-semibold text-gray-600">
            Qtd: {{ item.is_bulk ? item.quantity.toFixed(3).replace('.', ',') : item.quantity }}
          </div>
        </div>

        <div class="flex shrink-0 flex-col items-end gap-2">
          <span class="text-sm font-bold text-gray-900">
            {{ formatCents((item.is_bulk ? (item.total_cents || 0) : (item.unit_price_cents * item.quantity)) - item.discount_cents) }}
          </span>
          <span class="text-xs text-gray-400">
            {{ formatCents(item.unit_price_cents) }}
          </span>
        </div>
      </li>

      <li v-if="items.length === 0" class="px-4 py-8 text-center text-sm text-gray-400">
        Nenhum produto adicionado ainda.
      </li>
    </ul>
  </div>
</template>
