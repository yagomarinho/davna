#!/usr/bin/env bash
# wait-for-docker-healthy.sh - aceita apenas --file, --service, --down e '--' para comando
set -euo pipefail

# --- CONFIGURÁVEIS (internos; NÃO são parâmetros) ---
SLEEP_INTERVAL=2
MAX_RETRIES=30

# Defaults
STACK_FILE="./docker-compose.yml"
SERVICE_NAME=""
TEARDOWN=false
EXEC_CMD_ARGS=()

# --- parse minimal flags ---
while [[ $# -gt 0 ]]; do
  case "$1" in
    --file)
      shift
      if [[ $# -eq 0 ]]; then
        echo "Error: --file requires a path argument" >&2
        exit 2
      fi
      STACK_FILE="$1"
      shift
      ;;
    --service)
      shift
      if [[ $# -eq 0 ]]; then
        echo "Error: --service requires a name argument" >&2
        exit 2
      fi
      SERVICE_NAME="$1"
      shift
      ;;
    --down)
      TEARDOWN=true
      shift
      ;;
    --)
      shift
      EXEC_CMD_ARGS=("$@")
      break
      ;;
    -*)
      echo "Unknown option: $1" >&2
      exit 2
      ;;
    *)
      # posicional não aceito -> tratar como erro para ser estrito
      echo "Unknown positional argument: $1" >&2
      exit 2
      ;;
  esac
done

# Valida service
if [[ -z "${SERVICE_NAME:-}" ]]; then
  echo "Error: service name must be provided via --service." >&2
  exit 2
fi

# Print config
echo "Config:"
echo "  STACK_FILE:     $STACK_FILE"
echo "  SERVICE_NAME:   $SERVICE_NAME"
echo "  SLEEP_INTERVAL: $SLEEP_INTERVAL"
echo "  MAX_RETRIES:    $MAX_RETRIES"
echo "  TEARDOWN:       $TEARDOWN"
if [ ${#EXEC_CMD_ARGS[@]} -gt 0 ]; then
  echo "  EXEC_CMD:       ${EXEC_CMD_ARGS[*]}"
fi
echo

# 1) wait for container id
i=0
CONTAINER_ID=""
until [[ -n "$CONTAINER_ID" ]]; do
  CONTAINER_ID=$(docker compose -f "$STACK_FILE" ps -q "$SERVICE_NAME" 2>/dev/null || true)

  if [[ -n "$CONTAINER_ID" ]]; then
    echo "Found container id: $CONTAINER_ID"
    break
  fi

  i=$((i+1))
  if [ "$i" -ge "$MAX_RETRIES" ]; then
    echo "Timeout: could not get container id for '$SERVICE_NAME' after $i attempts" >&2
    $TEARDOWN && docker compose -f "$STACK_FILE" down --volumes --remove-orphans || true
    exit 1
  fi

  >&2 echo "[$i/$MAX_RETRIES] container for $SERVICE_NAME not ready - sleeping ${SLEEP_INTERVAL}s"
  sleep "$SLEEP_INTERVAL"
done

# 2) poll health status loop (docker healthy)
i=0
EXIT_CODE=1
while true; do
  STATUS=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}no-health{{end}}' "$CONTAINER_ID" 2>/dev/null || true)
  STATUS="${STATUS:-no-health}"

  if [[ "$STATUS" == "healthy" ]]; then
    >&2 echo "[$((i+1))/$MAX_RETRIES] $SERVICE_NAME is healthy (docker:$STATUS)"
    EXIT_CODE=0
    break
  fi

  if [[ "$STATUS" == "unhealthy" ]]; then
    >&2 echo "[$((i+1))/$MAX_RETRIES] $SERVICE_NAME is UNHEALTHY (docker:$STATUS)"
    EXIT_CODE=1
    break
  fi

  i=$((i+1))
  if [ "$i" -ge "$MAX_RETRIES" ]; then
    >&2 echo "Timeout: waited $i attempts for $SERVICE_NAME to become healthy (last docker:$STATUS)"
    EXIT_CODE=1
    break
  fi


  >&2 echo "[$i/$MAX_RETRIES] $SERVICE_NAME status docker:'$STATUS' - sleeping ${SLEEP_INTERVAL}s"

  sleep "$SLEEP_INTERVAL"
done

# 3) executar comando opcional (exec) ou teardown
if [ $EXIT_CODE -eq 0 ] && [ ${#EXEC_CMD_ARGS[@]} -gt 0 ]; then
  echo "Executing command: ${EXEC_CMD_ARGS[*]}"
  exec "${EXEC_CMD_ARGS[@]}"
  CMD_EXIT=$?
  echo "Command finished with exit code $CMD_EXIT"
  $TEARDOWN && docker compose -f "$STACK_FILE" down --volumes --remove-orphans || true
  exit $CMD_EXIT
else
  $TEARDOWN && echo "Tearing down compose..." && docker compose -f "$STACK_FILE" down --volumes --remove-orphans || true
  exit $EXIT_CODE
fi
