<script setup lang="ts">
import type { AppIconProps } from '../../types/components';
defineProps<AppIconProps>();
const paths = {
  add: 'M12 5v14M5 12h14',
  invitation: 'M4 5h16v14H4zM4 6l8 6 8-6',
  'open-invitation': 'M4 9v11h16V9L12 3 4 9Zm0 0 8 6 8-6M4 20l6-6M20 20l-6-6',
  'chevron-up': 'm7 14 5-5 5 5',
  'chevron-down': 'm7 10 5 5 5-5',
  refresh:
    'M20 7v5h-5M4 17v-5h5M5 8a8 8 0 0 1 13-3l2 3M4 16l2 3a8 8 0 0 0 13-3',
  back: 'm12 5-7 7 7 7M5 12h15',
  accept: 'm5 12 4 4L19 6',
  decline: 'm6 6 12 12M18 6 6 18',
  'empty-invitation': 'M8 12h32v24H8zM8 14l16 12 16-12',
  games: 'M4 4h16v16H4zM4 12h16M12 4v16',
  settings:
    'm10 2-.6 2.5-2 .9-2.4-.7-2 3.5 1.8 1.8v2L3 13.8l2 3.5 2.4-.7 2 .9.6 2.5h4l.6-2.5 2-.9 2.4.7 2-3.5-1.8-1.8v-2L21 8.2l-2-3.5-2.4.7-2-.9L14 2Z',
};
</script>
<template>
  <svg
    :class="name === 'empty-invitation' ? 'chess-empty-icon' : 'chess-icon'"
    :viewBox="name === 'empty-invitation' ? '0 0 48 48' : '0 0 24 24'"
    aria-hidden="true"
  >
    <circle v-if="name === 'settings'" cx="12" cy="12" r="3" />
    <path :d="paths[name]" />
    <path
      v-if="name === 'games'"
      d="M4 4h8v8H4zM12 12h8v8h-8z"
      fill="currentColor"
      stroke="none"
    />
  </svg>
</template>

<style>
.chess-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.chess-empty-icon {
  width: 64px;
  height: 64px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
