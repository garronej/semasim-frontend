
/**
 * The identity function.
 * 
 * Help to build an object of type T.
 * Better than using 'as T' as there is no type safety loss.
 * 
 * - Used as convenience for enabling type inference.
 * Example: 
 * 
 * type Circle = {
 *     type: "CIRCLE";
 *     radius: number;
 * };
 * 
 * type Square = {
 *     type: "SQUARE";
 *     side: number;
 * };
 * type Shape= Circle | Square;
 * 
 * declare function f(shape: Shape): void;
 * 
 * f(id<Circle>({ "type": "CIRCLE", "radius": 33 }); <== We have auto completion to instantiate circle.
 * 
 * - Used to loosen the type restriction without saying "trust me" to the compiler.
 * declare const x: Set<readonly ["FOO"]>;
 * declare function f(s: Set<string[]>): void;
 * f(id<Set<any>>(x));
 * 
 * OR:
 * 
 * declare const arr : [ "FOO" ] | string[] ;
 * arr.map(str => {}); 
 * ^This expression is not callable. Each member of the union type has map signatures, but none of those signatures are compatible with each other.
 * id<string[]>(arr).map(s=>{});
 * 
 * - Used to declare type and instantiate
 * 
 * const defaultProps = {
 *     prop1: "FOO" as ("foo" | null), <= No error
 * }
 * 
 * const defaultProps = {
 *     prop1: id<"foo" | null>("FOO") <= Error
 * }
 * 
 */
export const id = <T>(x: T) => x;











