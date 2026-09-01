'use client';
import { ErrandContentLock } from '@components/errand-content-lock/errand-content-lock.component';
import { SectionHeader } from '@components/misc/section-header.component';
import type { ObjectFieldTemplateProps, RJSFSchema, UiSchema } from '@rjsf/utils';
import React from 'react';

interface ConditionalRule {
  if: {
    properties: Record<string, { const: unknown }>;
    required?: string[];
  };
  then: {
    required?: string[];
    properties?: Record<string, unknown>;
  };
}

interface RowDefinition {
  fields: string[];
  gap?: string;
  /**
   * Namngiven radlayout i stället för klasser i ui-schemat: Tailwind genererar bara klasser
   * den hittar i frontendkoden, och schemat ligger i backend. "narrow" är designens tvåfältsrad
   * med fast fältbredd, för fält som datum och tid där full bredd bara blir tomrum.
   */
  layout?: 'narrow';
}

const NARROW_ROW_GAP_CLASS = 'gap-40';
/**
 * Fälten i en smal rad ställs i linje med varandra genom att etikettblocket har plats för en
 * rubrik med hjälptext under: 2,4rem rubrik + 0,8rem mellanrum + 1,8rem hjälptext. Fältet utan
 * hjälptext hamnar då på samma höjd som grannens i stället för att hoppa upp till etiketten.
 *
 * Höjden är satt, inte växande: ett felmeddelande under fältet gör annars den kolumnen högre,
 * och grannens etikettblock skulle svälla lika mycket och flytta ned dess fält igen.
 */
const NARROW_ROW_FIELD_CLASS =
  'flex w-[32rem] max-w-full [&>.form-row]:flex [&>.form-row]:flex-col [&_.field-label-block]:min-h-[5rem]';

interface SectionDefinition {
  id: string;
  title: string;
  /** Valfri: alla avsnitt behöver inte förklaras, bara de vars innehåll inte är självklart. */
  description?: string;
  fields: string[];
}

interface FormContext {
  originalSchema?: RJSFSchema;
  compact?: boolean;
}

