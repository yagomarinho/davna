#!/usr/bin/env bash
# wait-for-healthy.sh - robust arg parsing (positional + flags)
set -euo pipefail

# --- Parsing: somente ENV para configurações; posicional vira --down ---
TEARDOWN=false
EXEC_CMD_ARGS=()

while [[ $# -gt 0 ]]; do
  case "$1" in
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
      # qualquer posicional -> habilita teardown (equivalente a --down)
      TEARDOWN=true
      shift
      ;;
  esac
done

# Agora apenas variáveis de ambiente configuram comportamento (com defaults)
SLEEP_INTERVAL="${SLEEP_INTERVAL:-2}"
MAX_RETRIES="${MAX_RETRIES:-30}"
STACK_FILE="${STACK_FILE:-apps/api/docker-compose.yml}"
SERVICE_NAME="${SERVICE_NAME:-api}"

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

# 1) wait for container id (until style)
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

# 2) poll health status loop (i-style)
i=0
EXIT_CODE=1
while true; do
  # get health status, safe if Health not present
  STATUS=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}no-health{{end}}' "$CONTAINER_ID" 2>/dev/null || true)
  STATUS="${STATUS:-no-health}"

  if [[ "$STATUS" == "healthy" ]]; then
    >&2 echo "[$((i+1))/$MAX_RETRIES] $SERVICE_NAME is healthy"
    EXIT_CODE=0
    break
  fi

  if [[ "$STATUS" == "unhealthy" ]]; then
    >&2 echo "[$((i+1))/$MAX_RETRIES] $SERVICE_NAME is UNHEALTHY"
    EXIT_CODE=1
    break
  fi

  i=$((i+1))
  if [ "$i" -ge "$MAX_RETRIES" ]; then
    >&2 echo "Timeout: waited $i attempts for $SERVICE_NAME to become healthy (last status: $STATUS)"
    EXIT_CODE=1
    break
  fi

  >&2 echo "[$i/$MAX_RETRIES] $SERVICE_NAME status is '$STATUS' - sleeping ${SLEEP_INTERVAL}s"
  sleep "$SLEEP_INTERVAL"
done

# 3) on success run optional command (exec) while compose stays up
if [ $EXIT_CODE -eq 0 ] && [ ${#EXEC_CMD_ARGS[@]} -gt 0 ]; then
  echo "Executing command: ${EXEC_CMD_ARGS[*]}"
  exec "${EXEC_CMD_ARGS[@]}"
  # exec replaces shell; if it returns, capture it (defensive)
  CMD_EXIT=$?
  echo "Command finished with exit code $CMD_EXIT"
  $TEARDOWN && docker compose -f "$STACK_FILE" down --volumes --remove-orphans || true
  exit $CMD_EXIT
else
  # no exec command or failed health -> optionally teardown and exit with code
  $TEARDOWN && echo "Tearing down compose..." && docker compose -f "$STACK_FILE" down --volumes --remove-orphans || true
  exit $EXIT_CODE
fi
