export function convertirTasa({ tipo, tasa, capitalizaciones }) {
  const m = capitalizaciones;

  if (tipo === 'TNA_TO_TEA') {
    // Tasa Nominal Anual -> Tasa Efectiva Anual
    return Math.pow(1 + tasa / m, m) - 1;
  } else if (tipo === 'TEA_TO_TNA') {
    // Tasa Efectiva Anual -> Tasa Nominal Anual
    return m * (Math.pow(1 + tasa, 1 / m) - 1);
  } else {
    throw new Error('Tipo de conversión no válido');
  }
}
