// utils/routeBuilder.js

export const createRouteConfig = (routes) => {
  const config = {};
  
  routes.forEach(route => {
    const basePath = route.path.replace('/*', '');
    
    // Get nested routes from component
    if (route.component?.getNestedRoutes) {
      const nestedRoutes = route.component.getNestedRoutes();
      config[route.name] = {
        base: basePath,
        ...nestedRoutes,
      };
    } else {
      config[route.name] = {
        base: basePath,
      };
    }
  });
  
  return config;
};

// Hook for navigation
export const useAppNavigation = () => {
  const navigate = useNavigate();
  
  return {
    navigateTo: (route, params = {}) => {
      const path = typeof route === 'string' ? route : route.path;
      const fullPath = buildPath(path, params);
      navigate(fullPath);
    },
    goBack: () => navigate(-1),
    goToDashboard: () => navigate(ROUTES.APP.ALL),
  };
};