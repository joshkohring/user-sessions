if [[ ! -f ./.env ]]; then
  echo ".env file not found, creating one with default values."
  cp template.env .env
fi

docker build -t user-session/nginx-reverse-proxy ./nginx-reverse-proxy