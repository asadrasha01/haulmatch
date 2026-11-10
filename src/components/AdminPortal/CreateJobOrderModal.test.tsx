import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { CreateJobOrderModal } from './CreateJobOrderModal';

describe('CreateJobOrderModal — Direct Fleet Job Order Phone Intake', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <CreateJobOrderModal isOpen={false} onClose={vi.fn()} onSubmit={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders required form fields when open', () => {
    render(
      <CreateJobOrderModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} />
    );

    expect(screen.getByText(/CARRIER INTAKE \/\/ NEW FLEET JOB REQUISITION/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Carrier Company Name \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Contact Name \*/i)).toBeInTheDocument();
    expect(screen.getByText(/Create & Match Requisition/i)).toBeInTheDocument();
  });

  it('validates required fields before calling onSubmit', async () => {
    const onSubmitMock = vi.fn();
    render(
      <CreateJobOrderModal isOpen={true} onClose={vi.fn()} onSubmit={onSubmitMock} />
    );

    const submitBtn = screen.getByText(/Create & Match Requisition/i);
    fireEvent.click(submitBtn);

    expect(onSubmitMock).not.toHaveBeenCalled();
  });

  it('submits a valid fleet job order with custom parameters', async () => {
    const onSubmitMock = vi.fn().mockResolvedValue(undefined);
    const onCloseMock = vi.fn();

    render(
      <CreateJobOrderModal isOpen={true} onClose={onCloseMock} onSubmit={onSubmitMock} />
    );

    fireEvent.change(screen.getByPlaceholderText(/e\.g\. Apex Freight Lines LLC/i), {
      target: { value: 'Horizon Freight Lines' }
    });
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. Sarah Jenkins/i), {
      target: { value: 'Marcus Brody' }
    });
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. \(214\) 555-0199/i), {
      target: { value: '(312) 555-8822' }
    });
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. recruiting@apex\.com/i), {
      target: { value: 'm.brody@horizonfreight.com' }
    });

    const submitBtn = screen.getByText(/Create & Match Requisition/i);
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalledWith(
        expect.objectContaining({
          companyName: 'Horizon Freight Lines',
          contactName: 'Marcus Brody',
          contactPhone: '(312) 555-8822',
          contactEmail: 'm.brody@horizonfreight.com'
        })
      );
    });

    expect(onCloseMock).toHaveBeenCalled();
  });
});

