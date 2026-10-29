import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const { getPost, addComment, useAuth } = vi.hoisted(() => ({
  getPost: vi.fn(),
  addComment: vi.fn(),
  useAuth: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useParams: () => ({ slug: 'test-post' }),
}));

vi.mock('../api/client', () => ({
  api: {
    getPost,
    addComment,
  },
}));

vi.mock('../api/AuthContext', () => ({
  useAuth,
}));

vi.mock('../components/ReadingSpine', () => ({
  default: () => <div data-testid="reading-spine" />,
}));

import PostDetail from './PostDetail';

const samplePost = {
  tag: 'Engineering',
  title: 'Test article',
  author_name: 'Test Author',
  created_at: '2026-01-15T12:00:00.000Z',
  read_minutes: 5,
  body: 'Article body for testing.',
  comments: [
    {
      id: 1,
      author_name: 'Comment Author',
      created_at: '2026-01-16T12:00:00.000Z',
      body: 'Existing comment',
    },
  ],
};

describe('PostDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: null });
    getPost.mockResolvedValue(samplePost);
    addComment.mockResolvedValue({});
  });

  it('shows loading before the post is loaded', () => {
    getPost.mockReturnValue(new Promise(() => {}));

    render(<PostDetail />);

    expect(screen.getByText('Loading entry…')).toBeInTheDocument();
  });

  it('renders post details and existing comments', async () => {
    render(<PostDetail />);

    expect(await screen.findByText('Test article')).toBeInTheDocument();
    expect(screen.getByText('Article body for testing.')).toBeInTheDocument();
    expect(screen.getByText('Existing comment')).toBeInTheDocument();
    expect(screen.getByText('5 min read')).toBeInTheDocument();
    expect(screen.getByTestId('reading-spine')).toBeInTheDocument();
  });

  it('shows an API error when loading fails', async () => {
    getPost.mockRejectedValueOnce(new Error('Unable to load post'));

    render(<PostDetail />);

    expect(await screen.findByText('Unable to load post')).toBeInTheDocument();
  });

  it('asks signed-out visitors to sign in before commenting', async () => {
    render(<PostDetail />);

    expect(
      await screen.findByText('Sign in to leave a note in the margin.')
    ).toBeInTheDocument();

    expect(screen.queryByLabelText('Add a note')).not.toBeInTheDocument();
  });

  it('submits a comment and reloads the post', async () => {
    useAuth.mockReturnValue({ user: { id: 7 } });

    render(<PostDetail />);

    const textarea = await screen.findByLabelText('Add a note');
    fireEvent.change(textarea, { target: { value: 'A useful note' } });
    fireEvent.click(screen.getByRole('button', { name: 'Post note' }));

    await waitFor(() => {
      expect(addComment).toHaveBeenCalledWith('test-post', 'A useful note');
      expect(getPost).toHaveBeenCalledTimes(2);
    });

    expect(textarea).toHaveValue('');
  });

  it('does not submit an empty comment', async () => {
    useAuth.mockReturnValue({ user: { id: 7 } });

    render(<PostDetail />);

    await screen.findByLabelText('Add a note');
    fireEvent.click(screen.getByRole('button', { name: 'Post note' }));

    expect(addComment).not.toHaveBeenCalled();
  });

  it('shows an error when comment submission fails', async () => {
    useAuth.mockReturnValue({ user: { id: 7 } });
    addComment.mockRejectedValueOnce(new Error('Comment failed'));

    render(<PostDetail />);

    const textarea = await screen.findByLabelText('Add a note');
    fireEvent.change(textarea, { target: { value: 'My note' } });
    fireEvent.click(screen.getByRole('button', { name: 'Post note' }));

    expect(await screen.findByText('Comment failed')).toBeInTheDocument();
  });
});
