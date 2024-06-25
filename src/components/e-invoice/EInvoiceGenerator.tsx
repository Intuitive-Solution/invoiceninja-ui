/**
 * Invoice Ninja (https://invoiceninja.com).
 *
 * @link https://github.com/invoiceninja/invoiceninja source repository
 *
 * @copyright Copyright (c) 2022. Invoice Ninja LLC (https://invoiceninja.com)
 *
 * @license https://www.elastic.co/licensing/elastic-license
 */

import React, {
  ReactNode,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import { InputField, SelectField } from '../forms';
import { useTranslation } from 'react-i18next';
import { Element } from '../cards';
import { Icon } from '../icons/Icon';
import { MdDelete } from 'react-icons/md';
import { SearchableSelect } from '../SearchableSelect';
import { ValidationBag } from '$app/common/interfaces/validation-bag';
import RandExp from 'randexp';
import { get, set } from 'lodash';
import { useCurrentSettingsLevel } from '$app/common/hooks/useCurrentSettingsLevel';
import { EInvoiceComponent, EInvoiceType } from '$app/pages/settings';
import { Spinner } from '../Spinner';
import Toggle from '../forms/Toggle';

export type Country = 'italy';

type Payload = Record<string, string | number | boolean>;

interface PayloadKey {
  key: string;
  valueType: 'string' | 'number' | 'boolean';
}

interface AvailableGroup {
  key: string;
  label: string;
}

interface Resource {
  rules: Rule[];
  validations: Validation[];
  defaultFields: Record<string, string>;
  components: Record<string, Component | undefined>;
  excluded: string[];
}

interface Rule {
  key: string;
  label: string;
  type: 'dropdown';
  resource: string;
  required: boolean;
}

interface Validation {
  name: string;
  base_type: 'string' | 'decimal' | 'number' | 'date';
  resource: Record<string, string> | [];
  length: number | null;
  fraction_digits: number | null;
  total_digits: number | null;
  max_exclusive: number | null;
  min_exclusive: number | null;
  max_inclusive: number | null;
  min_inclusive: number | null;
  max_length: number | null;
  min_length: number | null;
  pattern: string | null;
  whitespace: boolean | null;
}

type Visibility = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface ElementType {
  name: string;
  base_type:
    | ('string' | 'decimal' | 'number' | 'date' | 'boolean' | 'time')
    | null;
  resource: Record<string, string> | [];
  length: number | null;
  max_length: number | null;
  min_length: number | null;
  pattern: string | null;
  help: string;
  min_occurs: number;
  max_occurs: number;
  visibility: Visibility;
}

interface Component {
  type: string;
  help: string;
  choices: string[][] | undefined;
  elements: Record<string, ElementType>;
  visibility: Visibility;
}

interface Props {
  country: Country | undefined;
  entityLevel?: boolean;
  currentEInvoice: EInvoiceType;
}

interface ContainerProps {
  renderFragment: boolean;
  children: ReactNode;
  className: string;
}

function Container(props: ContainerProps) {
  const { renderFragment, children, className } = props;

  if (renderFragment) {
    return <React.Fragment>{children}</React.Fragment>;
  }

  return <div className={className}>{children}</div>;
}

export const EInvoiceGenerator = forwardRef<EInvoiceComponent, Props>(
  (props, ref) => {
    const [t] = useTranslation();

    const { country, entityLevel, currentEInvoice } = props;

    const { isCompanySettingsActive, isClientSettingsActive } =
      useCurrentSettingsLevel();

    const [rules, setRules] = useState<Rule[]>([]);
    const [errors, setErrors] = useState<ValidationBag>();
    const [isInitial, setIsInitial] = useState<boolean>(true);
    const [components, setComponents] = useState<
      Record<string, Component | undefined>
    >({});
    const [eInvoice, setEInvoice] = useState<
      JSX.Element | (JSX.Element | undefined)[]
    >();
    const [defaultFields, setDefaultFields] = useState<Record<string, string>>(
      {}
    );

    let payloadKeys: PayloadKey[] = [];
    let availableGroups: AvailableGroup[] = [];

    const [payload, setPayload] = useState<Payload>({});
    const [currentAvailableGroups, setCurrentAvailableGroups] = useState<
      AvailableGroup[]
    >([]);
    const [allAvailableGroups, setAllAvailableGroups] = useState<
      AvailableGroup[]
    >([]);
    const [selectedChoices, setSelectedChoices] = useState<string[]>([]);
    const [isEInvoiceGenerating, setIsEInvoiceGenerating] =
      useState<boolean>(false);

    const getComponentKey = (label: string | null) => {
      return label?.split('Type')[0];
    };

    const handleChange = (
      property: string,
      value: string | number | boolean
    ) => {
      setPayload((current) => ({ ...current, [property]: value }));
    };

    const isFieldChoice = (fieldKey: string) => {
      const keysLength = fieldKey.split('|').length;
      if (keysLength > 1) {
        const parentComponentType = fieldKey.split('|')[keysLength - 2];

        const fieldName = fieldKey.split('|')[keysLength - 1];

        const parentComponent = components[parentComponentType];

        if (parentComponent && fieldName) {
          return parentComponent?.choices?.some((choiceGroup) =>
            choiceGroup.some((choice) => choice === fieldName)
          );
        }
      }

      return false;
    };

    const isChoiceSelected = (fieldKey: string) => {
      return Boolean(
        selectedChoices.find((choiceKey) => choiceKey === fieldKey)
      );
    };

    const showField = (
      key: string,
      visibility: number,
      isChildOfFirstLevelComponent: boolean,
      minOccurs: number
    ) => {
      if (!isChildOfFirstLevelComponent && minOccurs !== 0) {
        return false;
      }

      if (!visibility) {
        return false;
      }

      if (visibility === 1 && !isCompanySettingsActive) {
        return false;
      }

      if (visibility === 2 && !isClientSettingsActive) {
        return false;
      }

      if (visibility === 4 && !entityLevel) {
        return false;
      }

      if (
        visibility === 3 &&
        !isClientSettingsActive &&
        !isCompanySettingsActive
      ) {
        return false;
      }

      if (visibility === 5 && !entityLevel && !isCompanySettingsActive) {
        return false;
      }

      if (visibility === 6 && !entityLevel && !isClientSettingsActive) {
        return false;
      }

      if (isFieldChoice(key)) {
        return isChoiceSelected(key);
      }

      return !currentAvailableGroups.some((currentType) => {
        const typeKeysLength = currentType.key.split('|').length;
        const updatedCurrentType = currentType.key
          .split('|')
          .filter((_, index) => index !== typeKeysLength - 1)
          .join('|');

        return key.startsWith(updatedCurrentType);
      });
    };

    const handleDeleteComponent = (componentKey: string) => {
      const deletedComponent = allAvailableGroups.find(
        ({ key }) => key === componentKey
      );

      if (deletedComponent) {
        setSelectedChoices((currentChoices) =>
          currentChoices.filter(
            (choiceKey) => !choiceKey.startsWith(componentKey)
          )
        );
        setCurrentAvailableGroups((current) => [...current, deletedComponent]);
      }

      let updatedPartOfPayload = {};

      Object.keys(payload)
        .filter((key) => key.startsWith(componentKey))
        .forEach((currentKey) => {
          updatedPartOfPayload = {
            ...updatedPartOfPayload,
            [currentKey]:
              typeof payload[currentKey] === 'number'
                ? 0
                : typeof payload[currentKey] === 'boolean'
                ? false
                : '',
          };
        });

      setPayload((current) => ({
        ...current,
        ...updatedPartOfPayload,
      }));
    };

    const getFieldLabel = (
      fieldElement: ElementType,
      fieldParentKeys: string
    ) => {
      const parentKeysLength = fieldParentKeys.split('|').length;

      let topParentType = '';
      let lastParentType = '';

      if (parentKeysLength > 3) {
        topParentType = fieldParentKeys.split('|')[parentKeysLength - 4];
        lastParentType = fieldParentKeys.split('|')[parentKeysLength - 2];

        return `${fieldElement.name} (${getComponentKey(
          topParentType
        )}, ${getComponentKey(lastParentType)})`;
      }

      if (parentKeysLength > 2) {
        topParentType = fieldParentKeys.split('|')[parentKeysLength - 3];
        lastParentType = fieldParentKeys.split('|')[parentKeysLength - 2];

        return `${fieldElement.name} (${getComponentKey(
          topParentType
        )}, ${getComponentKey(lastParentType)})`;
      }

      if (parentKeysLength > 1) {
        lastParentType = fieldParentKeys.split('|')[parentKeysLength - 2];

        return `${fieldElement.name} (${getComponentKey(lastParentType)})`;
      }

      return fieldElement.name;
    };

    const renderElement = (
      element: ElementType,
      parentsKey: string,
      isChildOfFirstLevelComponent: boolean
    ) => {
      let leftSideLabel = '';
      const fieldKey = `${parentsKey}|${element.name || ''}`;
      const rule = rules.find((rule) => rule.key === element.name);

      if (rule) {
        leftSideLabel = rule.label;
      } else {
        leftSideLabel = getFieldLabel(element, parentsKey);
      }

      const isNumberTypeField =
        element.base_type === 'decimal' || element.base_type === 'number';

      const isBooleanTypeField = element.base_type === 'boolean';

      payloadKeys.push({
        key: fieldKey,
        valueType: isNumberTypeField
          ? 'number'
          : isBooleanTypeField
          ? 'boolean'
          : 'string',
      });

      if (
        !showField(
          fieldKey,
          element.visibility,
          isChildOfFirstLevelComponent,
          element.min_occurs
        )
      ) {
        return null;
      }

      if (
        typeof element.resource === 'object' &&
        element.resource !== null &&
        Object.keys(element.resource).length
      ) {
        return (
          <Element
            key={fieldKey}
            required={rule?.required}
            leftSide={leftSideLabel}
          >
            <SelectField
              value={payload[fieldKey] || ''}
              onValueChange={(value) => handleChange(fieldKey, value)}
              withBlank
              errorMessage={errors?.errors[fieldKey]}
            >
              {Object.entries(element.resource).map(([key, value]) => (
                <option key={key} value={key}>
                  {value || key}
                </option>
              ))}
            </SelectField>
          </Element>
        );
      }

      if (element.base_type === 'decimal' || element.base_type === 'number') {
        return (
          <Element
            key={fieldKey}
            required={rule?.required}
            leftSide={leftSideLabel}
          >
            <InputField
              type="number"
              value={payload[fieldKey] || 0}
              onValueChange={(value) =>
                handleChange(
                  fieldKey,
                  parseFloat(value).toFixed(value.split('.')?.[1]?.length)
                )
              }
              errorMessage={errors?.errors[fieldKey]}
            />
          </Element>
        );
      }

      if (element.base_type === 'date') {
        return (
          <Element
            key={fieldKey}
            required={rule?.required}
            leftSide={leftSideLabel}
          >
            <InputField
              type="date"
              value={payload[fieldKey] || ''}
              onValueChange={(value) => handleChange(fieldKey, value)}
              errorMessage={errors?.errors[fieldKey]}
            />
          </Element>
        );
      }

      if (element.base_type === 'boolean') {
        return (
          <Element
            key={fieldKey}
            required={rule?.required}
            leftSide={leftSideLabel}
          >
            <Toggle
              checked={Boolean(payload[fieldKey]) || false}
              onValueChange={(value) => handleChange(fieldKey, value)}
            />
          </Element>
        );
      }

      if (element.base_type === 'time') {
        return (
          <Element
            key={fieldKey}
            required={rule?.required}
            leftSide={leftSideLabel}
          >
            <InputField
              type="time"
              value={payload[fieldKey] || ''}
              onValueChange={(value) => handleChange(fieldKey, value)}
              errorMessage={errors?.errors[fieldKey]}
            />
          </Element>
        );
      }

      if (element.base_type !== null) {
        return (
          <Element
            key={fieldKey}
            required={rule?.required}
            leftSide={leftSideLabel}
          >
            <InputField
              value={payload[fieldKey] || ''}
              onValueChange={(value) => handleChange(fieldKey, value)}
              errorMessage={errors?.errors[fieldKey]}
            />
          </Element>
        );
      }
    };

    const checkElementVisibility = (visibility: number) => {
      if (visibility === 0) {
        return false;
      }

      if (visibility === 1 && !isCompanySettingsActive) {
        return false;
      }

      if (visibility === 2 && !isClientSettingsActive) {
        return false;
      }

      if (visibility === 4 && !entityLevel) {
        return false;
      }

      if (
        visibility === 3 &&
        !isClientSettingsActive &&
        !isCompanySettingsActive
      ) {
        return false;
      }

      if (visibility === 5 && !entityLevel && !isCompanySettingsActive) {
        return false;
      }

      if (visibility === 6 && !entityLevel && !isClientSettingsActive) {
        return false;
      }

      return true;
    };

    const isComponentLastParent = (component: Component) => {
      return (
        Object.keys(component.elements).length &&
        Object.values(component.elements).some(
          (element) =>
            !element.base_type?.endsWith('Type') &&
            checkElementVisibility(element.visibility)
        )
      );
    };

    const getChoiceSelectorLabel = (componentKey: string) => {
      const keysLength = componentKey.split('|').length;

      let lastParentType = '';
      let lastParentName = '';

      if (keysLength > 2) {
        lastParentType = componentKey.split('|')[keysLength - 3];
        lastParentName = componentKey.split('|')[keysLength - 2];
      }

      if (keysLength > 3) {
        lastParentType = componentKey.split('|')[keysLength - 4];
      }

      if (keysLength > 2 || keysLength > 3) {
        return `${t('Choices')} (${getComponentKey(
          lastParentType
        )}, ${lastParentName})`;
      }

      if (keysLength > 1) {
        lastParentName = componentKey.split('|')[keysLength - 2];

        return `${t('Choices')} (${lastParentName})`;
      }

      return t('Choices');
    };

    const getGroupElements = (
      component: Component | undefined,
      currentElements: ElementType[],
      resolvedTypes: string[]
    ): ElementType[] => {
      component && resolvedTypes.push(component.type);

      Object.values(component?.elements || {}).map((element) => {
        if (element.base_type && !resolvedTypes.includes(element.base_type)) {
          if (element.base_type?.endsWith('Type')) {
            if (checkElementVisibility(element.visibility)) {
              getGroupElements(
                components[element.base_type],
                currentElements,
                resolvedTypes
              );
            }
          } else {
            currentElements.push(element);
          }
        }
      });

      return currentElements;
    };

    const shouldAnyElementBeVisible = (
      groupComponent: Component,
      componentPath: string,
      isFirstLevelComponent: boolean
    ) => {
      const groupElements: ElementType[] = getGroupElements(
        groupComponent,
        [],
        []
      );

      return groupElements.some((element) =>
        showField(
          getFieldKeyFromPayload(componentPath, element.name),
          element.visibility,
          isFirstLevelComponent,
          element.min_occurs
        )
      );
    };

    const getDefaultChoiceSelectorValue = (componentKey: string) => {
      const selectedComponentChoice = selectedChoices.find((choiceKey) =>
        choiceKey.startsWith(componentKey)
      );

      if (selectedComponentChoice) {
        const choiceKeysLength = selectedComponentChoice.split('|').length;
        const choiceName =
          selectedComponentChoice.split('|')[choiceKeysLength - 1];

        return choiceName;
      }

      return '';
    };

    const renderComponent = (
      component: Component,
      componentIndex: number,
      isDefaultComponent: boolean,
      componentPath: string,
      isFirstLevelComponent: boolean,
      isLastParent: boolean,
      resolvedTypes: string[],
      isVisible: boolean
    ) => {
      if (!isFirstLevelComponent && !isLastParent) {
        return <></>;
      }

      if (!isVisible || resolvedTypes.includes(component.type)) {
        return <></>;
      }

      const isCurrentComponentLastParent = isComponentLastParent(component);

      const componentKey = `${componentPath}|${component.type}`;

      const isAnyElementFromGroupVisible = shouldAnyElementBeVisible(
        component,
        componentPath,
        !isDefaultComponent || isFirstLevelComponent
      );

      const currentGroupsList = isInitial
        ? availableGroups
        : currentAvailableGroups;

      const isIncludedInAllGroups = allAvailableGroups.some(
        (currentType) => componentKey === currentType.key
      );

      const shouldBeRendered =
        !currentGroupsList.some(
          (currentType) => componentKey === currentType.key
        ) &&
        isAnyElementFromGroupVisible &&
        isIncludedInAllGroups;

      return (
        <Container
          className="flex items-center"
          key={componentPath}
          renderFragment={!isCurrentComponentLastParent || !shouldBeRendered}
        >
          <Container
            className="flex flex-1 flex-col"
            renderFragment={!isCurrentComponentLastParent || !shouldBeRendered}
          >
            {isCurrentComponentLastParent &&
              (shouldBeRendered || isFirstLevelComponent) &&
              Boolean(component.choices?.length) && (
                <Element
                  key={`${componentKey}ChoiceSelector`}
                  leftSide={getChoiceSelectorLabel(componentKey)}
                >
                  <SelectField
                    defaultValue={getDefaultChoiceSelectorValue(componentKey)}
                    onValueChange={(value) => {
                      setSelectedChoices((current) => {
                        const updatedCurrentList = current.filter(
                          (choice) => !choice.startsWith(componentKey)
                        );

                        if (!value) {
                          const choiceFieldKey = current.find((choice) =>
                            choice.startsWith(componentKey)
                          );

                          if (choiceFieldKey) {
                            setPayload((currentPayload) => ({
                              ...currentPayload,
                              [choiceFieldKey]:
                                typeof currentPayload[choiceFieldKey] ===
                                'number'
                                  ? 0
                                  : typeof currentPayload[choiceFieldKey] ===
                                    'boolean'
                                  ? false
                                  : '',
                            }));
                          }
                        }

                        return [
                          ...updatedCurrentList,
                          ...(value ? [`${componentKey}|${value}`] : []),
                        ];
                      });
                    }}
                    withBlank
                  >
                    {component.choices?.map((choiceGroup) =>
                      choiceGroup.map((choice) => (
                        <option key={choice} value={choice}>
                          {choice}
                        </option>
                      ))
                    )}
                  </SelectField>
                </Element>
              )}

            {Boolean(Object.keys(component.elements).length) &&
              Object.values(component.elements).map((element) => {
                if (
                  element.base_type?.endsWith('Type') &&
                  element.base_type !== component.type
                ) {
                  const componentsList = Object.values(components).filter(
                    (_, index) => componentIndex !== index
                  );

                  const nextComponentIndex = componentsList.findIndex(
                    (component) => component?.type === element.base_type
                  );

                  const nextComponent = componentsList[nextComponentIndex];

                  if (nextComponent) {
                    const isNewComponentLastParent =
                      isComponentLastParent(nextComponent);

                    const isNewComponentDefault = element.min_occurs !== 0;

                    const isAnyElementFromGroupVisible =
                      shouldAnyElementBeVisible(
                        nextComponent,
                        `${componentPath}|${element.name}|${nextComponent.type}`,
                        !isNewComponentDefault
                      );

                    const isParentAlreadyAdded = availableGroups.some(
                      (group) => {
                        const typeKeysLength = group.key.split('|').length;
                        const updatedCurrentType = group.key
                          .split('|')
                          .filter((_, index) => index !== typeKeysLength - 1)
                          .join('|');

                        return `${componentPath}|${element.name}|${nextComponent.type}`.startsWith(
                          updatedCurrentType
                        );
                      }
                    );

                    const isComponentVisible = checkElementVisibility(
                      element.visibility
                    );

                    if (
                      isInitial &&
                      element.min_occurs === 0 &&
                      isNewComponentLastParent &&
                      isAnyElementFromGroupVisible &&
                      isComponentVisible &&
                      !isParentAlreadyAdded
                    ) {
                      const label = `${getComponentKey(nextComponent.type)} (${
                        element.name
                      }, ${getComponentKey(component.type)})`;

                      availableGroups.push({
                        key: `${componentPath}|${element.name}|${nextComponent.type}`,
                        label,
                      });
                    }

                    return renderComponent(
                      nextComponent,
                      nextComponentIndex,
                      Boolean(isNewComponentDefault),
                      `${componentPath}|${element.name}`,
                      false,
                      isLastParent,
                      resolvedTypes,
                      isComponentVisible
                    );
                  }
                } else {
                  return renderElement(
                    element,
                    componentKey,
                    isFirstLevelComponent || element.min_occurs === 0
                  );
                }
              })}
          </Container>

          {shouldBeRendered &&
            !isDefaultComponent &&
            isCurrentComponentLastParent && (
              <div
                className="cursor-pointer"
                onClick={() => handleDeleteComponent(componentKey)}
              >
                <Icon element={MdDelete} size={28} />
              </div>
            )}
        </Container>
      );
    };

    const createPayload = () => {
      let currentPayload: Payload = {};

      payloadKeys.forEach(({ key, valueType }) => {
        const keysLength = key.split('|').length;

        const fieldPath = key
          .split('|')
          .filter((_, index) => index !== keysLength - 2)
          .join('|')
          .replaceAll('|', '.');

        const currentFieldValue = get(currentEInvoice, fieldPath);

        currentPayload = {
          ...currentPayload,
          [key]:
            (currentFieldValue as string | number) ||
            defaultFields[key.split('|')[keysLength - 1]] ||
            (valueType === 'number' ? 0 : valueType === 'boolean' ? false : ''),
        };
      });

      setPayload(currentPayload);
    };

    const updateErrors = (
      currentErrors: ValidationBag,
      key: string,
      value: string
    ) => {
      return {
        ...currentErrors,
        errors: {
          ...currentErrors.errors,
          [key]: [
            ...(currentErrors.errors[key] ? currentErrors.errors[key] : []),
            currentErrors.errors[key]?.length ? `\n ${value}` : value,
          ],
        },
      };
    };

    const checkValidation = () => {
      let updatedErrors: ValidationBag = { errors: {}, message: '' };

      Object.entries(payload).forEach(([key, value]) => {
        const keysLength = key.split('|').length;
        const fieldKey = key.split('|')[keysLength - 1];
        const firstParentComponentType = key.split('|')[keysLength - 2];

        let field: ElementType | undefined;

        Object.values(components).forEach((component) => {
          if (
            component &&
            !field &&
            firstParentComponentType === component.type
          ) {
            field = Object.values(component?.elements || {}).find(
              ({ name }) => name === fieldKey
            );
          }
        });

        const isFirstLevelComponent = !Object.values(components).some(
          (currentComponent) =>
            Object.values(currentComponent?.elements || {}).some(
              (element) => element.base_type === firstParentComponentType
            )
        );

        if (
          field &&
          showField(
            key,
            field.visibility,
            isFirstLevelComponent,
            field.min_occurs
          )
        ) {
          let fieldValidation: ElementType | undefined;

          Object.values(components).forEach((component) => {
            if (!fieldValidation) {
              fieldValidation = Object.values(component?.elements || {}).find(
                ({ name }) => name === fieldKey
              );
            }
          });

          const isRequired = rules.find(
            (rule) => rule.key === fieldKey
          )?.required;

          if (fieldValidation) {
            const { pattern, length, min_length, max_length } = fieldValidation;

            if (isRequired && !value) {
              updatedErrors = updateErrors(
                updatedErrors,
                key,
                `${key} is required field!`
              );
            }

            if (
              length &&
              (value?.toString().length < length ||
                value?.toString().length > length)
            ) {
              updatedErrors = updateErrors(
                updatedErrors,
                key,
                `Value length for the ${fieldKey} field must be ${length}!`
              );
            }

            if (pattern) {
              try {
                const isPatternFailed =
                  new RegExp(pattern).test(value.toString()) === false;

                if (isPatternFailed) {
                  updatedErrors = updateErrors(
                    updatedErrors,
                    key,
                    `${fieldKey} has wrong pattern, the correct pattern is ${new RandExp(
                      pattern as string
                    ).gen()} (example)!`
                  );
                }
              } catch (error) {
                console.error(error);
              }
            }

            if (min_length && !max_length) {
              if (value?.toString().length < min_length) {
                updatedErrors = updateErrors(
                  updatedErrors,
                  key,
                  `Min length for ${fieldKey} field is ${min_length}!`
                );
              }
            }

            if (max_length && !min_length) {
              if (value?.toString().length > max_length) {
                updatedErrors = updateErrors(
                  updatedErrors,
                  key,
                  `Max length for ${fieldKey} field is ${max_length}!`
                );
              }
            }

            if (max_length && min_length) {
              if (
                (value?.toString().length > max_length ||
                  value?.toString().length < min_length) &&
                max_length !== min_length
              ) {
                updatedErrors = updateErrors(
                  updatedErrors,
                  key,
                  `Length for ${fieldKey} field should be between ${min_length} and ${max_length}!`
                );
              } else if (
                value?.toString().length > max_length ||
                value?.toString().length < min_length
              ) {
                updatedErrors = updateErrors(
                  updatedErrors,
                  key,
                  `Length for ${fieldKey} field should be ${min_length}!`
                );
              }
            }
          }
        }
      });

      if (Object.keys(updatedErrors.errors).length) {
        setErrors(updatedErrors);
      } else {
        setErrors(undefined);
      }
    };

    const formatPayload = () => {
      const formattedPayload = {};

      Object.entries(payload).forEach(([key, value]) => {
        const keysLength = key.split('|').length;
        const fieldKey = key.split('|')[keysLength - 1];
        const firstParentComponentType = key.split('|')[keysLength - 2];

        let field: ElementType | undefined;

        Object.values(components).forEach((component) => {
          if (
            component &&
            !field &&
            firstParentComponentType === component.type
          ) {
            field = Object.values(component?.elements || {}).find(
              ({ name }) => name === fieldKey
            );
          }
        });

        const isFirstLevelComponent = !Object.values(components).some(
          (currentComponent) =>
            Object.values(currentComponent?.elements || {}).some(
              (element) => element.base_type === firstParentComponentType
            )
        );

        if (
          field &&
          showField(
            key,
            field.visibility,
            isFirstLevelComponent,
            field.min_occurs
          )
        ) {
          const updatedPath = key
            .split('|')
            .filter((_, index) => index !== keysLength - 2)
            .join('|');

          set(formattedPayload, updatedPath.replaceAll('|', '.'), value);
        }
      });

      return formattedPayload;
    };

    const handleSave = () => {
      setErrors(undefined);

      checkValidation();

      if (errors === undefined) {
        return formatPayload();
      }
    };

    const getFieldKeyFromPayload = (
      componentPath: string,
      fieldName: string
    ) => {
      let fieldKey = '';

      Object.keys(payload).forEach((key) => {
        if (
          !fieldKey &&
          key.startsWith(componentPath) &&
          key.includes(fieldName)
        ) {
          fieldKey = key;
        }
      });

      return fieldKey;
    };

    const generateEInvoiceUI = async (
      components: Record<string, Component | undefined>
    ) => {
      payloadKeys = [];

      if (!Object.keys(components).length) {
        return <></>;
      }

      const invoiceComponents = Object.values(components).map(
        (component, index) => {
          const isAlreadyRendered = Object.values(components)
            .filter((_, currentIndex) => currentIndex < index)
            .some((currentComponent) =>
              Object.values(currentComponent?.elements || {}).some(
                (element) => element.base_type === component?.type
              )
            );

          if (index === 0 || !isAlreadyRendered) {
            const isLastParent = component && isComponentLastParent(component);

            return (
              component &&
              renderComponent(
                component,
                index,
                Boolean(isLastParent),
                getComponentKey(component.type) || '',
                true,
                Boolean(isLastParent),
                [],
                true
              )
            );
          }
        }
      );

      return invoiceComponents.filter((currentComponent) => currentComponent);
    };

    useEffect(() => {
      if (country) {
        fetch(
          new URL(
            `/src/resources/e-invoice/${country}/${country}.json`,
            import.meta.url
          ).href
        )
          .then((response) => response.json())
          .then((response: Resource) => {
            setIsInitial(true);
            setEInvoice(undefined);
            setRules(response.rules);
            setCurrentAvailableGroups([]);
            setAllAvailableGroups([]);
            setComponents(response.components);
            setDefaultFields(response.defaultFields);
            setErrors(undefined);
            setSelectedChoices([]);
            payloadKeys = [];
            availableGroups = [];
          });
      } else {
        setRules([]);
        setComponents({});
        setErrors(undefined);
        setEInvoice(undefined);
        setIsInitial(true);
        setDefaultFields({});
        setCurrentAvailableGroups([]);
        setAllAvailableGroups([]);
        setSelectedChoices([]);
        availableGroups = [];
        payloadKeys = [];
      }
    }, [country]);

    useEffect(() => {
      if (Object.keys(components).length) {
        (async () => {
          setIsEInvoiceGenerating(true);

          const invoiceUI = await generateEInvoiceUI(components);

          isInitial && setIsInitial(false);

          setEInvoice(invoiceUI);

          if (isInitial) {
            createPayload();
            setAllAvailableGroups([...availableGroups]);
            setCurrentAvailableGroups([...availableGroups]);
          }

          setIsEInvoiceGenerating(false);
        })();
      }
    }, [components, currentAvailableGroups, errors, payload, selectedChoices]);

    useEffect(() => {
      if (!isInitial) {
        setErrors(undefined);

        if (Object.keys(payload).length && allAvailableGroups.length) {
          Object.entries(payload).forEach(([key, value]) => {
            const fieldGroup = allAvailableGroups.find((group) => {
              const typeKeysLength = group.key.split('|').length;
              const updatedCurrentGroupKey = group.key
                .split('|')
                .filter((_, index) => index !== typeKeysLength - 1)
                .join('|');

              return key.startsWith(updatedCurrentGroupKey);
            });

            if (fieldGroup && value) {
              const isAlreadyRemoved = !currentAvailableGroups.some(
                (currentGroup) => currentGroup.key === fieldGroup.key
              );

              if (!isAlreadyRemoved) {
                setCurrentAvailableGroups((current) =>
                  current.filter((group) => group.key !== fieldGroup.key)
                );
              }

              const isChoice = isFieldChoice(key);

              if (isChoice) {
                const isAlreadyAdded = selectedChoices.includes(key);

                if (!isAlreadyAdded) {
                  setSelectedChoices((current) => [...current, key]);
                }
              }
            }

            if (!fieldGroup && value) {
              const isChoice = isFieldChoice(key);

              if (isChoice) {
                const isAlreadyAdded = selectedChoices.includes(key);

                if (!isAlreadyAdded) {
                  setSelectedChoices((current) => [...current, key]);
                }
              }
            }
          });
        }
      }
    }, [payload, currentAvailableGroups, allAvailableGroups, selectedChoices]);

    useImperativeHandle(
      ref,
      () => {
        return {
          saveEInvoice() {
            return handleSave();
          },
        };
      },
      [payload]
    );

    return (
      <div className="flex flex-col mt-5">
        {Boolean(eInvoice) && (
          <Element leftSide={t('fields')}>
            <SearchableSelect
              value=""
              onValueChange={(value) =>
                setCurrentAvailableGroups((current) =>
                  current.filter((type) => type.key !== value)
                )
              }
              clearAfterSelection
            >
              {currentAvailableGroups.map(({ key, label }, index) => (
                <option key={index} value={key}>
                  {label}
                </option>
              ))}
            </SearchableSelect>
          </Element>
        )}

        {isEInvoiceGenerating ? (
          <Spinner />
        ) : (
          <div className="mt-4">{eInvoice ?? null}</div>
        )}
      </div>
    );
  }
);
