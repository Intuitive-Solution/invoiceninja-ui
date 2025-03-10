/**
 * Invoice Ninja (https://invoiceninja.com).
 *
 * @link https://github.com/invoiceninja/invoiceninja source repository
 *
 * @copyright Copyright (c) 2022. Invoice Ninja LLC (https://invoiceninja.com)
 *
 * @license https://www.elastic.co/licensing/elastic-license
 */

import { Card, Element } from '$app/components/cards';
import { InputField, SelectField } from '$app/components/forms';
import { useCurrentCompany } from '$app/common/hooks/useCurrentCompany';
import { ValidationBag } from '$app/common/interfaces/validation-bag';
import { CustomField } from '$app/components/CustomField';
import { useAtom } from 'jotai';
import { useTranslation } from 'react-i18next';
import { creditAtom } from '../atoms';
import { ChangeHandler } from '../hooks';
import { NumberInputField } from '$app/components/forms/NumberInputField';

interface Props {
  handleChange: ChangeHandler;
  errors: ValidationBag | undefined;
}

export function CreditDetails(props: Props) {
  const { t } = useTranslation();
  const { handleChange, errors } = props;

  const company = useCurrentCompany();

  const [credit] = useAtom(creditAtom);

  return (
    <>
      <Card className="col-span-12 lg:col-span-6 xl:col-span-4 h-max">
        <Element leftSide={t('credit_date')}>
          <InputField
            type="date"
            onValueChange={(value) => handleChange('date', value)}
            value={credit?.date || ''}
            errorMessage={errors?.errors.date}
          />
        </Element>

        <Element leftSide={t('valid_until')}>
          <InputField
            type="date"
            onValueChange={(value) => handleChange('due_date', value)}
            value={credit?.due_date || ''}
            errorMessage={errors?.errors.due_date}
          />
        </Element>

        <Element leftSide={t('partial')}>
          <NumberInputField
            value={credit?.partial || ''}
            onValueChange={(value) =>
              handleChange('partial', parseFloat(value))
            }
            changeOverride
            errorMessage={errors?.errors.partial}
          />
        </Element>

        {credit && credit.partial > 0 && (
          <Element leftSide={t('partial_due_date')}>
            <InputField
              type="date"
              onValueChange={(value) => handleChange('partial_due_date', value)}
              value={credit?.partial_due_date || ''}
              errorMessage={errors?.errors.partial_due_date}
            />
          </Element>
        )}

        {credit && company?.custom_fields?.invoice1 && (
          <CustomField
            field="credit1"
            defaultValue={credit?.custom_value1 || ''}
            value={company.custom_fields.invoice1}
            onValueChange={(value) =>
              handleChange('custom_value1', String(value))
            }
          />
        )}

        {credit && company?.custom_fields?.invoice2 && (
          <CustomField
            field="credit2"
            defaultValue={credit?.custom_value2 || ''}
            value={company.custom_fields.invoice2}
            onValueChange={(value) =>
              handleChange('custom_value2', String(value))
            }
          />
        )}
      </Card>

      <Card className="col-span-12 lg:col-span-6 xl:col-span-4 h-max">
        <Element leftSide={t('credit_number')}>
          <InputField
            id="number"
            onValueChange={(value) => handleChange('number', value)}
            value={credit?.number || ''}
            errorMessage={errors?.errors.number}
          />
        </Element>

        <Element leftSide={t('po_number_short')}>
          <InputField
            id="po_number"
            onValueChange={(value) => handleChange('po_number', value)}
            value={credit?.po_number || ''}
            errorMessage={errors?.errors.po_number}
          />
        </Element>

        <Element leftSide={t('discount')}>
          <div className="flex space-x-2">
            <div className="w-full lg:w-1/2">
              <NumberInputField
                value={credit?.discount || ''}
                onValueChange={(value) =>
                  handleChange('discount', parseFloat(value))
                }
                errorMessage={errors?.errors.discount}
              />
            </div>

            <div className="w-full lg:w-1/2">
              <SelectField
                onValueChange={(value) =>
                  handleChange('is_amount_discount', JSON.parse(value))
                }
                value={credit?.is_amount_discount.toString()}
                errorMessage={errors?.errors.is_amount_discount}
                customSelector
                dismissable={false}
              >
                <option value="false">{t('percent')}</option>
                <option value="true">{t('amount')}</option>
              </SelectField>
            </div>
          </div>
        </Element>

        {credit && company?.custom_fields?.invoice3 && (
          <CustomField
            field="credit3"
            defaultValue={credit?.custom_value3 || ''}
            value={company.custom_fields.invoice3}
            onValueChange={(value) =>
              handleChange('custom_value3', String(value))
            }
          />
        )}

        {credit && company?.custom_fields?.invoice4 && (
          <CustomField
            field="credit4"
            defaultValue={credit?.custom_value4 || ''}
            value={company.custom_fields.invoice4}
            onValueChange={(value) =>
              handleChange('custom_value4', String(value))
            }
          />
        )}
      </Card>
    </>
  );
}
