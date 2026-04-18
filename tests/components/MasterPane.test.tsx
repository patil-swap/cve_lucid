import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MasterPane } from '@/components/MasterPane/MasterPane';
import { CVESummary } from '@/types/cve';

const mockCves: CVESummary[] = [
  {
    id: 'CVE-2023-0001',
    description: 'Test CVE 1',
    cvssScore: 9.8,
    severity: 'CRITICAL',
    affectedProducts: ['Product A'],
    publishedDate: '2023-01-01',
    lastModifiedDate: '2023-01-01',
  },
  {
    id: 'CVE-2023-0002',
    description: 'Test CVE 2',
    cvssScore: 4.5,
    severity: 'MEDIUM',
    affectedProducts: ['Product B'],
    publishedDate: '2023-01-01',
    lastModifiedDate: '2023-01-01',
  }
];

describe('MasterPane Component', () => {
  const defaultProps = {
    cves: mockCves,
    isLoading: false,
    activeId: null,
    onSelect: vi.fn(),
    page: 1,
    totalResults: 100,
    onPageChange: vi.fn(),
    severityFilter: 'ALL',
    onFilterToggle: vi.fn(),
    onFilterSelect: vi.fn(),
  };

  it('renders a list of CVE cards', () => {
    render(<MasterPane {...defaultProps} />);
    expect(screen.getByText('CVE-2023-0001')).toBeInTheDocument();
    expect(screen.getByText('CVE-2023-0002')).toBeInTheDocument();
  });

  it('shows skeleton cards when loading', () => {
    render(<MasterPane {...defaultProps} isLoading={true} />);
    // SkeletonCard uses animate-pulse, we can check for the presence of the containers
    const skeletons = screen.getAllByRole('generic').filter(el => el.className.includes('animate-pulse'));
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('calls onPageChange when Next button is clicked', () => {
    const twentyCves = Array(20).fill(mockCves[0]);
    render(<MasterPane {...defaultProps} cves={twentyCves} />);
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    expect(defaultProps.onPageChange).toHaveBeenCalledWith(2);
  });

  it('displays empty state when no CVEs are found', () => {
    render(<MasterPane {...defaultProps} cves={[]} />);
    expect(screen.getByText(/No vulnerabilities found matching criteria/i)).toBeInTheDocument();
  });
});
