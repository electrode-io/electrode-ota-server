// check if incoming deployment key is in the protected packages list
const isProtected = (key, protectedPacks) => {
    if (key && protectedPacks && typeof protectedPacks === "string") {
        const packs = protectedPacks.split(",");
        return packs && packs.includes(key);
    }
    // by default it's off the list
    return false;
};

export default isProtected;
