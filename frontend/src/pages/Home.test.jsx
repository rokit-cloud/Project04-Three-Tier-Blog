import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Home from './Home';
import { api } from '../api/client';

vi.mock('../api/client', () => ({
  api: {
    listPosts: vi.fn(),
  },
}));

vi.mock('../components/PostCard', () => ({
  default: ({ post }) => <div>{post.title}</div>,
}));

describe('Home Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the home page and loading skeleton', () => {
    api.listPosts.mockReturnValue(new Promise(() => {}));

    const { container } = render(<Home />);

    expect(screen.getByRole('heading', { name: /Dispatches from the build pipeline/i })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Latest entries' })).toBeTruthy();
    expect(container.querySelectorAll('.skeleton')).toHaveLength(3);
  });

  it('displays posts after successful API response', async () => {
    api.listPosts.mockResolvedValueOnce({
      data: [
        { id: 1, title: 'Docker Deployment' },
        { id: 2, title: 'Kubernetes Guide' },
      ],
    });

    render(<Home />);

    expect(await screen.findByText('Docker Deployment')).toBeTruthy();
    expect(screen.getByText('Kubernetes Guide')).toBeTruthy();
    expect(api.listPosts).toHaveBeenCalledWith({});
  });

  it('filters posts by selected tag', async () => {
    api.listPosts.mockResolvedValue({ data: [] });

    render(<Home />);

    await waitFor(() => {
      expect(api.listPosts).toHaveBeenCalledWith({});
    });

    fireEvent.click(screen.getByRole('button', { name: 'security' }));

    await waitFor(() => {
      expect(api.listPosts).toHaveBeenLastCalledWith({ tag: 'security' });
    });
  });

  it('displays empty message when no posts are available', async () => {
    api.listPosts.mockResolvedValueOnce({ data: [] });

    render(<Home />);

    expect(
      await screen.findByText('No entries yet for this tag. Be the first to write one.')
    ).toBeTruthy();
  });

  it('displays API error message', async () => {
    api.listPosts.mockRejectedValueOnce(new Error('Server unavailable'));

    render(<Home />);

    expect(
      await screen.findByText(/Couldn't reach the API — Server unavailable/)
    ).toBeTruthy();
  });
});
