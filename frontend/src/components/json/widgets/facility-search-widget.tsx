'use client';
import { FormFieldLabel } from '@components/form-field-label/form-field-label.component';
import { FacilityInfoDTO, UserEmploymentDTO } from '@data-contracts/backend/data-contracts';
import { ariaDescribedByIds, errorId, type FieldProps } from '@rjsf/utils';
import { getUserEmployments } from '@services/employee-service/employee-service';
import { Combobox, FormControl, FormErrorMessage, RadioButton } from '@sk-web-gui/react';
import { INVALID_FIELD_ATTRIBUTE } from '@utils/focus-first-error';
import {
  findPlaceNode,
  findPlaceNodeByKey,
  getPlaceNodes,
  getPlaceSelectionPresentation,
  getSubPlaceNodes,
  hasSubPlaces,
  isDescendantOrSelf,
  isSameLabel,
  matchesPlaceSearch,
  placeKey,
  placeName,
  PlaceNode,
  placeParentName,
} from '@utils/label-structure';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMetadataStore } from 'src/stores/metadata-store';

import { collectFieldErrors } from '../utils/schema-form-error-handling';
import { requiredProps } from './types';

/** Fler underenheter än så blir en ohanterlig radioknappsgrupp — då används sökning istället */
const MAX_RADIO_SUB_PLACES = 6;

