.PHONY: php-image php-run image run

php-image:
	git submodule update --init --recursive
	make image -C ./php

image:
	docker build -t joen/jnuworks:static .

php-run:
	git submodule update --init --recursive
	make run -C ./php

run: image php-run
	docker kill static; \
	docker rm static; \
	docker run -d -p 80:80 --link php:php --name static joen/jnuworks:static nginx -g "daemon off;"
