#!/usr/bin/env bash
set -eu

usage() {
  cat <<EOF
Usage:
  $0 -t TYPE ARG [-t TYPE ARG ...] -- <command ...>

Supported types:
  mongo   -> uses wait-for-mongo.sh <host:port>
  http    -> uses wait-for-http-health.sh host:port[/path]

Examples:
  $0 -t mongo mongo:27017 -t http cache:3334/health -- node ./dist/index.js
  $0 -t http api:3334/ready -t mongo mongo:27017 -- ./start.sh
EOF
  exit 1
}

# Defaults
PIDS=""
CMDS=""
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

echo "$SCRIPT_DIR"

# Cleanup background processes on exit
cleanup() {
  for pid in $PIDS; do
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
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
          SCRIPT="$SCRIPT_DIR/wait-for-mongo.sh"
          if [ ! -x "$SCRIPT" ]; then
            echo "ERROR: $SCRIPT not found or not executable" >&2
            exit 2
          fi
          "$SCRIPT" "$ARG" &
          pid=$!
          PIDS="$PIDS $pid"
          CMDS="$CMDS|$SCRIPT $ARG"
          echo "Started waiter: $SCRIPT $ARG (pid $pid)"
          ;;

        http)
          SCRIPT="$SCRIPT_DIR/wait-for-http-health.sh"
          if [ ! -x "$SCRIPT" ]; then
            echo "ERROR: $SCRIPT not found or not executable" >&2
            exit 2
          fi
          "$SCRIPT" "$ARG" &
          pid=$!
          PIDS="$PIDS $pid"
          CMDS="$CMDS|$SCRIPT $ARG"
          echo "Started waiter: $SCRIPT $ARG (pid $pid)"
          ;;

        *)
          echo "Unknown type: $TYPE" >&2
          usage
          ;;
      esac
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

# Check that at least one waiter was started
trimmed_pids=$(echo "$PIDS" | tr -s ' ' | sed 's/^ //;s/ $//')
if [ -z "$trimmed_pids" ]; then
  echo "No -t arguments provided. Nothing to wait for." >&2
  usage
fi

EXIT_CODE=0

# Wait for all background waiters
for pid in $trimmed_pids; do
  if wait "$pid"; then
    echo "Waiter pid $pid completed successfully"
  else
    status=$?
    echo "ERROR: waiter pid $pid exited with status $status" >&2
    EXIT_CODE=$status

    # Kill other waiters still running
    for other in $trimmed_pids; do
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

# Run final command after all services are ready
if [ $EXIT_CODE -eq 0 ] && [ $# -gt 0 ]; then
  echo "All services are ready. Executing final command: $*"
  exec "$@"
else
  exit $EXIT_CODE
fi
