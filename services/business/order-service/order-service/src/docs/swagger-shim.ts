// This is a simple shim to work around the missing swagger dependencies
// In a real environment, you would install the actual dependencies

export const swaggerJsdoc = {
  definition: (config: any) => ({ ...config }),
  setup: (options: any) => options,
};

export const swaggerUi = {
  serve: () => (req: any, res: any, next: any) => next(),
  setup: (spec: any) => (req: any, res: any) => res.json(spec),
};

export default {
  swaggerJsdoc,
  swaggerUi,
};
