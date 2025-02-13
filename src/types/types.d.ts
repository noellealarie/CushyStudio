/** usefull to catch most *units* type errors */

declare type Tagged<O, Tag> = O & { __tag?: Tag }
declare type Branded<O, Brand extends { [key: string]: true }> = O & Brand
declare type Maybe<T> = T | null | undefined
declare type Timestamp = Tagged<number, 'Timestamp'>

// --------------
declare type AppPath = Branded<string, { ActionPath: true; RelativePath: true }>
declare type RelativePath = Branded<string, { RelativePath: true }>
declare type AbsolutePath = Branded<string, { AbsolutePath: true }>
declare type SQLITE_boolean = Branded<number, { SQLITE_boolean: true }>
