export type RouterMap = { [key: string]: { regex: RegExp; handler: any; keys: string[] } };

export const createRouterMap = <Router extends object>(router: Router) => {
    const map: RouterMap = {};

    const buildMap = (router: Router, path = "") => {
        for (const key in router) {
            let fullPath = `${path}/${key}`;
            const value = router[key];

            if (typeof value === "function") {
                const keys: string[] = [];
                const regexPath = fullPath.replace(/([^/]+):/g, (match, key) => {
                    keys.push(key);
                    return "([^/]+)";
                });

                map[fullPath] = { regex: new RegExp(`^${regexPath}$`), handler: value, keys };
                // @ts-ignore
            } else if ("subscribe" in value) {
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
