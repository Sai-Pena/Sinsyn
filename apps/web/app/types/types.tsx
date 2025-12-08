export enum ParserMode {
  Constant = "constant", // For sustained / continuous instruments (flute, brass, vocal)
  Ceiling = "ceiling", // For percussive or transient instruments (piano, drums)
  Floor = "floor",
  Round = "round",
  Extrema = "extrema",
}

export interface EquationSettings {
  equation: string;
  parserMode: ParserMode;
  name: string;
  
}