function isConditionMet(condition: ConditionalRule['if'], formData: Record<string, unknown>): boolean {
  if (!condition?.properties) return false;

  for (const [field, rule] of Object.entries(condition.properties)) {
    if ('const' in rule) {
      if (formData[field] !== rule.const) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Extracts field names from a then-block (required fields and property keys)
 */
function extractDependentFields(then: ConditionalRule['then']): string[] {
  return [...(then.required ?? []), ...(then.properties ? Object.keys(then.properties) : [])];
}

/**
 * Extracts all conditional fields from the schema based on if/then rules
 */
function getConditionalFields(schema: RJSFSchema): Map<string, ConditionalRule['if']> {
  const conditionalFields = new Map<string, ConditionalRule['if']>();

  // Handle allOf with if/then
  const allOf = schema.allOf as ConditionalRule[] | undefined;
  if (allOf) {
    for (const rule of allOf) {
      if (rule.if && rule.then) {
        for (const field of extractDependentFields(rule.then)) {
          conditionalFields.set(field, rule.if);
        }
      }
    }
  }

  // Handle simple if/then at root level
  const rootIf = schema.if as ConditionalRule['if'] | undefined;
  const rootThen = schema.then as ConditionalRule['then'] | undefined;
  if (rootIf && rootThen) {
    for (const field of extractDependentFields(rootThen)) {
      conditionalFields.set(field, rootIf);
    }
  }

  return conditionalFields;
}

/**
 * Extracts row definitions from uiSchema
 */
function getRowDefinitions(uiSchema: UiSchema | undefined): RowDefinition[] {
  return (uiSchema?.['ui:rows'] ?? []) as RowDefinition[];
}

/**
 * Extracts section definitions from uiSchema
 */
function getSectionDefinitions(uiSchema: UiSchema | undefined): SectionDefinition[] {
  return (uiSchema?.['ui:sections'] ?? []) as SectionDefinition[];
}

/**
 * Formulärets avsnitt: ett eget kort med rubrik och fälten under, likadant som ärendets övriga
 * avsnitt. Felen står vid sina fält och samlat i sammanfattningen överst — avsnittet självt
 * bär ingen status.
 */
interface FormSectionProps {
  section: SectionDefinition;
  children: React.ReactNode;
}

function FormSection({ section, children }: FormSectionProps) {
  return (
    <section className="bg-background-color-mixin-1 rounded-utility w-full p-16 md:p-32">
      <div className="mb-32">
        <SectionHeader as="h3" title={section.title} description={section.description} />
      </div>
      <ErrandContentLock>{children}</ErrandContentLock>
    </section>
  );
}

/**
 * Renders fields based on order, rows, and visibility
 */
function renderFields(
  fieldNames: string[],
  properties: ObjectFieldTemplateProps['properties'],
  visibleFields: Set<string>,
  rows: RowDefinition[],
  rowFieldNames: Set<string>,
  renderedRows: Set<string>,
  compact = false
) {
  return fieldNames.map((fieldName) => {
    // Skip hidden fields
    if (!visibleFields.has(fieldName)) return null;

    // Check if field is the first field in a row
    const row = rows.find((r) => r.fields[0] === fieldName);
    if (row) {
      // Skip if we've already rendered this row
      const rowKey = row.fields.join('-');
      if (renderedRows.has(rowKey)) return null;
      renderedRows.add(rowKey);

      // Filter out hidden fields from the row
      const visibleRowFields = row.fields.filter((f) => visibleFields.has(f));
      if (visibleRowFields.length === 0) return null;

      const narrow = row.layout === 'narrow';
      const rowGapClass =
        compact ? 'flex-col gap-32'
        : narrow ? NARROW_ROW_GAP_CLASS
        : (row.gap ?? '') || 'gap-32';
      const rowFieldClass =
        compact ? ''
        : narrow ? NARROW_ROW_FIELD_CLASS
        : 'flex-1';

      return (
        <div key={rowKey} className={`flex flex-wrap ${rowGapClass}`}>
          {visibleRowFields.map((f) => {
            const prop = properties.find((p) => p.name === f);
            return prop ?
                <div key={f} className={rowFieldClass}>
                  {prop.content}
                </div>
              : null;
          })}
        </div>
      );
    }

    // Skip if field is part of a row but not the first (already rendered with row)
    if (rowFieldNames.has(fieldName)) return null;

    // Standalone field
    const prop = properties.find((p) => p.name === fieldName);
    return prop ? <div key={fieldName}>{prop.content}</div> : null;
  });
}

/**
 * ObjectFieldTemplate that hides fields based on if/then conditions in the schema
 * and supports ui:rows for horizontal field grouping and ui:sections for heading grouping
 */
export function ObjectFieldTemplate(props: ObjectFieldTemplateProps) {
  const { properties, uiSchema } = props;
  const formData = props.formData as Record<string, unknown> | undefined;

  // Get original schema from formContext (RJSF processes and removes allOf from schema prop)
  const ctx = props.formContext as FormContext | undefined;
  const originalSchema = ctx?.originalSchema;
  const conditionalFields =
    originalSchema ? getConditionalFields(originalSchema) : new Map<string, ConditionalRule['if']>();

  // Get row and section definitions from uiSchema
  const rows = getRowDefinitions(uiSchema);
  const rowFieldNames = new Set(rows.flatMap((r) => r.fields));
  const sections = getSectionDefinitions(uiSchema);

  // Get field order from uiSchema or use properties order
  const order = uiSchema?.['ui:order'] ?? properties.map((p) => p.name);

  // Filter out hidden conditional fields
  const visibleFields = new Set<string>();
  for (const prop of properties) {
    const condition = conditionalFields.get(prop.name);
    if (condition) {
      if (isConditionMet(condition, formData ?? {})) {
        visibleFields.add(prop.name);
      }
    } else {
      visibleFields.add(prop.name);
    }
  }

  const compact = ctx?.compact ?? false;

  // If no sections defined, use original flat rendering
  if (sections.length === 0) {
    const renderedRows = new Set<string>();
    return (
      <div className="flex flex-col gap-32">
        {renderFields(order, properties, visibleFields, rows, rowFieldNames, renderedRows, compact)}
      </div>
    );
  }

  // Track which fields belong to sections
  const sectionFieldNames = new Set(sections.flatMap((s) => s.fields));

  // Find fields not in any section (to render at the end)
  const unsectionedFields = order.filter((f) => !sectionFieldNames.has(f) && visibleFields.has(f));

  // Track rendered rows across all sections
  const renderedRows = new Set<string>();

  return (
    // Korten skiljs åt av luften mellan dem, och behöver mer än fälten inuti ett kort.
    // Wizarden har inga kort och behåller sitt tätare avstånd.
    <div className={`flex flex-col ${compact ? 'gap-32' : 'gap-48'}`}>
      {/* Render sections */}
      {sections.map((section) => {
        // Get visible fields for this section in order
        const sectionFieldsInOrder = order.filter((f) => section.fields.includes(f) && visibleFields.has(f));

        // Skip empty sections
        if (sectionFieldsInOrder.length === 0) return null;

        if (compact) {
          return (
            <div key={section.id} className="flex flex-col gap-32">
              {renderFields(
                sectionFieldsInOrder,
                properties,
                visibleFields,
                rows,
                rowFieldNames,
                renderedRows,
                compact
              )}
            </div>
          );
        }

        return (
          <FormSection key={section.id} section={section}>
            <div className="flex flex-col gap-40">
              {renderFields(sectionFieldsInOrder, properties, visibleFields, rows, rowFieldNames, renderedRows)}
            </div>
          </FormSection>
        );
      })}

      {/* Render fields not in any section */}
      {unsectionedFields.length > 0 && (
        <div className="flex flex-col gap-32">
          {renderFields(unsectionedFields, properties, visibleFields, rows, rowFieldNames, renderedRows, compact)}
        </div>
      )}
    </div>
  );
}
