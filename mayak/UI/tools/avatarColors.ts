const colors: string[][] = [
  ["F86800", "FF8761"],
  ["337ACD", "35B6FF"],
  ["4123FC", "6268FF"],
  ["FF2330", "E36161"],
  ["F95353", "CD2626"],
  ["68A4FF", "5974FF"],
  // ['F2793D', 'F89E39'],
  // ['F5576C', 'F093FB'],
  // ['4FACFE', '00F2FE'],
  // ['43E97B', '38F9D7'],
  // ['FA709A', 'FEB240'],
  // ['210867', '3083D0'],
  // ['66A6FF', '8995FE'],
  // ['96E6A1', 'D4FC79'],
  // ['009EFD', '2AF5D0'],
  // ['B465DA', 'EE609C'],
  // ['6A11CB', '2575FC'],
  // ['764BA2', '667EEA'],
  // ['C471F5', 'FA71CD'],
  // ['FF0844', 'FFB199'],
  // ['FF5E71', 'FF7EB3'],
  // ['FF5858', 'F09819'],
  // ['00CDAC', '8DDAD5'],
  // ['4481EB', '04BEFE'],
  // ['C71D6F', 'E87771'],
  // ['5F72BD', '9B23EA'],
  // ['0FD850', 'CBF947'],
  // ['F83600', 'F9A323'],
  // ['495AFF', '0ACFFE'],
  // ['595EFF', 'B224EF'],
];

export function getGradientById(id?: number): string {
  let index: number;
  if (!id || typeof id !== "number") index = 0;
  else index = id % colors.length;
  return `linear-gradient(180deg, #${colors[index][0]} 0%, #${colors[index][1]} 100%)`;
}

export function getColorById(id?: number): string {
  let index: number;
  if (!id || typeof id !== "number") index = 0;
  else index = id % colors.length;
  return colors[index][0];
}
