export const createRouterMap = <Router extends object>(router: Router) => {
    const map: { [key: string]: { regex: RegExp; handler: any; keys: string[] } } = {};

    const buildMap = (router: Router, path = "") => {
        for (const key in router) {
            const fullPath = `${path}/${key}`;
            const value = router[key];
            if (typeof value === "function") {
                const keys: string[] = [];
                const regexPath = fullPath.replace(/([^/]+):/g, (match, key) => {
                    keys.push(key);
                    return "([^/]+)";
                });

                map[fullPath] = { regex: new RegExp(`^${regexPath}$`), handler: value, keys };
            } else {
                buildMap(value as Router, fullPath);
            }
        }
    };

    buildMap(router);
    return map;
};
