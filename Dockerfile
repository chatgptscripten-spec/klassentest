FROM caddy:alpine
COPY . /srv
COPY Caddyfile /etc/caddy/Caddyfile
