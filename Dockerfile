FROM nginx:alpine
MAINTAINER Joe Nudell <admin@jnu.works>

COPY ./ /srv/static
COPY nginx.conf /etc/nginx/nginx.conf
RUN rm /srv/static/nginx.conf && \
    rm /srv/static/Makefile && \
    rm /srv/static/README.md && \
    rm /srv/static/Dockerfile && \
    rm /srv/static/.gitignore && \
    rm /srv/static/.gitmodules

EXPOSE 80
