import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DetailPane } from '@/components/DetailPane/DetailPane';
import { CVESummary } from '@/types/cve';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '../setup';

const mockCVE: CVESummary = {
  id: 'CVE-2023-9999',
  description: 'A serious vulnerability in test software.',
  cvssScore: 8.8,
  severity: 'HIGH',
  affectedProducts: ['TestOS'],
  publishedDate: '2023-01-01',
  lastModifiedDate: '2023-01-01',
};

const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe('DetailPane Component', () => {
  it('renders a welcome message when no CVE is selected', () => {
    const queryClient = createQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <DetailPane selectedCVE={null} />
      </QueryClientProvider>
    );
    expect(screen.getByText(/No Vulnerability Selected/i)).toBeInTheDocument();
  });

  it('renders CVE details and fetches AI analysis', async () => {
    const mockAiData = {
      technicalReality: 'Real technical details.',
      plainEnglish: 'Simple explanation.',
      analogy: 'Like a broken door.',
      howToFix: 'Update your systems.',
      readingTimeMinutes: 2,
      difficulty: 'Intermediate'
    };

    server.use(
      http.post('/api/explain', () => {
        return HttpResponse.json(mockAiData);
      })
    );

    const queryClient = createQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <DetailPane selectedCVE={mockCVE} />
      </QueryClientProvider>
    );

    // Check fixed fields
    expect(screen.getByText('CVE-2023-9999')).toBeInTheDocument();
    
    // Check AI-fetched fields (Wait for them to appear)
    await waitFor(() => {
      expect(screen.getByText('Real technical details.')).toBeInTheDocument();
    });

    // Tier 3 sections are collapsed by default. Need to expand them.
    const analogyToggle = screen.getByText('The Analogy');
    fireEvent.click(analogyToggle);

    await waitFor(() => {
      expect(screen.getByText('\"Like a broken door.\"')).toBeInTheDocument();
    });
  });
});
