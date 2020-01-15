import toCamelCase from "./to-camel-case";
import toSnakeCase from "./to-snake-case";

const isValidObject = o => {
    if (o === Object(o) && o !== null && !Array.isArray(o) && typeof o !== "function") {
      return Object.keys(o).length > 0;
    }

    return false;
};

const keysToCamelOrSnake = o => {
    if (isValidObject(o)) {
      // find if the keys to convert cameCase or snake_case
      const keys = Object.keys(o);
      const keyConverter = /([_][a-z])/i.test(keys[0]) ? toCamelCase : toSnakeCase;
      // now apply the key-converter
      const n = {};
      keys.forEach(k => {
          n[keyConverter(k)] = keysToCamelOrSnake(o[k]);
      });

      return n;
    }

    return o;
};

export default keysToCamelOrSnake;
