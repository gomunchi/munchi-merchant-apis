# check_postgres.sh

# Function to check if PostgreSQL service is ready
function check_postgres_ready() {
  # Define the maximum number of retries
  max_retries=10
  retries=0

  while ! nc -z -w 1 localhost $POSTGRES_PORT_TESTING >/dev/null 2>&1 && (( retries++ < max_retries )); do
      sleep 1
  done

  return $?
}
