#!/bin/sh

export REACT_APP_BACKEND_PORT

envsubst '${REACT_APP_BACKEND_PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

exec "$@"