// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import StartScreen from './StartScreen.svelte';

const POTIONS = [
  { code: 'time_bonus_20', family: 'time_bonus', value: 20, price: 70, quantity: 1, name: { fr: '+20s' } }
];

function baseProps(overrides = {}) {
  return {
    modeId: 'tables',
    level: 'adulte',
    duration: 3,
    options: { selectedTables: [] },
    potions: POTIONS,
    selectedPotionCodes: [],
    onModeSelect: vi.fn(),
    onDurationSelect: vi.fn(),
    onOptionsChange: vi.fn(),
    onPotionSelectionChange: vi.fn(),
    onStart: vi.fn(),
    ...overrides
  };
}

describe('StartScreen — sélection de potion (PotionPicker)', () => {
  it('cliquer une potion possédée notifie onPotionSelectionChange avec son code', async () => {
    const onPotionSelectionChange = vi.fn();
    const { container } = render(StartScreen, { props: baseProps({ onPotionSelectionChange }) });
    const button = container.querySelector('.potion-chip');
    await fireEvent.click(button);
    expect(onPotionSelectionChange).toHaveBeenCalledWith(['time_bonus_20']);
  });

  it("passer selectedPotionCodes met bien .active sur la potion correspondante (régression : mauvais nom de prop vers PotionPicker)", async () => {
    const { container, rerender } = render(StartScreen, { props: baseProps() });
    let button = container.querySelector('.potion-chip');
    expect(button.className).not.toContain('active');

    await rerender(baseProps({ selectedPotionCodes: ['time_bonus_20'] }));
    button = container.querySelector('.potion-chip');
    expect(button.className).toContain('active');
  });
});
