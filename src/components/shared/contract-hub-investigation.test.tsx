import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, test, expect, afterEach } from 'vitest';
import { getFunctionName } from 'convex/server';
const mocks = vi.hoisted(() => ({ create: vi.fn().mockResolvedValue('contract'), upload: vi.fn().mockResolvedValue('https://synthetic.invalid/upload') }));
vi.mock('convex/react', () => ({
    useQuery: (ref: Parameters<typeof getFunctionName>[0]) => {
        const name = getFunctionName(ref);
        if (name === 'users:viewer') return { role: 'district_admin' };
        if (name === 'engagements:listMine') return [{ _id: 'engagement', orgName: 'Synthetic District', title: 'Synthetic QA engagement' }];
        return [];
    },
    useMutation: (ref: Parameters<typeof getFunctionName>[0]) => getFunctionName(ref) === 'contracts:generateUploadUrl' ? mocks.upload : mocks.create,
}));
vi.mock('@/components/shared/sidebar', () => ({ Sidebar: () => null }));
import { ContractHub } from './contract-hub';
afterEach(() => { vi.unstubAllGlobals(); mocks.create.mockClear(); });
test('characterizes HTTP upload failure: current UI still creates a metadata-only agreement', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({ error: 'Synthetic upload failure' }) }));
    render(<ContractHub role="district" />);
    fireEvent.change(screen.getByLabelText('Engagement'), { target: { value: 'engagement' } });
    fireEvent.change(screen.getByLabelText('File'), { target: { files: [new File(['SYNTHETIC QA — NOT A REAL AGREEMENT'], 'same-long-synthetic-agreement-filename.pdf', { type: 'application/pdf' })] } });
    await waitFor(() => expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ storageId: undefined, title: 'Consulting agreement' })));
});
