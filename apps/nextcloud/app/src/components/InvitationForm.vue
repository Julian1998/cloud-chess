<script setup lang="ts">
import { ref } from 'vue';
import NcButton from '@nextcloud/vue/components/NcButton';
import type {
  ApiClient,
  ColorPreference,
  CreateInvitation,
  TurnDuration,
  User,
} from '../api';
import UserSearch from './UserSearch.vue';

const props = defineProps<{
  api: ApiClient;
  onCreate: (data: CreateInvitation) => Promise<boolean>;
}>();
const query = ref('');
const selectedUser = ref<User | null>(null);
const selectedSearch = ref('');
const colorPreference = ref<ColorPreference>('random');
const turnDuration = ref<TurnDuration>('P1D');
const submitting = ref(false);
const colors = [
  ['white', '○', 'Weiß'],
  ['random', '◐', 'Zufall'],
  ['black', '●', 'Schwarz'],
] as const;
const durations = [
  ['P1D', '1 Tag'],
  ['P2D', '2 Tage'],
] as const;

function select(user: User) {
  selectedSearch.value = query.value.trim();
  selectedUser.value = user;
  query.value = user.displayName;
}

function change(value: string) {
  query.value = value;
  selectedUser.value = null;
}

async function submit() {
  if (!selectedUser.value || submitting.value) return;
  submitting.value = true;
  try {
    const created = await props.onCreate({
      opponentId: selectedUser.value.id,
      opponentSearch: selectedSearch.value,
      colorPreference: colorPreference.value,
      turnDuration: turnDuration.value,
    });
    if (created) {
      query.value = '';
      selectedUser.value = null;
      selectedSearch.value = '';
    }
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <section class="cc-panel cc-compose" aria-labelledby="cc-compose-title">
    <div class="cc-panel__heading">
      <span class="cc-panel__number" aria-hidden="true">01</span>
      <div>
        <h2 id="cc-compose-title">Neue Einladung</h2>
        <p>Wähle Mitspieler und Bedenkzeit.</p>
      </div>
    </div>
    <form @submit.prevent="submit">
      <UserSearch
        :api="api"
        :query="query"
        :selected-user="selectedUser"
        @update:query="change"
        @select="select"
      />
      <fieldset class="cc-fieldset">
        <legend>Deine Wunschfarbe</legend>
        <div class="cc-segments">
          <label v-for="[value, icon, label] in colors" :key="value">
            <input
              v-model="colorPreference"
              type="radio"
              name="color"
              :value="value"
            />
            <span aria-hidden="true">{{ icon }}</span
            >{{ label }}
          </label>
        </div>
      </fieldset>
      <fieldset class="cc-fieldset">
        <legend>Zeit pro Zug</legend>
        <div class="cc-segments cc-segments--two">
          <label v-for="[value, label] in durations" :key="value">
            <input
              v-model="turnDuration"
              type="radio"
              name="duration"
              :value="value"
            />{{ label }}
          </label>
        </div>
      </fieldset>
      <NcButton
        type="submit"
        variant="primary"
        :disabled="!selectedUser || submitting"
      >
        {{ submitting ? 'Wird gesendet …' : 'Einladung senden' }}
      </NcButton>
    </form>
  </section>
</template>
