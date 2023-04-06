import { Operator } from '.';
import { isPrimitiveType, supportedType } from './utils';

const operators: {
  [k in Operator]: (v, compare) => boolean;
} = {
  "__eq": (v, compare) => {
    v = isPrimitiveType(v) ? v : JSON.stringify(v);
    compare = isPrimitiveType(compare) ? compare : JSON.stringify(compare);
    return v == compare;
  },
  "__neq": (v, compare) => {
    return !operators["__eq"](v, compare);
  },
  "__in": (v, compare) => {
    if (
      !supportedType(compare, ['array', 'string']) ||
      !supportedType(v, ['number', 'string', 'boolean', 'null'])
    ) {
      throw new Error('Unsupported types for __in or __nin operator');
    }
    if (Array.isArray(compare)) {
      return (compare as string | any[]).includes(v as any);
    }
    return (v as string | any[]).includes(compare as any);
  },
  "__nin": (v, compare) => {
    return !operators["__in"](v, compare);
  },
  "__startsWith": (v, compare) => {
    if (!supportedType(v, ['string']) || !supportedType(compare, ['string'])) {
      throw new Error('Unsupported types for __startsWith operator');
    }
    return (v as string).startsWith(compare as string);
  },
  "__endsWith": (v, compare) => {
    if (!supportedType(v, ['string']) || !supportedType(compare, ['string'])) {
      throw new Error('Unsupported types for __endsWith operator');
    }
    return (v as string).endsWith(compare as string);
  },
  "__gte": (v, compare) => {
    if (
      !supportedType(v, ['string', 'number']) ||
      !supportedType(compare, ['string', 'number'])
    ) {
      throw new Error('Unsupported types for __gte operator');
    }
    return v >= compare;
  },
  "__gt": (v, compare) => {
    if (
      !supportedType(v, ['string', 'number']) ||
      !supportedType(compare, ['string', 'number'])
    ) {
      throw new Error('Unsupported types for __gt operator');
    }
    return v > compare;
  },
  "__lte": (v, compare) => {
    if (
      !supportedType(v, ['string', 'number']) ||
      !supportedType(compare, ['string', 'number'])
    ) {
      throw new Error('Unsupported types for __lte operator');
    }
    return v <= compare;
  },
  "__lt": (v, compare) => {
    if (
      !supportedType(v, ['string', 'number']) ||
      !supportedType(compare, ['string', 'number'])
    ) {
      throw new Error('Unsupported types for __lt operator');
    }
    return v < compare;
  },
  "__exist": (v, compare) => {
    if (!supportedType(compare, ['boolean'])) {
      throw new Error('Unsupported type for __exist operator');
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
