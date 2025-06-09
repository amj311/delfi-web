export type Replace<T1, T2> = Omit<T1, keyof T2> & T2;
export type Maybe<T> = T | null;
