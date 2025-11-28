#!/usr/bin/env sh
set -e

hostport="$1"
shift || true

host=$(echo "$hostport" | cut -d: -f1)
port=$(echo "$hostport" | cut -d: -f2)

SLEEP_INTERVAL=${SLEEP_INTERVAL:-3}
MAX_RETRIES=${MAX_RETRIES:-60}

echo "Waiting for $host:$port (interval ${SLEEP_INTERVAL}s, max ${MAX_RETRIES} tries)..."

i=0
until nc -z "$host" "$port"; do
  i=$((i+1))
  if [ "$i" -ge "$MAX_RETRIES" ]; then
    echo "Timeout waiting for $host:$port after $i attempts" >&2
    exit 1
  fi
  >&2 echo "[$i/$MAX_RETRIES] $host:$port is unavailable - sleeping ${SLEEP_INTERVAL}s"
  sleep "$SLEEP_INTERVAL"
done

>&2 echo "$host:$port is available"
if [ "$1" = "--" ]; then
  shift
  exec "$@"
fi
