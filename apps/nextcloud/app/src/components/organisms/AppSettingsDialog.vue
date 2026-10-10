<script setup lang="ts">
import { translate } from '../../platform/i18n';
import NcAppSettingsDialog from '@nextcloud/vue/components/NcAppSettingsDialog';
import NcAppSettingsSection from '@nextcloud/vue/components/NcAppSettingsSection';
import NcCheckboxRadioSwitch from '@nextcloud/vue/components/NcCheckboxRadioSwitch';
const open = defineModel<boolean>('open', { required: true });
const inboxOpen = defineModel<boolean>('inboxOpen', { required: true });
</script>
<template>
  <NcAppSettingsDialog
    v-model:open="open"
    :name="translate('Settings')"
    no-version
  >
    <NcAppSettingsSection id="navigation" :name="translate('Invitations')">
      <NcCheckboxRadioSwitch v-model="inboxOpen">{{
        translate('Expand open requests')
      }}</NcCheckboxRadioSwitch>
    </NcAppSettingsSection>
  </NcAppSettingsDialog>
</template>
