FROM nginx:alpine
MAINTAINER Joe Nudell <admin@jnu.works>

COPY ./ /srv/static
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
