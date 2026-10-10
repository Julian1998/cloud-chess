<script setup lang="ts">
import type {
  InvitationFormProps,
  InvitationFormEvents,
} from '../../types/components';
import { translate } from '../../platform/i18n';
import { ref } from 'vue';
import NcDialog from '@nextcloud/vue/components/NcDialog';
import NcButton from '@nextcloud/vue/components/NcButton';
import NcRadioGroup from '@nextcloud/vue/components/NcRadioGroup';
import NcRadioGroupButton from '@nextcloud/vue/components/NcRadioGroupButton';
import NcNoteCard from '@nextcloud/vue/components/NcNoteCard';
import NcLoadingIcon from '@nextcloud/vue/components/NcLoadingIcon';
import type { ApiClient } from '../../api';
import type {
  ColorPreference,
  CreateInvitation,
  TurnDuration,
  User,
} from '../../types/invitations';
import UserSearch from '../molecules/UserSearch.vue';

const props = defineProps<InvitationFormProps>();
const emit = defineEmits<InvitationFormEvents>();
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
    :name="translate('New game')"
    size="small"
    is-form
    :no-close="submitting"
    :close-on-click-outside="false"
    content-classes="chess-compose"
    @submit.prevent="submit"
    @update:open="!$event && emit('close')"
  >
    <p class="chess-compose-description">
      {{ translate('Choose a player and time per move.') }}
    </p>
    <UserSearch
      :api="api"
      :query="query"
      :selected-user="selectedUser"
      :disabled="submitting"
      @update:query="query = $event"
      @select="select"
    />
    <NcRadioGroup v-model="turnDuration" :label="translate('Time per move')">
      <NcRadioGroupButton
        value="P1D"
        :label="translate('1 day')"
        :disabled="submitting"
      />
      <NcRadioGroupButton
        value="P2D"
        :label="translate('2 days')"
        :disabled="submitting"
      />
    </NcRadioGroup>
    <NcRadioGroup
      v-model="colorPreference"
      :label="translate('Your preferred color')"
    >
      <NcRadioGroupButton
        value="random"
        :label="translate('Random')"
        :disabled="submitting"
      />
      <NcRadioGroupButton
        value="white"
        :label="translate('White')"
        :disabled="submitting"
      />
      <NcRadioGroupButton
        value="black"
        :label="translate('Black')"
        :disabled="submitting"
      />
    </NcRadioGroup>
    <NcNoteCard v-if="error" type="error" show-alert :text="error" />
    <template #actions>
      <NcButton :disabled="submitting" @click="emit('close')">{{
        translate('Cancel')
      }}</NcButton>
      <NcButton
        type="submit"
        variant="primary"
        :disabled="!selectedUser || submitting"
      >
        <template v-if="submitting" #icon><NcLoadingIcon /></template>
        {{ submitting ? translate('Sending …') : translate('Send invitation') }}
      </NcButton>
    </template>
  </NcDialog>
</template>

<style>
.chess-compose {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.chess-compose-description {
  margin: 0;
  color: var(--color-text-maxcontrast);
}
</style>
