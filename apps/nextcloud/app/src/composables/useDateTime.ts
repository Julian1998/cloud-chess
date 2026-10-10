import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import { useFormatTime } from '@nextcloud/vue/composables/useFormatDateTime';

export function useDateTime(value: MaybeRefOrGetter<string>) {
  const timestamp = computed(() => new Date(toValue(value)).getTime());
  const formatted = useFormatTime(
    () => (Number.isNaN(timestamp.value) ? 0 : timestamp.value),
    { format: { dateStyle: 'medium', timeStyle: 'short' } },
  );
  return computed(() =>
    Number.isNaN(timestamp.value) ? toValue(value) : formatted.value,
  );
}
