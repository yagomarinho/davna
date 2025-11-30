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
STACK_FILE="${STACK_FILE}"
SERVICE_NAME="${SERVICE_NAME}"

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

# --- 2) poll health status loop (i-style) with optional HTTP check
i=0
EXIT_CODE=1

# HTTP probe config (can be overridden by env)
HTTP_CHECK="${HTTP_CHECK:-true}"        # "true" or "false"
SERVICE_PORT="${SERVICE_PORT:-80}"      # port inside the container
HEALTH_PATH="${HEALTH_PATH:-/health}"   # path to probe
HTTP_RETRIES="${HTTP_RETRIES:-$MAX_RETRIES}"
HTTP_SLEEP="${HTTP_SLEEP:-$SLEEP_INTERVAL}"

echo "HTTP_CHECK: $HTTP_CHECK"
echo "SERVICE_PORT: $SERVICE_PORT"
echo "HEALTH_PATH: $HEALTH_PATH"
echo "HTTP_RETRIES: $HTTP_RETRIES"
echo

while true; do
  # get health status, safe if Health not present
  STATUS=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}no-health{{end}}' "$CONTAINER_ID" 2>/dev/null || true)
  STATUS="${STATUS:-no-health}"

  if [[ "$STATUS" == "healthy" ]]; then
    >&2 echo "[$((i+1))/$MAX_RETRIES] $SERVICE_NAME reported Docker health: healthy"

    # If HTTP probing is disabled, success immediately
    if [[ "$HTTP_CHECK" != "true" ]]; then
      EXIT_CODE=0
      break
    fi

    # Try HTTP probe inside the container
    probe_ok=1
    attempt=0
    while [ $attempt -lt "$HTTP_RETRIES" ]; do
      attempt=$((attempt+1))
      >&2 echo "[HTTP probe $attempt/$HTTP_RETRIES] probing http://localhost:${SERVICE_PORT}${HEALTH_PATH} inside container $CONTAINER_ID"

      # Try curl first, then wget. Use docker exec to run inside the container.
      if docker exec "$CONTAINER_ID" sh -c 'command -v curl >/dev/null 2>&1' >/dev/null 2>&1; then
        docker exec "$CONTAINER_ID" sh -c "curl -fsS -o /dev/null 'http://localhost:${SERVICE_PORT}${HEALTH_PATH}'" >/dev/null 2>&1 && probe_ok=0 || probe_ok=1
      elif docker exec "$CONTAINER_ID" sh -c 'command -v wget >/dev/null 2>&1' >/dev/null 2>&1; then
        # wget --spider might not be available on some minimal images; using -q -O - to check response
        docker exec "$CONTAINER_ID" sh -c "wget -q -O - 'http://localhost:${SERVICE_PORT}${HEALTH_PATH}' >/dev/null 2>&1" && probe_ok=0 || probe_ok=1
      else
        >&2 echo "ERROR: neither curl nor wget available inside container $CONTAINER_ID; cannot perform HTTP health probe" >&2
        probe_ok=2
        break
      fi

      if [ "$probe_ok" -eq 0 ]; then
        >&2 echo "HTTP probe succeeded"
        EXIT_CODE=0
        break
      fi

      >&2 echo "HTTP probe failed, sleeping ${HTTP_SLEEP}s"
      sleep "$HTTP_SLEEP"
    done

    # handle results from HTTP probe loop
    if [ "$probe_ok" -eq 0 ]; then
      # success: Docker health + HTTP probe OK
      break
    elif [ "$probe_ok" -eq 2 ]; then
      # neither curl nor wget -> consider this an error (adjust if you prefer fallback)
      EXIT_CODE=1
      >&2 echo "Aborting due to missing HTTP client inside container"
      break
    else
      # HTTP probe exhausted retries -> fail
      EXIT_CODE=1
      >&2 echo "Timeout: HTTP probe did not succeed after $HTTP_RETRIES attempts"
      break
    fi
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
