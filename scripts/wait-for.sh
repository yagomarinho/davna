#!/usr/bin/env bash
set -eu

usage() {
  cat <<EOF
Usage:
  $0 -t mongo host:port -t health service_name -- <command ...>

Supported types:
  mongo   -> uses /usr/local/bin/wait-for-mongo.sh <host:port>
  health  -> uses /usr/local/bin/wait-for-health.sh <service_name>

Example:
  $0 -t mongo mongo:27017 -t health cache -- node ./dist/index.js
EOF
  exit 1
}

PIDS=""
CMDS=""

# Cleanup background processes on exit
cleanup() {
  for pid in $PIDS; do
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
    fi
  done
}
trap cleanup INT TERM

if [ $# -eq 0 ]; then usage; fi

# Parse arguments
while [ $# -gt 0 ]; do
  case "$1" in
    -t|--type)
      shift
      [ $# -gt 0 ] || usage
      TYPE="$1"
      shift
      [ $# -gt 0 ] || usage
      ARG="$1"
      shift

      case "$TYPE" in
        mongo)
          SCRIPT="/usr/local/bin/wait-for-mongo.sh"
          ;;
        health)
          SCRIPT="/usr/local/bin/wait-for-health.sh"
          ;;
        *)
          echo "Unknown type: $TYPE" >&2
          usage
          ;;
      esac

      if [ ! -x "$SCRIPT" ]; then
        echo "ERROR: $SCRIPT not found or not executable" >&2
        exit 2
      fi

      # Start waiter in the background
      sh -c "$SCRIPT $ARG" &
      pid=$!
      PIDS="$PIDS $pid"
      CMDS="$CMDS|$SCRIPT $ARG"

      echo "Started waiter: $SCRIPT $ARG (pid $pid)"
      ;;

    --)
      shift
      break
      ;;

    -*)
      echo "Unknown argument: $1" >&2
      usage
      ;;

    *)
      echo "Unexpected argument: $1" >&2
      usage
      ;;
  esac
done

# No waiters? Error.
if [ -z "$(echo "$PIDS" | tr -d ' ')" ]; then
  echo "No -t arguments provided. Nothing to wait for." >&2
  usage
fi

EXIT_CODE=0

# Wait for all background waiters
for pid in $PIDS; do
  if wait "$pid"; then
    echo "Waiter pid $pid completed successfully"
  else
    status=$?
    echo "ERROR: waiter pid $pid exited with status $status" >&2
    EXIT_CODE=$status

    # Kill other waiters still running
    for other in $PIDS; do
      if [ "$other" != "$pid" ]; then
        if kill -0 "$other" 2>/dev/null; then
          echo "Killing waiter pid $other"
          kill "$other" 2>/dev/null || true
        fi
      fi
    done
    break
  fi
done

if [ $EXIT_CODE -ne 0 ]; then
  echo "One or more waiters failed. Exiting with status $EXIT_CODE" >&2
  exit $EXIT_CODE
fi

# Run final command after all services are ready
if [ $# -gt 0 ]; then
  echo "All services are ready. Executing final command: $*"
  exec "$@"
else
  echo "All services are ready. No final command provided — exiting."
  exit 0
fi
