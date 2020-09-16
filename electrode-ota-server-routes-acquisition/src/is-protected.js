import  { isEmpty } from "lodash/";
// check if incoming deployment key is in the protected packages list
const isProtected = (key, protectedPacks) => {
    if (!isEmpty(key) && typeof protectedPacks === "string" && !isEmpty(protectedPacks)) {
        return protectedPacks.indexOf(key) >= 0;
    }
    // by default it's off the list
    return false;
};

export default isProtected;
