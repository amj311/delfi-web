export type Replace<T1, T2> = Omit<T1, keyof T2> & T2;
export type Maybe<T> = T | null;
export type Optional<T1, T2 extends keyof T1> = Omit<T1, T2> & Partial<Pick<T1, T2>>;