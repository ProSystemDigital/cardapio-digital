import type { FulfillmentMode } from "../../../domain/catalog";
import styles from "./FulfillmentSelector.module.scss";

const labels: Record<FulfillmentMode, { title: string; description: string }> = {
  dine_in: { title: "Na mesa", description: "Receber em uma mesa identificada" },
  pickup: { title: "Retirada", description: "Buscar no balcão" },
  delivery: { title: "Entrega", description: "Receber no endereço" },
};

type FulfillmentSelectorProps = {
  modes: readonly FulfillmentMode[];
  selectedMode: FulfillmentMode | null;
  onSelect: (mode: FulfillmentMode) => void;
  diningTables: readonly string[];
  selectedTable: string;
  onSelectTable: (table: string) => void;
};

export default function FulfillmentSelector({
  modes,
  selectedMode,
  onSelect,
  diningTables,
  selectedTable,
  onSelectTable,
}: FulfillmentSelectorProps) {
  const tablesByEnvironment = new Map<string, string[]>();
  for (const table of diningTables) {
    const [environment, tableLabel] = table.includes(" · ") ? table.split(" · ", 2) : ["Ambiente principal", table];
    const entries = tablesByEnvironment.get(environment) ?? [];
    entries.push(tableLabel);
    tablesByEnvironment.set(environment, entries);
  }
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
      {selectedMode === "dine_in" ? (
        <label className={styles.tableSelector}>
          <span>Qual é a sua mesa?</span>
          <select disabled={diningTables.length === 0} onChange={(event) => onSelectTable(event.currentTarget.value)} required value={selectedTable}>
            <option value="">Selecione a mesa</option>
            {[...tablesByEnvironment].map(([environment, tables]) => (
              <optgroup key={environment} label={environment}>
                {tables.map((table) => {
                  const value = environment === "Ambiente principal" && diningTables.includes(table) ? table : `${environment} · ${table}`;
                  return <option key={value} value={value}>{table}</option>;
                })}
              </optgroup>
            ))}
          </select>
          {diningTables.length === 0 ? <small>O estabelecimento ainda não configurou as mesas.</small> : <small>Confira a identificação disponível na própria mesa.</small>}
        </label>
      ) : null}
    </fieldset>
  );
}
