import type { Meta, StoryObj } from '@storybook/vue3';

import PageCard from './PageCard.vue';

const meta = {
  title: 'Layout/PageCard',
  component: PageCard,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof PageCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: args => ({
    components: { PageCard },
    setup: () => ({ args }),
    template: `
      <PageCard v-bind="args">
        <template #header><p class="eyebrow">Eksempel</p><h2 class="page-title">Indholdskort</h2></template>
        <p class="lead">Et fælles kort til admin- og indholdssider.</p>
      </PageCard>
    `,
  }),
};
