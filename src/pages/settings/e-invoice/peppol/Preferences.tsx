/**
 * Invoice Ninja (https://invoiceninja.com).
 *
 * @link https://github.com/invoiceninja/invoiceninja source repository
 *
 * @copyright Copyright (c) 2024. Invoice Ninja LLC (https://invoiceninja.com)
 *
 * @license https://www.elastic.co/licensing/elastic-license
 */

import { Card, Element } from '$app/components/cards';
import { useTranslation } from 'react-i18next';
import { Disconnect } from './Onboarding';
import Toggle from '$app/components/forms/Toggle';
import { useCurrentCompany } from '$app/common/hooks/useCurrentCompany';
import { useFormik } from 'formik';
import { request } from '$app/common/helpers/request';
import { endpoint, isHosted, isSelfHosted } from '$app/common/helpers';
import { toast } from '$app/common/helpers/toast/toast';
import { useRefreshCompanyUsers } from '$app/common/hooks/useRefreshCompanyUsers';
import { useCurrentAccount } from '$app/common/hooks/useCurrentAccount';
import { Link } from '$app/components/forms';
import { Modal } from '$app/components/Modal';
import { useEffect, useState } from 'react';
import { useAccentColor } from '$app/common/hooks/useAccentColor';
import { useStaticsQuery } from '$app/common/queries/statics';
import { AxiosError } from 'axios';
import { ValidationBag } from '$app/common/interfaces/validation-bag';
import { get } from 'lodash';

export function Preferences() {
  const { t } = useTranslation();
  const company = useCurrentCompany();
  const refresh = useRefreshCompanyUsers();
  const account = useCurrentAccount();
  const accentColor = useAccentColor();
  const statics = useStaticsQuery();

  const form = useFormik({
    initialValues: {
      acts_as_sender: company?.tax_data?.acts_as_sender,
      acts_as_receiver: company?.tax_data?.acts_as_receiver,
      legal_entity_id: company.legal_entity_id,
      e_invoicing_token: account?.e_invoicing_token,
    },
    onSubmit: (values) => {
      toast.processing();

      request('PUT', endpoint('/api/v1/einvoice/peppol/update'), values)
        .then(() => {
          toast.success(t('updated_settings')!);
        })
        .catch((error: AxiosError<ValidationBag>) => {
          if (error.response?.status === 422) {
            if (get(error.response.data, 'errors.acts_as_receiver.0')) {
              toast.error(
                get(error.response.data, 'errors.acts_as_receiver.0')
              );
            }

            return;
          }

          toast.error();
        })
        .finally(() => refresh());
    },
  });

  const [creditsModalVisible, setCreditsModalVisible] = useState(false);

  const [isLicensePresent] = useState(
    statics.data?.license_key !== undefined && statics.data?.license_key !== ''
  );

  useEffect(() => {
    if (isSelfHosted() && !isLicensePresent && creditsModalVisible) {
      toast.error(t('white_label_license_not_present')!);
    }
  }, [creditsModalVisible]);

  return (
    <>
      <Modal
        title={t('buy_credits')}
        visible={creditsModalVisible}
        onClose={() => setCreditsModalVisible(false)}
      >
        <p>{t('peppol_credits_info')}</p>

        <div className="py-2 flex gap-2 flex-col">
          {isHosted() ? (
            <Link
              to={`https://invoiceninja.invoicing.co/client/subscriptions/WJxboqNegw/purchase?account_key=${account?.key}`}
              external
            >
              {t('buy')} (PEPPOL 500)
            </Link>
          ) : null}

          {isSelfHosted() && isLicensePresent ? (
            <Link
              to={`https://invoiceninja.invoicing.co/client/subscriptions/WJxboqNegw/purchase?license_key=${statics.data?.license_key}`}
              external
            >
              {t('buy')} (PEPPOL 500)
            </Link>
          ) : null}

          {isHosted() ? (
            <Link
              to={`https://invoiceninja.invoicing.co/client/subscriptions/k8mep0reMy/purchase?account_key=${account?.key}`}
              external
            >
              {t('buy')} (PEPPOL 1000)
            </Link>
          ) : null}

          {isSelfHosted() && isLicensePresent ? (
            <Link
              to={`https://invoiceninja.invoicing.co/client/subscriptions/k8mep0reMy/purchase?license_key=${statics.data?.license_key}`}
              external
            >
              {t('buy')} (PEPPOL 1000)
            </Link>
          ) : null}
        </div>
      </Modal>

      <Card title={`PEPPOL: ${t('preferences')}`}>
        <Element leftSide={t('status')}>
          <div className="flex flex-col">
            <p>
              {t('connected')} ({company.legal_entity_id})
            </p>

            <div>
              <Disconnect />
            </div>
          </div>
        </Element>

        <Element leftSide={t('act_as_sender')}>
          <Toggle
            checked={form.values.acts_as_sender}
            onValueChange={(v) => {
              form.setFieldValue('acts_as_sender', v);
              form.submitForm();
            }}
          />
        </Element>

        <Element leftSide={t('act_as_receiver')}>
          <Toggle
            checked={form.values.acts_as_receiver}
            onValueChange={(v) => {
              form.setFieldValue('acts_as_receiver', v);
              form.submitForm();
            }}
          />
        </Element>

        <Element leftSide={t('credits')}>
          <div className="flex items-center gap-1">
            <p>{t('total_credits_amount')}:</p>
            <Quota />
          </div>

          <button
            type="button"
            onClick={() => setCreditsModalVisible(true)}
            style={{
              color: accentColor,
            }}
          >
            {t('buy_credits')}
          </button>
        </Element>
      </Card>
    </>
  );
}

export function useQuota() {
  return 10;
}

function Quota() {
  const quota = useQuota();

  return (
    <div>
      <p>{quota}</p>
    </div>
  );
}
