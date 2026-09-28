import type { Meta, StoryObj } from '@storybook/vue3';

import HeroMeta from './HeroMeta.vue';
import PublicLandingPageShell from './PublicLandingPageShell.vue';

const meta = {
  title: 'Layout/PublicLandingPageShell',
  component: PublicLandingPageShell,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Den fælles offentlige sideskabelon. Brug den til undersider med et samlet topområde og et naturligt scrollende indholdsområde; læg aldrig en selvstændig scrollflade i dens indhold.',
      },
    },
  },
  args: {
    contentWidth: '760px',
    heroCopy: 'Praktisk information og tilmelding samlet ét sted.',
    heroImage: '/og-sankthans.webp',
    heroImageAlt: 'Havets Helte ved vandet',
    heroTitle: 'Nathejk 2026',
    heroVariant: 'event',
    sectionTitle: 'Tilmeldinger',
  },
  argTypes: {
    heroVariant: { control: 'radio', options: ['standard', 'event'] },
  },
} satisfies Meta<typeof PublicLandingPageShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EventPage: Story = {
  render: args => ({
    components: { HeroMeta, PublicLandingPageShell },
    setup: () => ({ args }),
    template: `
      <PublicLandingPageShell v-bind="args">
        <template #hero-actions>
          <button type="button" style="min-height:44px;padding:10px 14px;border:1px solid rgba(255,255,255,.35);border-radius:12px;background:#003366;color:#fff;font:inherit;font-weight:700">Spring til tilmelding</button>
          <button type="button" style="min-height:44px;padding:10px 14px;border:1px solid rgba(255,255,255,.35);border-radius:12px;background:transparent;color:#fff;font:inherit;font-weight:700">Tilbage</button>
        </template>
        <template #hero-meta>
          <HeroMeta date="Lørdag 31. oktober" location="Kastrup Fort" :elements="3" />
        </template>
        <template #body>
          <div style="display:grid;gap:10px">
            <h3 style="margin:0;color:#003366">Patruljeplads</h3>
            <p style="margin:0;color:#6a6a6a">Tilmeld din patrulje, og hold overblikket over de ledige pladser.</p>
            <button type="button" style="justify-self:start;min-height:44px;padding:10px 14px;border:0;border-radius:12px;background:#003366;color:#fff;font:inherit;font-weight:700">Tilmeld dig</button>
          </div>
        </template>
      </PublicLandingPageShell>
    `,
  }),
};

export const StandardPage: Story = {
  args: {
    heroImage: '',
    heroVariant: 'standard',
    heroTitle: 'Frivillighelte',
    sectionTitle: 'Flest frivilligtilmeldinger',
  },
  render: EventPage.render,
};
