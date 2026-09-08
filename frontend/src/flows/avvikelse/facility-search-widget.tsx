'use client';
import { RadioList, RadioListItem } from '@astryxdesign/core/RadioList';
import { Stack } from '@astryxdesign/core/Stack';
import { type SearchableItem, type SearchSource, Typeahead } from '@astryxdesign/core/Typeahead';
import { collectFieldErrors } from '@components/json/utils/schema-form-error-handling';
import { FacilityInfoDTO, UserEmploymentDTO } from '@data-contracts/backend/data-contracts';
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
} from '@katla/definitions/avvikelse';
import { stripHtml } from '@katla/definitions/schema-validation';
import type { FieldProps } from '@rjsf/utils';
import { getUserEmployments } from '@services/employee-service/employee-service';
import { INVALID_FIELD_ATTRIBUTE } from '@utils/focus-first-error';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useMetadataStore } from 'src/stores/metadata-store';

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

  const employmentMatchRef = useRef<{ node: PlaceNode; employment: UserEmploymentDTO } | null>(null);
  const employmentLookupDoneRef = useRef(false);

  const isEditable = !disabled && !readonly;

  const selectedNode = useMemo(
    () => findPlaceNode(placeNodes, formData?.orgName, formData?.parentOrgName),
    [placeNodes, formData?.orgName, formData?.parentOrgName]
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

  // Slår upp användarens anställning i labelstrukturen: selectPlace fyller i
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
            return;
          }
        }
      } catch (error) {
        console.error('Failed to load employments:', error);
      }
    };

    void lookUpEmployment();
  }, [isEditable, placeNodes, formData?.orgName]);

  const handleSelectPlace = useCallback(
    (key: string) => {
      const node = findPlaceNodeByKey(placeNodes, key);
      if (node) {
        selectPlace(node);
      }
    },
    [placeNodes, selectPlace]
  );

  const toSearchItem = useCallback(
    (node: PlaceNode): SearchableItem<PlaceNode> => {
      const presentation = getPlaceSelectionPresentation(node);
      return {
        id: placeKey(node),
        label:
          presentation.department ?
            `${presentation.place} — ${t('facility_search.department_label')}: ${presentation.department}`
          : presentation.place,
        auxiliaryData: node,
      };
    },
    [t]
  );
  const searchSource = useMemo<SearchSource<SearchableItem<PlaceNode>>>(
    () => ({
      search: (query) => selectablePlaceNodes.filter((node) => matchesPlaceSearch(node, query)).map(toSearchItem),
      bootstrap: () => selectablePlaceNodes.map(toSearchItem),
    }),
    [selectablePlaceNodes, toSearchItem]
  );
  const subPlaceSource = useMemo<SearchSource>(
    () => ({
      search: (query) =>
        subPlaceNodes
          .filter((node) => matchesPlaceSearch(node, query))
          .map((node) => ({ id: placeKey(node), label: placeName(node) })),
      bootstrap: () => subPlaceNodes.map((node) => ({ id: placeKey(node), label: placeName(node) })),
    }),
    [subPlaceNodes]
  );

  if (!metadata) {
    return (
      <Stack className={className}>
        <p className="text-muted">{t('facility_search.loading')}</p>
      </Stack>
    );
  }

  if (placeNodes.length === 0) {
    return (
      <Stack className={className}>
        <p className="text-danger" data-cy="facility-structure-missing">
          {t('facility_search.no_place_structure')}
        </p>
      </Stack>
    );
  }

  return (
    <Stack
      className={className}
      id={id}
      {...(invalid ? { [INVALID_FIELD_ATTRIBUTE]: id } : {})}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) onBlur(id, formData);
      }}
      onFocus={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) onFocus(id, formData);
      }}
    >
      <Stack data-cy="facility-search">
        <Typeahead
          label={t('facility_search.search_label')}
          description={props.schema.description ? stripHtml(props.schema.description) : undefined}
          isRequired={Boolean(required)}
          isOptional={!required}
          placeholder={t('facility_search.placeholder')}
          searchSource={searchSource}
          value={selectedNode ? toSearchItem(selectedNode) : null}
          onChange={(item) => {
            if (item?.auxiliaryData) selectPlace(item.auxiliaryData);
          }}
          isDisabled={!isEditable}
          hasClear={false}
          hasEntriesOnFocus
          maxMenuItems={selectablePlaceNodes.length}
          debounceMs={0}
          width="100%"
          status={invalid ? { type: 'error', message: fieldErrors[0] } : undefined}
          statusVariant="detached"
        />
      </Stack>
      {mustChooseSubPlace && subPlaceParentNode && selectedNode && (
        <Stack paddingBlockStart={4} data-cy="facility-sub-place-options">
          {subPlaceNodes.length <= MAX_RADIO_SUB_PLACES ?
            <RadioList
              label={t('facility_search.select_sub_place', { place: placeName(subPlaceParentNode) })}
              htmlName={`${id}-sub-place`}
              value={selectedSubPlaceKey}
              onChange={handleSelectPlace}
              isRequired
              isDisabled={!isEditable}
            >
              {subPlaceNodes.map((node) => (
                <RadioListItem key={placeKey(node)} value={placeKey(node)} label={placeName(node)} />
              ))}
            </RadioList>
          : <Typeahead
              label={t('facility_search.select_sub_place', { place: placeName(subPlaceParentNode) })}
              placeholder={t('facility_search.placeholder')}
              searchSource={subPlaceSource}
              value={null}
              onChange={(item) => {
                if (item) handleSelectPlace(item.id);
              }}
              isRequired
              isDisabled={!isEditable}
              hasEntriesOnFocus
              hasClear={false}
              maxMenuItems={subPlaceNodes.length}
              debounceMs={0}
              width="100%"
            />
          }
          <p className="mt-2 text-sm text-muted" data-cy="facility-sub-place-required">
            {t('facility_search.sub_place_required')}
          </p>
        </Stack>
      )}
    </Stack>
  );
}
