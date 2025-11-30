#!/usr/bin/env bash
# wait-for-http-health.sh - aceita --host/--port/[--path] ou HOST:PORT[/PATH] e '--' para comando final
set -euo pipefail

# --- CONFIGURAÇÃO ---
SLEEP_INTERVAL=2
MAX_RETRIES=30
HEALTH_PATH="/health"

# Defaults
HOST=""
PORT=""
EXEC_CMD_ARGS=()

usage() {
  cat <<EOF
Usage:
  $0 --host HOST --port PORT [--path /health] [--] <command...>
  $0 HOST:PORT[/path] [--path /health] [--] <command...>

Examples:
  $0 --host localhost --port 8080 --path /ready -- node ./dist/index.js
  $0 localhost:8080/ok -- ./start.sh
EOF
  exit 2
}

# --- parse args ---
while [[ $# -gt 0 ]]; do
  case "$1" in
    --host)
      shift
      [[ $# -gt 0 ]] || usage
      HOST="$1"
      shift
      ;;
    --port)
      shift
      [[ $# -gt 0 ]] || usage
      PORT="$1"
      shift
      ;;
    --path)
      shift
      [[ $# -gt 0 ]] || usage
      HEALTH_PATH="$1"
      shift
      ;;
    --)
      shift
      EXEC_CMD_ARGS=("$@")
      break
      ;;
    -*)
      echo "Unknown option: $1" >&2
      usage
      ;;
    *)
      # accept HOST:PORT[/PATH] positional form
      if [[ "$1" == *:* ]]; then
        RAW="$1"
        shift

        HOST="${RAW%%:*}"   # antes dos dois-pontos
        REST="${RAW#*:}"    # depois dos dois-pontos

        # valida host não vazio
        if [[ -z "$HOST" ]]; then
          echo "Error: empty host in '$RAW'" >&2
          exit 2
        fi

        # extrai PORT e path (se houver)
        if [[ "$REST" == */* ]]; then
          PORT="${REST%%/*}"        # parte antes da primeira '/'
          PATH_PART="${REST#*/}"    # parte depois da primeira '/'
          HEALTH_PATH="/${PATH_PART}"   # normaliza com leading slash
        else
          PORT="$REST"
          # HEALTH_PATH deixa o default (já definido)
        fi

        # valida porta
        if ! [[ "$PORT" =~ ^[0-9]+$ ]]; then
          echo "Error: invalid port number in '$RAW'" >&2
          exit 2
        fi

      else
        echo "Unknown positional argument: $1" >&2
        usage
      fi
      ;;
  esac
done

# validate
if [[ -z "${HOST:-}" || -z "${PORT:-}" ]]; then
  echo "Error: host and port must be provided (either --host/--port or HOST:PORT[/path])." >&2
  usage
fi

# normalize HEALTH_PATH (ensure starts with /)
if [[ "${HEALTH_PATH:0:1}" != "/" ]]; then
  HEALTH_PATH="/${HEALTH_PATH}"
fi

# Print config
echo "Config:"
echo "  HOST:           $HOST"
echo "  PORT:           $PORT"
echo "  HEALTH_PATH:    $HEALTH_PATH"
echo "  SLEEP_INTERVAL: $SLEEP_INTERVAL"
echo "  MAX_RETRIES:    $MAX_RETRIES"
if [ ${#EXEC_CMD_ARGS[@]} -gt 0 ]; then
  echo "  EXEC_CMD:       ${EXEC_CMD_ARGS[*]}"
fi
echo

URL="http://${HOST}:${PORT}${HEALTH_PATH}"

i=0
EXIT_CODE=1

while true; do
  HTTP_OK=false

  if wget --spider --timeout=3 --tries=1 "$URL" >/dev/null 2>&1; then
    HTTP_OK=true
  fi

  if [[ "$HTTP_OK" == "true" ]]; then
    >&2 echo "[$((i+1))/$MAX_RETRIES] HTTP check OK: $URL"
    EXIT_CODE=0
    break
  fi

  i=$((i+1))
  if [ "$i" -ge "$MAX_RETRIES" ]; then
    >&2 echo "Timeout: waited $i attempts for $URL to respond"
    EXIT_CODE=1
    break
  fi

  >&2 echo "[$i/$MAX_RETRIES] HTTP not ready at $URL - sleeping ${SLEEP_INTERVAL}s"
  sleep "$SLEEP_INTERVAL"
done

# execute optional command
if [ $EXIT_CODE -eq 0 ] && [ ${#EXEC_CMD_ARGS[@]} -gt 0 ]; then
  echo "Executing command: ${EXEC_CMD_ARGS[*]}"
  exec "${EXEC_CMD_ARGS[@]}"
  # note: exec replaces this process; lines after exec won't run unless exec fails
else
  exit $EXIT_CODE
fi
