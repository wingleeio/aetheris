import { RouterMap } from "./create-router-map";

export const getMatch = (map: RouterMap, path: string) => {
    let handler: any;
    let params: Record<string, string> = {};
    for (const route in map) {
        const { regex, keys, handler: routeHandler } = map[route];
        const match = path.match(regex);

        if (match) {
            handler = routeHandler;
            keys.forEach((name, index) => {
                params[name] = match[index + 1].replace(`${name}:`, "");
            });
            break;
        }
    }

    return { handler, params };
};
