/**
 * AnyFileForge — Centralized Route Definitions
 * ─────────────────────────────────────────────
 * Change a route path HERE and it updates everywhere automatically.
 * Never hardcode route strings in components — always import from this file.
 */

const ROUTES = {
    HOME:            '/',
    TOOLS:           '/tools',
    TOOL_DETAIL:     '/tools/:toolId',   // use ROUTES.toolDetail(id) for dynamic links
    SUPPORT:         '/support',
    ABOUT:           '/about',
    DEVELOPER:       '/dev',
    PRIVACY:         '/privacy',
    SECURITY:        '/security',
    TERMS:           '/terms',
    LICENSE:         '/license',
    LOGIN:           '/login',
    SIGNUP:          '/signup',
    RESET:           '/reset',
    PROFILE:         '/profile',
    PROJECTS:        '/projects',
    PROJECT_DETAIL:  '/projects/:id',    // use ROUTES.projectDetail(id) for dynamic links
};

/**
 * Helper to build dynamic tool URL: /tools/pdf-merge
 */
export const toolDetail = (toolId) => `/tools/${toolId}`;

/**
 * Helper to build dynamic project URL: /projects/abc123
 */
export const projectDetail = (id) => `/projects/${id}`;

export default ROUTES;
