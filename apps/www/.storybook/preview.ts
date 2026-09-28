import type { Preview } from '@storybook/vue3';

import '../src/styles.css';

const preview: Preview = {
  parameters: {
    controls: { expanded: true },
    layout: 'centered',
  },
};

export default preview;
