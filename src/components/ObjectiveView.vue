<script setup lang="ts">
import { computed, inject, ref } from 'vue'

const selectedObjective = inject<Ref<string>>('selectedObjective')!
const objectiveType = inject<Ref<string>>('objectiveType')!
const formula = inject<Ref<string>>('formula')!
const customFunctions = inject<Ref<Array<{ formula: string }>>>('customFunctions')!

const numberOfWells = inject<Readonly<Ref<number>>>('numberOfWells')!
const selectedWells = inject<Ref<number[]>>('selectedWells', ref([]))
const isWellSelected = inject<(wellIndex: number) => boolean>('isWellSelected', (wellIndex: number) => false)

const objectives = [
  'Minimum Length',
  'Custom Function'
]

const isCustomObjective = computed(() => selectedObjective.value === 'Custom Function')
const showTable = computed(() => isCustomObjective.value && objectiveType.value === 'specify')

// 注入Select Wells启用状态
const selectWellsEnabled = inject<Ref<boolean>>('selectWellsEnabled', ref(false))
</script>

<template>
  <div class="p-6 space-y-6 max-h-[calc(100vh-500px)] overflow-y-auto">
    <!-- Objective Selection -->
    <div class="flex items-center space-x-2">
      <span class="text-base">Objective:</span>
      <select
        v-model="selectedObjective"
        class="border rounded px-3 py-1.5 bg-white min-w-[200px]"
      >
        <option v-for="obj in objectives" :key="obj" :value="obj">
          {{ obj }}
        </option>
      </select>
    </div>

    <!-- Radio Buttons -->
    <div class="flex space-x-8">
      <label class="flex items-center space-x-2">
        <input
          type="radio"
          :disabled="!isCustomObjective"
          v-model="objectiveType"
          value="unify"
          class="text-blue-600"
          :class="{ 'opacity-50 cursor-not-allowed': !isCustomObjective }"
        >
        <span>Unify</span>
      </label>
      <label class="flex items-center space-x-2">
        <input
          type="radio"
          :disabled="!isCustomObjective"
          v-model="objectiveType"
          value="specify"
          class="text-blue-600"
          :class="{ 'opacity-50 cursor-not-allowed': !isCustomObjective }"
        >
        <span>Specify</span>
      </label>
    </div>

    <!-- Formula Section -->
    <div class="space-y-4">
      <div class="font-serif italic">f(Ls, theta, Lc) =</div>
      <input v-if="!showTable"
        type="text"
        v-model="formula"
        :readonly="!isCustomObjective || objectiveType === 'specify'"
        class="w-full border rounded px-3 py-2"
        :class="{ 'bg-gray-50 cursor-not-allowed': !isCustomObjective || objectiveType === 'specify' }"
        placeholder="Enter formula"
      >
      <div v-else class="border rounded">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-gray-50 border-b">
              <th class="w-12 py-2 px-2 text-center font-medium border-r">#</th>
              <th class="py-2 px-2 text-center font-medium">custom function</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(func, index) in customFunctions" :key="index" class="border-b last:border-b-0" :class="{
                'selected-well-row': isWellSelected(index) && !selectWellsEnabled,
                'selected-well-row-orange': isWellSelected(index) && selectWellsEnabled
              }">
              <td class="py-1.5 px-2 border-r text-center">{{ index + 1 }}</td>
              <td class="py-1.5 px-2">
                <input
                  type="text"
                  v-model="func.formula"
                  class="w-full px-1.5 py-1 border rounded"
                >
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Variables Description -->
    <div class="space-y-2 font-serif">
      <div class="flex items-baseline space-x-2">
        <span class="italic">Ls :</span>
        <span>length of straight section, <span class="italic">m</span>.</span>
      </div>
      <div class="flex items-baseline space-x-2">
        <span class="italic">theta :</span>
        <span>inclination of straight section, <span class="italic">rad</span>.</span>
      </div>
      <div class="flex items-baseline space-x-2">
        <span class="italic">Lc :</span>
        <span>total length of curved sections, <span class="italic">m</span>.</span>
      </div>
    </div>

    <!-- Example Text -->
    <div class="pt-4 border-t">
      <p class="text-sm">
        e.g. <span class="italic">Ls + Lc</span> makes the Objective equivalent to Minimum Length.
      </p>
    </div>
  </div>
</template>

<style scoped>
/* 组件特定的样式可以在这里添加 */
</style>
