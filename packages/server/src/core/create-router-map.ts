export const createRouterMap = <Router extends object>(router: Router) => {
    const map: { [key: string]: any } = {};
    const buildMap = (router: Router, path = "") => {
        for (const key in router) {
            const fullPath = `${path}/${key}`;
            const value = router[key];
            if (typeof value === "function") {
                map[fullPath] = value as any;
            } else {
                buildMap(value as Router, fullPath);
            }
        }
    };
    buildMap(router);
    return map;
};
