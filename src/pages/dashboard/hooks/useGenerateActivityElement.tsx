/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Invoice Ninja (https://invoiceninja.com).
 *
 * @link https://github.com/invoiceninja/invoiceninja source repository
 *
 * @copyright Copyright (c) 2022. Invoice Ninja LLC (https://invoiceninja.com)
 *
 * @license https://www.elastic.co/licensing/elastic-license
 */

import { date, trans } from '$app/common/helpers';
import { useCurrentCompanyDateFormats } from '$app/common/hooks/useCurrentCompanyDateFormats';
import { ActivityRecord } from '$app/common/interfaces/activity-record';
import { route } from '$app/common/helpers/route';
import reactStringReplace from 'react-string-replace';
import { Button, InputField, Link } from '$app/components/forms';
import { t } from 'i18next';
import { styled } from 'styled-components';
import { useColorScheme } from '$app/common/colors';
import { Tooltip } from '$app/components/Tooltip';
import { Icon } from '$app/components/icons/Icon';
import { MdAddCircle } from 'react-icons/md';
import { Modal } from '$app/components/Modal';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

const Div = styled.div`
  border-color: ${(props) => props.theme.borderColor};
  &:hover {
    background-color: ${(props) => props.theme.hoverColor};
  }
`;

export function useGenerateActivityElement() {
  const { dateFormat } = useCurrentCompanyDateFormats();

  const generate = (activity: ActivityRecord) => {
    let text = trans(`activity_${activity.activity_type_id}`, {});

    if (activity.activity_type_id === 10 && activity.contact) {
      text = trans(`activity_10_online`, {});
    }

    if (activity.activity_type_id === 54 && activity.contact) {
      text = text.replace(':user', ':contact');
    }

    const replacements = {
      client: (
        <Link to={route('/clients/:id', { id: activity.client?.hashed_id })}>
          {activity.client?.label}
        </Link>
      ),
      contact: (
        <Link
          to={route(`/${activity?.contact?.contact_entity}/:id`, {
            id: activity.contact?.hashed_id,
          })}
        >
          {activity.contact?.label}
        </Link>
      ),
      quote: (
        <Link to={route('/quotes/:id/edit', { id: activity.quote?.hashed_id })}>
          {activity.quote?.label}
        </Link>
      ),
      user: activity.user?.label ?? t('system'),
      expense: (
        <Link
          to={route('/expenses/:id/edit', { id: activity.expense?.hashed_id })}
        >
          {activity?.expense?.label}
        </Link>
      ),
      recurring_invoice: (
        <Link
          to={route('/recurring_invoices/:id/edit', {
            id: activity.recurring_invoice?.hashed_id,
          })}
        >
          {activity?.recurring_invoice?.label}
        </Link>
      ),
      recurring_expense: (
        <Link
          to={route('/recurring_expenses/:id/edit', {
            id: activity.recurring_expense?.hashed_id,
          })}
        >
          {activity?.recurring_expense?.label}
        </Link>
      ),
      purchase_order: (
        <Link
          to={route('/purchase_orders/:id/edit', {
            id: activity.purchase_order?.hashed_id,
          })}
        >
          {activity?.purchase_order?.label}
        </Link>
      ),
      invoice: (
        <Link
          to={route('/invoices/:id/edit', { id: activity.invoice?.hashed_id })}
        >
          {activity?.invoice?.label}
        </Link>
      ),
      payment_amount: activity?.payment_amount?.label,
      payment: (
        <Link
          to={route('/payments/:id/edit', { id: activity.payment?.hashed_id })}
        >
          {activity?.payment?.label}
        </Link>
      ),
      credit: (
        <Link
          to={route('/credits/:id/edit', { id: activity.credit?.hashed_id })}
        >
          {activity?.credit?.label}
        </Link>
      ),
      task: (
        <Link to={route('/tasks/:id/edit', { id: activity.task?.hashed_id })}>
          {activity?.task?.label}
        </Link>
      ),
      vendor: (
        <Link
          to={route('/vendors/:id/edit', { id: activity.vendor?.hashed_id })}
        >
          {activity?.vendor?.label}
        </Link>
      ),
      subscription: (
        <Link
          to={route('/settings/subscriptions/:id/edit', {
            id: activity.subscription?.hashed_id,
          })}
        >
          {activity?.subscription?.label}
        </Link>
      ),
      adjustment: activity?.adjustment?.label,
    };

    for (const [variable, value] of Object.entries(replacements)) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      text = reactStringReplace(text, `:${variable}`, () => value);
    }

    return text;
  };

  const colors = useColorScheme();

  return (activity: ActivityRecord) => (
    <Div
      theme={{ borderColor: colors.$4, hoverColor: colors.$2 }}
      className="flex flex-col py-2 border border-t-0 border-x-0 last:border-b-0"
    >
      <div className="flex flex-col">
        <span className="text-sm">{generate(activity)}</span>

        <div className="flex space-x-3">
          <span className="dark:text-white text-sm">
            {date(activity.created_at, dateFormat + ' HH:mm')}
          </span>

          <span className="text-gray-500 text-sm">{activity.ip}</span>
          <span className="text-gray-500 text-sm">{activity.notes}</span>
        </div>
      </div>
    </Div>
  );
}

interface Props {
  activity: ActivityRecord;
  iconSize?: number;
}

export function InsertActivityNotesModal(props: Props) {
  const [t] = useTranslation();

  const { activity, iconSize = 28 } = props;

  const availableEntities = ['payment'];

  const entity = trans(`activity_${activity.activity_type_id}`, {});

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const [notes, setNotes] = useState<string>('');

  const handleOnClose = () => {
    setIsModalOpen(false);
    setNotes('');
  };

  const handleInsertNotes = () => {};

  return (
    <>
      <Tooltip
        placement="top"
        message={t('insert_notes') as string}
        width="auto"
      >
        <Icon
          element={MdAddCircle}
          size={iconSize}
          onClick={() => setIsModalOpen(true)}
        />
      </Tooltip>

      <Modal
        size="regular"
        title={t('insert_notes')}
        visible={isModalOpen}
        onClose={handleOnClose}
      >
        <InputField
          element="textarea"
          value={notes}
          onValueChange={(value) => setNotes(value)}
        />

        <div className="flex self-end">
          <Button behavior="button" onClick={handleInsertNotes}>
            {t('insert')}
          </Button>
        </div>
      </Modal>
    </>
  );
}
