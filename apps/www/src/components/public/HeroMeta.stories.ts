import type { Meta, StoryObj } from '@storybook/vue3';

import HeroMeta from './HeroMeta.vue';

const meta = {
  title: 'Public/HeroMeta',
  component: HeroMeta,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    date: 'Tirsdag 23. juni · 16:00–22:00',
    location: 'Sluseholmen, ved trappen',
    elements: 6,
  },
} satisfies Meta<typeof HeroMeta>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
