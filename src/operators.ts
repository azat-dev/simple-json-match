import { Operator } from '.';
import { isPrimitiveType, supportedType } from './utils';

const operators: {
  [k in Operator]: (v, compare) => boolean;
} = {
  "_$eq": (v, compare) => {
    v = isPrimitiveType(v) ? v : JSON.stringify(v);
    compare = isPrimitiveType(compare) ? compare : JSON.stringify(compare);
    return v == compare;
  },
  "_$neq": (v, compare) => {
    return !operators["_$eq"](v, compare);
  },
  "_$in": (v, compare) => {
    if (
      !supportedType(compare, ['array', 'string']) ||
      !supportedType(v, ['number', 'string', 'boolean', 'null'])
    ) {
      throw new Error('Unsupported types for _$in or _$nin operator');
    }
    if (Array.isArray(compare)) {
      return (compare as string | any[]).includes(v as any);
    }
    return (v as string | any[]).includes(compare as any);
  },
  "_$nin": (v, compare) => {
    return !operators["_$in"](v, compare);
  },
  "_$startsWith": (v, compare) => {
    if (!supportedType(v, ['string']) || !supportedType(compare, ['string'])) {
      throw new Error('Unsupported types for _$startsWith operator');
    }
    return (v as string).startsWith(compare as string);
  },
  "_$endsWith": (v, compare) => {
    if (!supportedType(v, ['string']) || !supportedType(compare, ['string'])) {
      throw new Error('Unsupported types for _$endsWith operator');
    }
    return (v as string).endsWith(compare as string);
  },
  "_$gte": (v, compare) => {
    if (
      !supportedType(v, ['string', 'number']) ||
      !supportedType(compare, ['string', 'number'])
    ) {
      throw new Error('Unsupported types for _$gte operator');
    }
    return v >= compare;
  },
  "_$gt": (v, compare) => {
    if (
      !supportedType(v, ['string', 'number']) ||
      !supportedType(compare, ['string', 'number'])
    ) {
      throw new Error('Unsupported types for _$gt operator');
    }
    return v > compare;
  },
  "_$lte": (v, compare) => {
    if (
      !supportedType(v, ['string', 'number']) ||
      !supportedType(compare, ['string', 'number'])
    ) {
      throw new Error('Unsupported types for _$lte operator');
    }
    return v <= compare;
  },
  "_$lt": (v, compare) => {
    if (
      !supportedType(v, ['string', 'number']) ||
      !supportedType(compare, ['string', 'number'])
    ) {
      throw new Error('Unsupported types for _$lt operator');
    }
    return v < compare;
  },
  "_$exist": (v, compare) => {
    if (!supportedType(compare, ['boolean'])) {
      throw new Error('Unsupported type for _$exist operator');
    }
    if (compare === true && v !== undefined) {
      return true;
    }
    if (compare === false && v === undefined) {
      return true;
    }
    return false;
  },
};

export const operator_keys = Object.keys(operators);

export default operators;
