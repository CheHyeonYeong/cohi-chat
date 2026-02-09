// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObject = Record<string, any>;

export function snakeToCamel(obj: AnyObject | AnyObject[]): AnyObject | AnyObject[] {
    if (Array.isArray(obj)) {
        return obj.map(v => snakeToCamel(v));
    } else if (obj != null && obj.constructor === Object) {
        return Object.keys(obj).reduce((acc, key) => {
            const camelKey = key.replace(/_([a-z])/g, g => g[1].toUpperCase());
            acc[camelKey] = snakeToCamel(obj[key]);
            return acc;
        }, {} as AnyObject);
    }
    return obj;
}

export function camelToSnake(obj: AnyObject | AnyObject[]): AnyObject | AnyObject[] {
    if (Array.isArray(obj)) {
        return obj.map(v => camelToSnake(v));
    } else if (obj != null && obj.constructor === Object) {
        return Object.keys(obj).reduce((acc, key) => {
            const snakeKey = key.replace(/([A-Z])/g, g => `_${g.toLowerCase()}`);
            acc[snakeKey] = camelToSnake(obj[key]);
            return acc;
        }, {} as AnyObject);
    }
    return obj;
}
