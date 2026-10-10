// @vitest-environment jsdom
import { expect, it } from 'vitest';
import { ref } from 'vue';
import { getCanonicalLocale } from '@nextcloud/l10n';
import { useDateTime } from './useDateTime';

it('formats dates using the Nextcloud locale and reacts to changes', () => {
  const value = ref('2026-10-10T13:00:00Z');
  const formatted = useDateTime(value);
  const expected = (date: string) =>
    new Intl.DateTimeFormat(getCanonicalLocale(), {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(date));
  expect(formatted.value).toBe(expected(value.value));
  value.value = '2026-10-11T09:30:00Z';
  expect(formatted.value).toBe(expected(value.value));
  value.value = 'invalid';
  expect(formatted.value).toBe('invalid');
});
