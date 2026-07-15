#!/bin/sh
# Default API_URL to the in-container FastAPI address.
# Railway sets PORT automatically; default 3000 for local runs.
export API_URL="${API_URL:-http://127.0.0.1:8000}"
export PORT="${PORT:-3000}"

exec supervisord -n -c /etc/supervisord.conf
