
import "./polyfills/Object.assign";

/** changeRef(ref, o) === ref */
export function createObjectWithGivenRef<TargetType>(ref: Object, o: TargetType): TargetType {

    Object.keys(ref).forEach(key => { delete ref[key]; });

    Object.assign(ref, o);

    return ref as TargetType;

}