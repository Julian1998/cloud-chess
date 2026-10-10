import { t } from '@nextcloud/l10n';

export function translate(
  text: string,
  params?: Record<string, string | number>,
): string {
  return t('chess', text, params);
}
