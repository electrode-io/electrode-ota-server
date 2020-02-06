// convert from camelCase to snake-case
const toSnakeCase = s => {
    return s.replace(/\.?([A-Z]+)/g, (x, y) => `_${ y.toLowerCase()}`)
            .replace(/^_/, "");
};

export default toSnakeCase;
