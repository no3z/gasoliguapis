"use client";

import { useMemo, useState } from "react";

function NumberField({ label, value, onChange, suffix, step = "0.1" }: { label: string; value: number; onChange: (value: number) => void; suffix: string; step?: string }) {
  return (
    <label className="calculator-field">
      <span>{label}</span>
      <span><input type="number" inputMode="decimal" min="0" step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} /><b>{suffix}</b></span>
    </label>
  );
}

export default function FuelSavingsCalculator() {
  const [liters, setLiters] = useState(50);
  const [nearPrice, setNearPrice] = useState(1.599);
  const [targetPrice, setTargetPrice] = useState(1.499);
  const [detourKm, setDetourKm] = useState(8);
  const [consumption, setConsumption] = useState(6.5);

  const result = useMemo(() => {
    const safe = [liters, nearPrice, targetPrice, detourKm, consumption].every(Number.isFinite);
    if (!safe) return { gross: 0, detourCost: 0, net: 0 };
    const gross = Math.max(0, liters) * (Math.max(0, nearPrice) - Math.max(0, targetPrice));
    const detourCost = (Math.max(0, detourKm) / 100) * Math.max(0, consumption) * Math.max(0, targetPrice);
    return { gross, detourCost, net: gross - detourCost };
  }, [consumption, detourKm, liters, nearPrice, targetPrice]);

  const euros = (value: number) => value.toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });

  return (
    <section className="calculator-card" aria-labelledby="calculator-title">
      <div className="calculator-heading"><span>AHORRO NETO</span><h2 id="calculator-title">¿Compensa salir de la ruta?</h2></div>
      <div className="calculator-fields">
        <NumberField label="Litros que vas a repostar" value={liters} onChange={setLiters} suffix="L" step="1" />
        <NumberField label="Precio de la estación cercana" value={nearPrice} onChange={setNearPrice} suffix="€/L" step="0.001" />
        <NumberField label="Precio de la estación barata" value={targetPrice} onChange={setTargetPrice} suffix="€/L" step="0.001" />
        <NumberField label="Desvío total, ida y vuelta" value={detourKm} onChange={setDetourKm} suffix="km" step="1" />
        <NumberField label="Consumo de tu vehículo" value={consumption} onChange={setConsumption} suffix="L/100" />
      </div>
      <div className={`calculator-result ${result.net >= 0 ? "positive" : "negative"}`} aria-live="polite">
        <span>{result.net >= 0 ? "Ahorras después del desvío" : "El desvío te cuesta de más"}</span>
        <strong>{euros(Math.abs(result.net))}</strong>
        <p>Ahorro en surtidor: {euros(result.gross)} · Coste estimado del desvío: {euros(result.detourCost)}</p>
      </div>
      <p className="calculator-disclaimer">Estimación orientativa: no incluye tiempo, peajes, tráfico ni variaciones de precio.</p>
    </section>
  );
}
