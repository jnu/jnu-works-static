.PHONY: php-image image run

php-image:
	git submodule update --init --recursive
	make image -C ./php

image:
	docker build -t joen/jnuworks:static .

run: image php-image
	docker stop static
	docker rm static
	docker run -d -p 80:80 --link php:php --name static joen/jnuworks:static nginx -g "daemon off;"
