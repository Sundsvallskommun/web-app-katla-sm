import { ErrandContentLock } from '@components/errand-content-lock/errand-content-lock.component';
import { ErrandSection } from '@components/errand-sections/errand-section.component';
import { ErrandDTO } from '@data-contracts/backend/data-contracts';
import { render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';

const ErrandForm: React.FC<{ children: React.ReactNode; status: string }> = ({ children, status }) => {
  const methods = useForm<ErrandDTO>({ defaultValues: { status } });

  return <FormProvider {...methods}>{children}</FormProvider>;
};

describe('ErrandContentLock', () => {
  it('keeps draft controls enabled', () => {
    const { container } = render(
      <ErrandForm status="DRAFT">
        <ErrandContentLock>
          <input aria-label="Ärenderubrik" />
        </ErrandContentLock>
      </ErrandForm>
    );

    expect(container.querySelector('fieldset')).not.toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'Ärenderubrik' })).not.toBeDisabled();
  });

  it('disables controls when the errand has been sent', () => {
    const { container } = render(
      <ErrandForm status="NEW">
        <ErrandContentLock>
          <input aria-label="Ärenderubrik" />
        </ErrandContentLock>
      </ErrandForm>
    );

    expect(container.querySelector('fieldset')).toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'Ärenderubrik' })).toBeDisabled();
  });

  /**
   * Avsnitten fälls inte ihop längre. Innehållet ska därför alltid vara synligt och
   * rubriken alltid läsbar, medan låsningen fortfarande gäller fälten.
   */
  it('shows a section heading and its content without any toggle', () => {
    const { container } = render(
      <ErrandForm status="NEW">
        <ErrandSection header="Om ärendet">
          <input aria-label="Ärenderubrik" />
        </ErrandSection>
      </ErrandForm>
    );

    expect(screen.getByRole('heading', { name: 'Om ärendet' })).toBeVisible();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(container.querySelector('input')).toBeDisabled();
  });

  it('keeps section content editable while the errand is a draft', () => {
    const { container } = render(
      <ErrandForm status="DRAFT">
        <ErrandSection header="Om ärendet">
          <input aria-label="Ärenderubrik" />
        </ErrandSection>
      </ErrandForm>
    );

    expect(container.querySelector('input')).not.toBeDisabled();
  });

  /**
   * Avdelarna sätts av ErrandFormSections, som bara har dem vid de två stora skarvarna.
   * Avsnittet självt ska inte lägga till någon — annars dyker en upp mellan radioknapparna
   * i "Om ärendet" och rubriken för avsnittet under.
   */
  it('does not add a divider of its own', () => {
    const { container } = render(
      <ErrandForm status="DRAFT">
        <ErrandSection header="Om ärendet">
          <input aria-label="Ärenderubrik" />
        </ErrandSection>
      </ErrandForm>
    );

    expect(container.querySelector('hr.sk-divider')).not.toBeInTheDocument();
  });
});
