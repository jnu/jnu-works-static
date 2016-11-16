.PHONY: image run

image:
	docker build -t joen/jnuworks:static .

run: image
	docker stop static
	docker rm static
	docker run -d -p 5000:80 --name static joen/jnuworks:static nginx -g "daemon off;"
