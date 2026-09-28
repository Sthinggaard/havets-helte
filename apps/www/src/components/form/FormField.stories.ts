import type { Meta, StoryObj } from '@storybook/vue3';

import FormControl from './FormControl.vue';
import FormField from './FormField.vue';

const meta = {
  title: 'Forms/FormField',
  component: FormField,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { label: 'Opgavetitel', forId: 'story-field', required: true },
} satisfies Meta<typeof FormField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: args => ({
    components: { FormControl, FormField },
    setup: () => ({ args }),
    template: '<FormField v-bind="args"><FormControl id="story-field" placeholder="fx Klargøring" /></FormField>',
  }),
};
