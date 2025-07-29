export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'UltraMarket Order Service API',
    version: '1.0.0',
    description: 'Order management microservice for UltraMarket e-commerce platform',
  },
  servers: [
    {
      url:
        process.env.NODE_ENV === 'production'
          ? 'https://api.ultramarket.uz/order-service'
          : `http://localhost:${process.env.PORT || 3005}`,
      description:
        process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
    },
  ],
};