export function FacilitySearchWidget(props: FieldProps<FacilityInfoDTO>) {
  const { t } = useTranslation('forms');
  const {
    idSchema,
    formData,
    disabled,
    readonly,
    required,
    errorSchema,
    rawErrors,
    onBlur,
    onChange,
    onFocus,
    uiSchema,
  } = props;
  const id = idSchema.$id;
  const searchLabelId = `${id}__search-label`;
  const subPlaceLabelId = `${id}__sub-place-label`;
  const describedBy = ariaDescribedByIds(id);
  // Kravet på en vald plats ligger på objektets orgName, så felet hamnar en nivå ned i stället
  // för på fältet självt. Widgeten renderar hela objektet som en kontroll och äger därför båda.
  const fieldErrors = useMemo(
    () => [...(rawErrors ?? []), ...collectFieldErrors(errorSchema)],
    [errorSchema, rawErrors]
  );
  const invalid = fieldErrors.length > 0;

  const uiOptions = (uiSchema?.['ui:options'] ?? {}) as Record<string, unknown>;
  const className = (uiOptions.className as string) || 'w-full';

  const metadata = useMetadataStore((state) => state.metadata);
  const placeNodes = useMemo(() => getPlaceNodes(metadata?.labels?.labelStructure), [metadata?.labels?.labelStructure]);
  const selectablePlaceNodes = useMemo(() => placeNodes.filter((node) => !hasSubPlaces(node)), [placeNodes]);

  const [placeSearchValue, setPlaceSearchValue] = useState('');
  // Förhandsvalet är bortkommenterat tills vidare – användaren söker alltid fram platsen själv.
  // const [suggestedNode, setSuggestedNode] = useState<PlaceNode | null>(null);
  const employmentMatchRef = useRef<{ node: PlaceNode; employment: UserEmploymentDTO } | null>(null);
  const employmentLookupDoneRef = useRef(false);

  const isEditable = !disabled && !readonly;

  const selectedNode = useMemo(
    () => findPlaceNode(placeNodes, formData?.orgName, formData?.parentOrgName),
    [placeNodes, formData?.orgName, formData?.parentOrgName]
  );
  const filteredSelectablePlaceNodes = useMemo(
    () => selectablePlaceNodes.filter((node) => matchesPlaceSearch(node, placeSearchValue)),
    [placeSearchValue, selectablePlaceNodes]
  );
  /**
   * Väljaren listar bara platser utan underenheter, så ett val därifrån är alltid färdigt –
   * avdelningen ligger med i alternativet. Underenhetsvalet behövs bara för en sparad plats som
   * pekar högre upp i strukturen och därför inte är vald hela vägen ner.
   */
  const subPlaceParentNode = useMemo(
    () => (selectedNode && hasSubPlaces(selectedNode) ? selectedNode : undefined),
    [selectedNode]
  );
  const subPlaceNodes = useMemo(
    () => (subPlaceParentNode ? getSubPlaceNodes(placeNodes, subPlaceParentNode) : []),
    [placeNodes, subPlaceParentNode]
  );
  const selectedSubPlaceKey = useMemo(
    () =>
      selectedNode && subPlaceNodes.some((node) => isSameLabel(node.label, selectedNode.label)) ?
        placeKey(selectedNode)
      : '',
    [selectedNode, subPlaceNodes]
  );
  const mustChooseSubPlace = Boolean(selectedNode && hasSubPlaces(selectedNode));

  const selectPlace = useCallback(
    (node: PlaceNode) => {
      const match = employmentMatchRef.current;
      const isEmploymentPlace = !!match && isSameLabel(node.label, match.node.label);
      const withinEmploymentBranch = !!match && isDescendantOrSelf(node, match.node);

      onChange({
        orgId: isEmploymentPlace ? match.employment.orgId : undefined,
        orgName: placeName(node),
        parentOrgName: placeParentName(node),
        manager: withinEmploymentBranch ? match.employment.manager : undefined,
      });
    },
    [onChange]
  );

  // Slår upp användarens anställning i labelstrukturen. Den föreslås inte längre som plats —
  // förhandsvalet är bortkommenterat nedan — men uppslaget behövs ändå: selectPlace fyller i
  // orgId och enhetschef ur anställningen när användaren väljer en plats i sin egen organisation.
  // Tas det bort sparas ärendet utan enhetschef.
  useEffect(() => {
    if (!isEditable || employmentLookupDoneRef.current || placeNodes.length === 0) return;
    if (formData?.orgName) {
      employmentLookupDoneRef.current = true;
      return;
    }

    employmentLookupDoneRef.current = true;

    const lookUpEmployment = async () => {
      try {
        const employments = await getUserEmployments();
        // Backend sorterar huvudanställningen först, så den matchas före eventuella sidotjänster.
        for (const employment of employments) {
          const node = findPlaceNode(placeNodes, employment.orgName);
          if (node) {
            employmentMatchRef.current = { node, employment };
            // setSuggestedNode(node);
            return;
          }
        }
      } catch (error) {
        console.error('Failed to load employments:', error);
      }
    };

    void lookUpEmployment();
  }, [isEditable, placeNodes, formData?.orgName]);

  // const suggestedPlacePresentation = useMemo(
  //   () => (suggestedNode ? getPlaceSelectionPresentation(suggestedNode) : undefined),
  //   [suggestedNode]
  // );

  // const handleAcceptSuggestion = useCallback(() => {
  //   if (suggestedNode) {
  //     selectPlace(suggestedNode);
  //     setSuggestedNode(null);
  //   }
  // }, [selectPlace, suggestedNode]);

  const handleSelectPlace = useCallback(
    (key: string) => {
      const node = findPlaceNodeByKey(placeNodes, key);
      if (node) {
        selectPlace(node);
      }
    },
    [placeNodes, selectPlace]
  );

  const selectedPlaceKey = selectedNode ? placeKey(selectedNode) : '';

  /**
   * Comboboxen visar sitt valda värde genom att slå upp alternativet med samma nyckel. Söktexten
   * filtrerar listan, så utan det här hade valet blivit osynligt så snart filtret inte träffar det.
   */
  const selectablePlaceOptionNodes = useMemo(() => {
    if (!selectedNode) return filteredSelectablePlaceNodes;
    const alreadyListed = filteredSelectablePlaceNodes.some((node) => isSameLabel(node.label, selectedNode.label));
    return alreadyListed ? filteredSelectablePlaceNodes : [selectedNode, ...filteredSelectablePlaceNodes];
  }, [filteredSelectablePlaceNodes, selectedNode]);

  if (!metadata) {
    return (
      <div className={className}>
        <p className="text-text-secondary">{t('facility_search.loading')}</p>
      </div>
    );
  }

  if (placeNodes.length === 0) {
    return (
      <div className={className}>
        <p className="text-error" data-cy="facility-structure-missing">
          {t('facility_search.no_place_structure')}
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Fältet renderas av ett eget ui:field och passerar därför inte FieldTemplate, som annars
          märker felaktiga fält och skriver ut deras meddelande. Båda görs här i stället. */}
      <FormControl
        disabled={!isEditable}
        invalid={invalid}
        required={required}
        className="w-full"
        {...(invalid ? { [INVALID_FIELD_ATTRIBUTE]: id } : {})}
      >
        <FormFieldLabel id={searchLabelId} htmlFor={id} className="font-bold">
          {t('facility_search.search_label')}
        </FormFieldLabel>
        <Combobox
          id={`${id}__combobox`}
          className="w-[60rem]"
          size="md"
          value={selectedPlaceKey}
          autofilter={false}
          aria-labelledby={searchLabelId}
          aria-describedby={describedBy}
          onChangeSearch={(e) => {
            setPlaceSearchValue(e.target.value);
          }}
          onChange={(e: { target: { value: unknown } }) => {
            handleSelectPlace(String(e.target.value));
          }}
          data-cy="facility-search"
        >
          <Combobox.Input
            id={id}
            placeholder={t('facility_search.placeholder')}
            className="w-full"
            disabled={!isEditable}
            readOnly={!!readonly}
            {...requiredProps(Boolean(required))}
            aria-labelledby={searchLabelId}
            aria-describedby={describedBy}
            aria-invalid={invalid}
            onBlur={() => {
              onBlur(id, formData);
            }}
            onFocus={() => {
              onFocus(id, formData);
            }}
          />
          <Combobox.List style={{ maxHeight: '32rem' }}>
            {selectablePlaceOptionNodes.map((node) => {
              const presentation = getPlaceSelectionPresentation(node);
              const optionText =
                presentation.department ?
                  `${presentation.place} — ${t('facility_search.department_label')}: ${presentation.department}`
                : presentation.place;

              return (
                <Combobox.Option
                  key={placeKey(node)}
                  value={placeKey(node)}
                  style={{
                    alignItems: 'flex-start',
                    lineHeight: 1.4,
                    overflowWrap: 'anywhere',
                    paddingBlock: '0.75rem',
                    whiteSpace: 'normal',
                  }}
                >
                  {optionText}
                </Combobox.Option>
              );
            })}
          </Combobox.List>
        </Combobox>
        {invalid && (
          <FormErrorMessage id={errorId(id)} className="text-error">
            {fieldErrors[0]}
          </FormErrorMessage>
        )}
      </FormControl>

      {/* Förhandsvalet av plats är bortkommenterat tills vidare – användaren söker fram platsen själv.
      {!selectedNode && suggestedNode && (
        <div className="border-1 rounded-12 bg-background-content w-full mt-16" data-cy="facility-suggestion">
          <div className="rounded-t-12 bg-juniskar-background-200 px-16 py-12">
            <strong>{t('facility_search.suggestion_header')}</strong>
          </div>
          <div className="p-16 flex flex-col gap-16">
            <div className="min-w-0">
              <p className="text-[1.6rem] font-semibold break-words" data-cy="facility-suggestion-name">
                {suggestedPlacePresentation?.place}
              </p>
              {suggestedPlacePresentation?.department && (
                <p className="text-small text-text-secondary break-words">
                  <span className="font-semibold">{t('facility_search.department_label')}:</span>{' '}
                  {suggestedPlacePresentation.department}
                </p>
              )}
            </div>

            <p className="text-small text-text-secondary">{t('facility_search.suggestion_description')}</p>

            <div className="flex flex-wrap gap-8 border-t-1 border-divider pt-12">
              <Button
                type="button"
                variant="primary"
                color="vattjom"
                size="sm"
                leftIcon={<Check size={16} aria-hidden="true" />}
                onClick={handleAcceptSuggestion}
                data-cy="facility-accept-suggestion-button"
              >
                {t('facility_search.suggestion_confirm')}
              </Button>
            </div>
          </div>
        </div>
      )}
      */}

      {mustChooseSubPlace && subPlaceParentNode && selectedNode ?
        <FormControl disabled={!isEditable} required={mustChooseSubPlace} className="mt-16 w-full">
          <FormFieldLabel id={subPlaceLabelId} className="font-bold">
            {t('facility_search.select_sub_place', { place: placeName(subPlaceParentNode) })}
          </FormFieldLabel>
          {subPlaceNodes.length <= MAX_RADIO_SUB_PLACES ?
            <RadioButton.Group aria-labelledby={subPlaceLabelId} data-cy="facility-sub-place-options">
              {subPlaceNodes.map((node) => (
                <RadioButton
                  key={placeKey(node)}
                  name="facility-sub-place"
                  value={placeKey(node)}
                  checked={isSameLabel(node.label, selectedNode.label)}
                  disabled={!isEditable}
                  onChange={(e) => {
                    handleSelectPlace(e.target.value);
                  }}
                >
                  {placeName(node)}
                </RadioButton>
              ))}
            </RadioButton.Group>
          : <Combobox
              className="w-full"
              value={selectedSubPlaceKey}
              aria-labelledby={subPlaceLabelId}
              onChange={(e: { target: { value: unknown } }) => {
                handleSelectPlace(String(e.target.value));
              }}
              data-cy="facility-sub-place-options"
            >
              <Combobox.Input placeholder={t('facility_search.placeholder')} className="w-full" />
              <Combobox.List style={{ maxHeight: '32rem' }}>
                {subPlaceNodes.map((node) => (
                  <Combobox.Option
                    key={placeKey(node)}
                    value={placeKey(node)}
                    style={{ overflowWrap: 'anywhere', whiteSpace: 'normal' }}
                  >
                    {placeName(node)}
                  </Combobox.Option>
                ))}
              </Combobox.List>
            </Combobox>
          }
          {mustChooseSubPlace && (
            <span className="text-small mt-4" data-cy="facility-sub-place-required">
              {t('facility_search.sub_place_required')}
            </span>
          )}
        </FormControl>
      : null}
    </div>
  );
}
