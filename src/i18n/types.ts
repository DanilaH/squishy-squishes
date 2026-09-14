export type StringShape<T> = {
  readonly [Key in keyof T]: T[Key] extends string ? string : StringShape<T[Key]>;
};
