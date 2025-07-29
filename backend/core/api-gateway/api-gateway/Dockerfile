FROM kong:3.4-alpine

# Kong konfiguratsiyasi
COPY kong.yml /etc/kong/kong.yml
COPY kong.conf /etc/kong/kong.conf

# Pluginlar
RUN apk add --no-cache curl

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8001/status || exit 1

EXPOSE 8000 8001 8443 8444

CMD ["kong", "docker-start"]