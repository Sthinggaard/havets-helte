import type { Meta, StoryObj } from '@storybook/vue3';

import SectionAddButton from './SectionAddButton.vue';

const meta = {
  title: 'Admin/SectionAddButton',
  component: SectionAddButton,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { label: 'Tilføj opgavesektion' },
} satisfies Meta<typeof SectionAddButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SectionTypes: Story = {
  render: () => ({
    components: { SectionAddButton },
    template: `
      <div style="display: grid; gap: 12px; max-width: 520px">
        <SectionAddButton tone="signup" label="Tilføj tilmeldingssektion" />
        <SectionAddButton tone="task" label="Tilføj opgavesektion" />
        <SectionAddButton tone="shift" label="Tilføj vagtsektion" />
        <SectionAddButton tone="shift" icon="ti-copy" label="Kopiér vagtsektion" />
      </div>
    `,
  }),
};
