export type CategoryGroup = ReadonlyArray<{
  readonly group: string;
  readonly mainItem?: number;
  readonly items: ReadonlyArray<number>;
}>;
