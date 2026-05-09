FROM caddy:alpine
COPY . /srv
COPY Caddyfile /etc/caddy/Caddyfile
EXPOSE 8080
