import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import NewPost from './NewPost';
import { api } from '../api/client';
import { useAuth } from '../api/AuthContext';

vi.mock('../api/client', () => ({
  api: {
    createPost: vi.fn(),
  },
}));

vi.mock('../api/AuthContext', () => ({
  useAuth: vi.fn(),
}));

function renderNewPost() {
  return render(
    <MemoryRouter initialEntries={['/new']}>
      <Routes>
        <Route path="/new" element={<NewPost />} />
        <Route path="/post/:slug" element={<div>Post Created Successfully</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('NewPost Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('asks user to sign in when no user is logged in', () => {
    useAuth.mockReturnValue({ user: null });
    renderNewPost();

    expect(screen.getByText('Sign in to write an entry.')).toBeTruthy();
  });

  it('renders the new entry form for logged-in user', () => {
    useAuth.mockReturnValue({ user: { id: 1 } });
    renderNewPost();

    expect(screen.getByRole('heading', { name: 'New entry' })).toBeTruthy();
    expect(screen.getByLabelText('Title')).toBeTruthy();
    expect(screen.getByLabelText('Tag')).toBeTruthy();
    expect(screen.getByLabelText('Excerpt (optional)')).toBeTruthy();
    expect(screen.getByLabelText('Body')).toBeTruthy();
  });

  it('creates a post successfully', async () => {
    useAuth.mockReturnValue({ user: { id: 1 } });
    api.createPost.mockResolvedValueOnce({ slug: 'my-first-post' });

    renderNewPost();

    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'My First Post' },
    });
    fireEvent.change(screen.getByLabelText('Tag'), {
      target: { value: 'cloud' },
    });
    fireEvent.change(screen.getByLabelText('Excerpt (optional)'), {
      target: { value: 'A short introduction' },
    });
    fireEvent.change(screen.getByLabelText('Body'), {
      target: { value: 'This is the full content of my first blog post.' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Publish entry' }));

    await waitFor(() => {
      expect(api.createPost).toHaveBeenCalledWith({
        title: 'My First Post',
        tag: 'cloud',
        excerpt: 'A short introduction',
        body: 'This is the full content of my first blog post.',
      });
      expect(screen.getByText('Post Created Successfully')).toBeTruthy();
    });
  });

  it('displays an error when post creation fails', async () => {
    useAuth.mockReturnValue({ user: { id: 1 } });
    api.createPost.mockRejectedValueOnce(new Error('Unable to publish post'));

    renderNewPost();

    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Test Post' },
    });
    fireEvent.change(screen.getByLabelText('Body'), {
      target: { value: 'This is enough content for the test post.' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Publish entry' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to publish post');
  });

  it('shows loading state while publishing', async () => {
    useAuth.mockReturnValue({ user: { id: 1 } });

    let resolvePost;
    api.createPost.mockReturnValueOnce(
      new Promise((resolve) => {
        resolvePost = resolve;
      })
    );

    renderNewPost();

    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Loading Test' },
    });
    fireEvent.change(screen.getByLabelText('Body'), {
      target: { value: 'This is enough content for the loading test.' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Publish entry' }));

    expect(await screen.findByRole('button', { name: 'Publishing…' })).toBeDisabled();

    resolvePost({ slug: 'loading-test' });

    await waitFor(() => {
      expect(screen.getByText('Post Created Successfully')).toBeTruthy();
    });
  });
});
