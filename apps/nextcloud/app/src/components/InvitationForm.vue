<script setup lang="ts">
import { t } from '@nextcloud/l10n';
import { ref } from 'vue';
import NcDialog from '@nextcloud/vue/components/NcDialog';
import NcButton from '@nextcloud/vue/components/NcButton';
import NcRadioGroup from '@nextcloud/vue/components/NcRadioGroup';
import NcRadioGroupButton from '@nextcloud/vue/components/NcRadioGroupButton';
import NcNoteCard from '@nextcloud/vue/components/NcNoteCard';
import NcLoadingIcon from '@nextcloud/vue/components/NcLoadingIcon';
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
  error: string | null;
}>();
const emit = defineEmits<{ close: [] }>();
const open = ref(true);
const query = ref('');
const selectedUser = ref<User | null>(null);
const selectedSearch = ref('');
const colorPreference = ref<ColorPreference>('random');
const turnDuration = ref<TurnDuration>('P1D');
const submitting = ref(false);
function select(user: User | null) {
  if (user) selectedSearch.value = query.value.trim();
  selectedUser.value = user;
}
async function submit() {
  if (!selectedUser.value || submitting.value) return;
  submitting.value = true;
  try {
    await props.onCreate({
      opponentId: selectedUser.value.id,
      opponentSearch: selectedSearch.value,
      colorPreference: colorPreference.value,
      turnDuration: turnDuration.value,
    });
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <NcDialog
    v-model:open="open"
    :name="t('cloud_chess', 'New game')"
    size="small"
    is-form
    :no-close="submitting"
    :close-on-click-outside="false"
    content-classes="cc-compose"
    @submit.prevent="submit"
    @update:open="!$event && emit('close')"
  >
    <p class="cc-compose-description">
      {{ t('cloud_chess', 'Choose a player and time per move.') }}
    </p>
    <UserSearch
      :api="api"
      :query="query"
      :selected-user="selectedUser"
      :disabled="submitting"
      @update:query="query = $event"
      @select="select"
    />
    <NcRadioGroup
      v-model="turnDuration"
      :label="t('cloud_chess', 'Time per move')"
    >
      <NcRadioGroupButton
        value="P1D"
        :label="t('cloud_chess', '1 day')"
        :disabled="submitting"
      />
      <NcRadioGroupButton
        value="P2D"
        :label="t('cloud_chess', '2 days')"
        :disabled="submitting"
      />
    </NcRadioGroup>
    <NcRadioGroup
      v-model="colorPreference"
      :label="t('cloud_chess', 'Your preferred color')"
    >
      <NcRadioGroupButton
        value="random"
        :label="t('cloud_chess', 'Random')"
        :disabled="submitting"
      />
      <NcRadioGroupButton
        value="white"
        :label="t('cloud_chess', 'White')"
        :disabled="submitting"
      />
      <NcRadioGroupButton
        value="black"
        :label="t('cloud_chess', 'Black')"
        :disabled="submitting"
      />
    </NcRadioGroup>
    <NcNoteCard v-if="error" type="error" show-alert :text="error" />
    <template #actions>
      <NcButton :disabled="submitting" @click="emit('close')">{{
        t('cloud_chess', 'Cancel')
      }}</NcButton>
      <NcButton
        type="submit"
        variant="primary"
        :disabled="!selectedUser || submitting"
      >
        <template v-if="submitting" #icon><NcLoadingIcon /></template>
        {{
          submitting
            ? t('cloud_chess', 'Sending …')
            : t('cloud_chess', 'Send invitation')
        }}
      </NcButton>
    </template>
  </NcDialog>
</template>
