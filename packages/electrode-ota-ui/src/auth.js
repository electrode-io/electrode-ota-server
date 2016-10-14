export default function (store) {
    const {authorization:{isAuthenticated}} = store.getState();
    return isAuthenticated;
};
