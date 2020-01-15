// convert snake/pascal case to camelCase
const toCamelCase = s => {
    // include "-" to line#5 convert hyphenated-vars to camelCase
    // also this .replace("-", "") to line#7
    return s.replace(/([_][a-z])/ig, $1 => {
      return $1.toUpperCase()
        .replace("_", "");
    });
};

export default toCamelCase;
