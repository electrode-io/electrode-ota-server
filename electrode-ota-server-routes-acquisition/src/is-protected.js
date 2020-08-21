const isProtected = (key, protectedPacks) => {
    if (key && protectedPacks && typeof protectedPacks === "string") {
        const packs = protectedPacks.split(",");
        return packs && packs.includes(key);
    }

    return false;
};

export default isProtected;
