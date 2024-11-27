/**
 * Invoice Ninja (https://invoiceninja.com).
 *
 * @link https://github.com/invoiceninja/invoiceninja source repository
 *
 * @copyright Copyright (c) 2022. Invoice Ninja LLC (https://invoiceninja.com)
 *
 * @license https://www.elastic.co/licensing/elastic-license
 */

import {
  CommonAction,
  Entity,
} from '$app/components/CommonActionsPreferenceModal';
import { useTranslation } from 'react-i18next';

export function useAllCommonActions() {
  const [t] = useTranslation();

  const actions: Record<Entity, CommonAction[]> = {
    invoice: [
      { value: 'email_invoice', label: t('email_invoice') },
      { value: 'view_pdf', label: t('view_pdf') },
      { value: 'print_pdf', label: t('print_pdf') },
      { value: 'schedule', label: t('schedule') },
      { value: 'delivery_note', label: `${t('delivery_note')} ${t('pdf')}` },
      { value: 'download', label: t('download') },
      { value: 'download_e_invoice', label: t('download_e_invoice') },
      { value: 'add_comment', label: t('add_comment') },
      { value: 'mark_sent', label: t('mark_sent') },
      { value: 'mark_paid', label: t('mark_paid') },
      { value: 'auto_bill', label: t('auto_bill') },
      { value: 'enter_payment', label: t('enter_payment') },
      { value: 'client_portal', label: t('client_portal') },
      { value: 'cancel_invoice', label: t('cancel_invoice') },
      { value: 'reverse', label: t('reverse') },
      { value: 'clone_to_invoice', label: t('clone_to_invoice') },
      { value: 'clone_to_other', label: t('clone_to_other') },
      { value: 'archive', label: t('archive') },
      { value: 'restore', label: t('restore') },
      { value: 'delete', label: t('delete') },
    ],
    credit: [
      { value: 'email_credit', label: t('email_credit') },
      { value: 'view_pdf', label: t('view_pdf') },
      { value: 'print_pdf', label: t('print_pdf') },
      { value: 'download_pdf', label: t('download_pdf') },
      { value: 'download_e_credit', label: t('download_e_credit') },
      { value: 'schedule', label: t('schedule') },
      { value: 'add_comment', label: t('add_comment') },
      { value: 'client_portal', label: t('client_portal') },
      { value: 'apply_credit', label: t('apply_credit') },
      { value: 'mark_sent', label: t('mark_sent') },
      { value: 'mark_paid', label: t('mark_paid') },
      { value: 'run_template', label: t('run_template') },
      { value: 'clone_to_credit', label: t('clone_to_credit') },
      { value: 'clone_to_other', label: t('clone_to_other') },
      { value: 'archive', label: t('archive') },
      { value: 'restore', label: t('restore') },
      { value: 'delete', label: t('delete') },
    ],
    quote: [
      { value: 'view_pdf', label: t('view_pdf') },
      { value: 'print_pdf', label: t('print_pdf') },
      { value: 'download_pdf', label: t('download_pdf') },
      { value: 'download_e_quote', label: t('download_e_quote') },
      { value: 'schedule', label: t('schedule') },
      { value: 'add_comment', label: t('add_comment') },
      { value: 'email_quote', label: t('email_quote') },
      { value: 'client_portal', label: t('client_portal') },
      { value: 'mark_sent', label: t('mark_sent') },
      { value: 'approve', label: t('approve') },
      { value: 'convert_to_invoice', label: t('convert_to_invoice') },
      { value: 'convert_to_project', label: t('convert_to_project') },
      { value: 'run_template', label: t('run_template') },
      { value: 'clone_to_quote', label: t('clone_to_quote') },
      { value: 'clone_to_other', label: t('clone_to_other') },

      { value: 'archive', label: t('archive') },
      { value: 'restore', label: t('restore') },
      { value: 'delete', label: t('delete') },
    ],
  };

  return actions;
}

export function useDefaultCommonActions() {
  const [t] = useTranslation();

  const actions: Record<Entity, CommonAction[]> = {
    invoice: [
      { value: 'mark_sent', label: t('mark_sent') },
      { value: 'email_invoice', label: t('email_invoice') },
    ],
    credit: [
      { value: 'mark_sent', label: t('mark_sent') },
      { value: 'email_credit', label: t('email_credit') },
    ],
    quote: [
      { value: 'mark_sent', label: t('mark_sent') },
      { value: 'email_quote', label: t('email_quote') },
    ],
  };

  return actions;
}
