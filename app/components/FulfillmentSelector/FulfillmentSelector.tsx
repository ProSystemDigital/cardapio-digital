import type { FulfillmentMode } from "../../../domain/catalog";
import styles from "./FulfillmentSelector.module.scss";

const labels: Record<FulfillmentMode, { title: string; description: string }> = {
  dine_in: { title: "Mesa", description: "Consumir no estabelecimento" },
  pickup: { title: "Retirada", description: "Buscar no balcão" },
  delivery: { title: "Entrega", description: "Receber no endereço" },
};

type FulfillmentSelectorProps = {
  modes: readonly FulfillmentMode[];
  selectedMode: FulfillmentMode | null;
  onSelect: (mode: FulfillmentMode) => void;
};

export default function FulfillmentSelector({
  modes,
  selectedMode,
  onSelect,
}: FulfillmentSelectorProps) {
  return (
    <fieldset className={styles.selector}>
      <legend>Como você quer receber?</legend>
      <div>
        {modes.map((mode) => (
          <label key={mode} className={selectedMode === mode ? styles.selected : ""}>
            <input
              type="radio"
              name="fulfillment-mode"
              value={mode}
              checked={selectedMode === mode}
              onChange={() => onSelect(mode)}
            />
            <span><strong>{labels[mode].title}</strong><small>{labels[mode].description}</small></span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
