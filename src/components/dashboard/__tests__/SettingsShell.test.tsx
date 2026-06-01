import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

// Mock services
vi.mock('@/services/enhancedProfileApi', () => ({
  getEnhancedProfile: vi.fn().mockResolvedValue({
    fullName: 'Test User',
    email: 'test@example.com',
    education: [],
    skills: [],
    tools: [],
    certifications: [],
    careerGoal: '',
    jobTitle: '',
    experienceLevel: 'beginner',
    profilePhotoUrl: '',
    isProfilePublic: true,
    visibility: {},
    projects: [],
  }),
  updateEnhancedProfile: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/services/profileApi', () => ({
  uploadProfilePhoto: vi.fn().mockResolvedValue({ profilePhotoUrl: '/uploads/test.png' }),
  deleteAccount: vi.fn(),
}));

vi.mock('@/utils/authToken', () => ({ getCurrentUserIdFromToken: () => '123' }));

// Mock toast to capture messages
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    message: vi.fn(),
  },
}));

import { SettingsShell } from '../SettingsShell';
import * as profileApi from '@/services/profileApi';

describe('SettingsShell', () => {
  it('rejects unsupported file types', async () => {
    // Mock Image load behavior for jsdom
    global.Image = class {
      onload: any;
      onerror: any;
      set src(_src: string) {
        if (this.onload) this.onload();
      }
    } as any;

    const { getByText, container } = render(
      <MemoryRouter>
        <SettingsShell />
      </MemoryRouter>,
    );

    // Wait for profile load
    await waitFor(() => getByText('System Settings'));

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['hello'], 'test.txt', { type: 'text/plain' });

    // Simulate file selection by firing change event with files on target
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      // uploadProfilePhoto should not have been called
      expect(profileApi.uploadProfilePhoto).not.toHaveBeenCalled();
    });
  });

  it('uploads valid image files', async () => {
    global.Image = class {
      onload: any;
      onerror: any;
      set src(_src: string) {
        if (this.onload) this.onload();
      }
    } as any;

    const { getByText, container } = render(
      <MemoryRouter>
        <SettingsShell />
      </MemoryRouter>,
    );
    await waitFor(() => getByText('System Settings'));

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    // small PNG file simulation
    const blob = new Blob([new Uint8Array([137,80,78,71])], { type: 'image/png' });
    const file = new File([blob], 'avatar.png', { type: 'image/png' });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(profileApi.uploadProfilePhoto).toHaveBeenCalled();
    });
  });
});
