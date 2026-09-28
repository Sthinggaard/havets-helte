import type { Meta, StoryObj } from '@storybook/vue3';
import { ref } from 'vue';

import FormControl from './FormControl.vue';
import FormField from './FormField.vue';

const meta = {
  title: 'Forms/FormControl',
  component: FormControl,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof FormControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InputsAndSelects: Story = {
  render: () => ({
    components: { FormControl, FormField },
    setup() {
      const title = ref('Patruljeplads');
      const date = ref('2026-09-17');
      const places = ref('25');
      const deadline = ref('none');
      return { title, date, places, deadline };
    },
    template: `
      <div style="display: grid; gap: 16px; max-width: 440px">
        <FormField label="Navn" for-id="story-title" required>
          <FormControl id="story-title" v-model="title" placeholder="fx Patruljeplads" />
        </FormField>
        <FormField label="Tilmeldingsfrist" for-id="story-deadline">
          <FormControl id="story-deadline" as="select" v-model="deadline">
            <option value="none">Ingen tilmeldingsfrist</option>
            <option value="fixed">Fast dato</option>
            <option value="-7">1 uge før eventet</option>
          </FormControl>
        </FormField>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px">
          <FormField label="Dato" for-id="story-date">
            <FormControl id="story-date" v-model="date" type="date" />
          </FormField>
          <FormField label="Pladser" for-id="story-places">
            <FormControl id="story-places" v-model="places" type="number" min="1" />
          </FormField>
        </div>
      </div>
    `,
  }),
};

export const ErrorAndDisabled: Story = {
  render: () => ({
    components: { FormControl, FormField },
    template: `
      <div style="display: grid; gap: 16px; max-width: 440px">
        <FormField label="Link til Medlemsservice" for-id="story-link" required error="Indsæt et gyldigt HTTPS-link." error-id="story-link-error">
          <FormControl id="story-link" type="url" aria-invalid="true" aria-describedby="story-link-error" placeholder="https://…" />
        </FormField>
        <FormField label="Lukket felt" for-id="story-disabled">
          <FormControl id="story-disabled" disabled model-value="Ikke redigerbar" />
        </FormField>
      </div>
    `,
  }),
};
