FROM nginx:alpine
MAINTAINER Joe Nudell <admin@jnu.works>

COPY content/ /srv/static
COPY conf/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
