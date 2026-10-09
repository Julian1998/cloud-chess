import { t } from '@nextcloud/l10n';
export function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : t('cloud_chess', 'Something went wrong. Please try again.');
}
