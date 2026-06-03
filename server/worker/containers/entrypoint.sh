#!/bin/bash
set -e

HOST_UID=${HOST_UID:-1000}
HOST_GID=${HOST_GID:-1000}

# Create/update sandbox group
if ! getent group sandbox >/dev/null 2>&1; then
    groupadd -g "$HOST_GID" sandbox
else
    groupmod -o -g "$HOST_GID" sandbox || true
fi

# Create/update sandbox user
if ! id sandbox >/dev/null 2>&1; then
    useradd -u "$HOST_UID" -g "$HOST_GID" -ms /bin/bash sandbox
else
    usermod -o -u "$HOST_UID" -g "$HOST_GID" sandbox || true
fi

# Ensure directories exist and are writable
mkdir -p /workspace /home/sandbox
chown -R "$HOST_UID:$HOST_GID" /workspace  || true
chown -R "$HOST_UID:$HOST_GID" /home/sandbox || true
chmod -R u+rwX /workspace || true

# Write .bashrc
# KEY FIX: \[ and \] in PS1 only work when bash *evaluates* the prompt string.
# When stored as literal characters in .bashrc and read with --rcfile they
# appear as '/' and ']' in the terminal output.
# Solution: use \001 (SOH) and \002 (STX) which are the actual bytes that
# bash translates \[ and \] into. We write them with printf hex escapes.
RESET=$(printf '\001\033[0m\002')
GREEN=$(printf '\001\033[0;32m\002')
CYAN=$(printf '\001\033[0;36m\002')

cat > /home/sandbox/.bashrc << EOF
export TERM=xterm-256color
export COLORTERM=truecolor
export HOME=/home/sandbox

# Prompt: cloudide@<folder> \$
# Uses \001..\002 (SOH/STX) to wrap non-printing escape sequences so
# readline cursor tracking stays correct on long commands.
PS1='${GREEN}cloudide${RESET}@${CYAN}\W${RESET} \$ '

alias ls='ls --color=auto'
alias ll='ls -la'
alias grep='grep --color=auto'
EOF

chown "$HOST_UID:$HOST_GID" /home/sandbox/.bashrc

cd /workspace

exec gosu sandbox bash --rcfile /home/sandbox/.bashrc