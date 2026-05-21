import { reactJsStrategy }    from "./strategies/reactJs.js";
import { reactTsStrategy }    from "./strategies/reactTs.js";
import { nextjsStrategy }     from "./strategies/nextjs.js";
import { angularStrategy }    from "./strategies/angular.js";
import { vueStrategy }        from "./strategies/vue.js";
import { htmlCssJsStrategy }  from "./strategies/htmlCssJs.js";
import { nodejsStrategy }     from "./strategies/nodejs.js";
import { honoStrategy }       from "./strategies/hono.js";
import { pythonStrategy }     from "./strategies/python.js";
import { fastapiStrategy }    from "./strategies/fastapi.js";
import { flaskStrategy }      from "./strategies/flask.js";
import { djangoStrategy }     from "./strategies/django.js";
import { springBootStrategy } from "./strategies/springBoot.js";
import { goStrategy }         from "./strategies/go.js";
import { rustStrategy }       from "./strategies/rust.js";
import { javaStrategy }       from "./strategies/java.js";

export const templateRegistry = {
    "react-js":    reactJsStrategy,
    "react-ts":    reactTsStrategy,
    "nextjs":      nextjsStrategy,
    "angular":     angularStrategy,
    "vue":         vueStrategy,
    "html-css-js": htmlCssJsStrategy,
    "nodejs":      nodejsStrategy,
    "hono":        honoStrategy,
    "python":      pythonStrategy,
    "fastapi":     fastapiStrategy,
    "flask":       flaskStrategy,
    "django":      djangoStrategy,
    "spring-boot": springBootStrategy,
    "go":          goStrategy,
    "rust":        rustStrategy,
    "java":        javaStrategy,
};

export const TEMPLATE_NAMES = Object.keys(templateRegistry);

export const getStrategy = (templateName) => {
    const strategy = templateRegistry[templateName];
    if (!strategy) throw new Error(`Unknown template: "${templateName}". Valid options: ${TEMPLATE_NAMES.join(", ")}`);
    return strategy;
};
