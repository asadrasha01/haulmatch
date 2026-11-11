import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { GuidedTourBar } from './GuidedTourBar';
import { TOUR_STEPS } from '../../data/tourSteps';

describe('GuidedTourBar — Interactive 4-Step Marketplace Walkthrough', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <GuidedTourBar
        isOpen={false}
        currentStep={1}
        onStepChange={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders all 4 steps and displays step 1 details initially', () => {
    render(
      <GuidedTourBar
        isOpen={true}
        currentStep={1}
        onStepChange={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText(/guided demo tour/i)).toBeInTheDocument();
    expect(screen.getByText(/01\. Driver Apply & Video/i)).toBeInTheDocument();
    expect(screen.getByText(/02\. Carrier Blind Unlock/i)).toBeInTheDocument();
    expect(screen.getByText(/03\. Driver Cabin Cockpit/i)).toBeInTheDocument();
    expect(screen.getByText(/04\. Admin Ops & Sentinel/i)).toBeInTheDocument();

    expect(
      screen.getByText(/Driver applies in 2 minutes & passes AI video screening/i)
    ).toBeInTheDocument();
  });

  it('triggers step change when clicking a step pill', async () => {
    const user = userEvent.setup();
    const onStepChange = vi.fn();

    render(
      <GuidedTourBar
        isOpen={true}
        currentStep={1}
        onStepChange={onStepChange}
        onClose={vi.fn()}
      />
    );

    await user.click(screen.getByText(/03\. Driver Cabin Cockpit/i));
    expect(onStepChange).toHaveBeenCalledWith(3);
  });

  it('advances on Next Step and respects Back button', async () => {
    const user = userEvent.setup();
    const onStepChange = vi.fn();

    const { rerender } = render(
      <GuidedTourBar
        isOpen={true}
        currentStep={1}
        onStepChange={onStepChange}
        onClose={vi.fn()}
      />
    );

    // Back is disabled on step 1
    const backBtn = screen.getByRole('button', { name: /back/i });
    expect(backBtn).toBeDisabled();

    // Next step clicks
    const nextBtn = screen.getByRole('button', { name: /next step/i });
    await user.click(nextBtn);
    expect(onStepChange).toHaveBeenCalledWith(2);

    // Re-render on step 2
    rerender(
      <GuidedTourBar
        isOpen={true}
        currentStep={2}
        onStepChange={onStepChange}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /back/i })).not.toBeDisabled();
    await user.click(screen.getByRole('button', { name: /back/i }));
    expect(onStepChange).toHaveBeenCalledWith(1);
  });

  it('toggles commercial economics panel', async () => {
    const user = userEvent.setup();

    render(
      <GuidedTourBar
        isOpen={true}
        currentStep={2}
        onStepChange={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.queryByText(/carrier economics/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /\$4,500 economics/i }));
    expect(screen.getByText(/carrier economics/i)).toBeInTheDocument();
    expect(screen.getByText(/driver economics/i)).toBeInTheDocument();
    expect(screen.getByText(/haulmatch revenue & guarantee/i)).toBeInTheDocument();
  });

  it('triggers action button for current step', async () => {
    const user = userEvent.setup();
    const onTriggerAction = vi.fn();

    render(
      <GuidedTourBar
        isOpen={true}
        currentStep={2}
        onStepChange={vi.fn()}
        onClose={vi.fn()}
        onTriggerAction={onTriggerAction}
      />
    );

    const actionBtn = screen.getByRole('button', {
      name: /spotlight candidate cdl-8421 \(marcus vance\)/i
    });
    await user.click(actionBtn);
    expect(onTriggerAction).toHaveBeenCalledWith(TOUR_STEPS[1]);
  });

  it('triggers close handler', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <GuidedTourBar
        isOpen={true}
        currentStep={1}
        onStepChange={vi.fn()}
        onClose={onClose}
      />
    );

    await user.click(screen.getByRole('button', { name: /close tour/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
