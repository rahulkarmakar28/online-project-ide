#!/bin/bash
set -e

HOST_UID=${HOST_UID:-1000}
HOST_GID=${HOST_GID:-1000}

# Update sandbox user/group to match host UID/GID
# so bind-mounted files are owned correctly
groupmod -o -g "$HOST_GID" sandbox 2>/dev/null || true
usermod  -o -u "$HOST_UID" sandbox 2>/dev/null || true

# Ensure /etc/passwd has the correct entry so the shell
# doesn't show "I have no name!" — usermod may not update
# the name if the UID already existed
if ! getent passwd sandbox > /dev/null 2>&1; then
    echo "sandbox:x:${HOST_UID}:${HOST_GID}:sandbox:/home/sandbox:/bin/bash" >> /etc/passwd
fi

# Fix home dir ownership
mkdir -p /home/sandbox
chown "$HOST_UID:$HOST_GID" /home/sandbox

# Fix workspace ownership
mkdir -p /workspace
chown -R "$HOST_UID:$HOST_GID" /workspace

# Write PS1 to .bashrc at runtime so it's always correct
# regardless of what the Dockerfile set.
# \001 and \002 are \[ \] — tell readline the escape sequence
# has zero width so cursor position stays correct.
# Without them, long commands wrap at the wrong column.
cat > /home/sandbox/.bashrc << 'BASHRC'
# CloudIDE shell config
export TERM=xterm-256color
export COLORTERM=truecolor

# Prompt: cloudide@<folder> $
# Use \001...\002 to wrap non-printing escape sequences
PS1='\001\e[0;32m\002cloudide\001\e[0m\002@\001\e[0;36m\002\W\001\e[0m\002 \$ '
export PS1

# Useful aliases
alias ls='ls --color=auto'
alias ll='ls -la'
alias grep='grep --color=auto'
BASHRC

chown "$HOST_UID:$HOST_GID" /home/sandbox/.bashrc

# Launch bash as sandbox user, sourcing .bashrc
exec gosu sandbox bash --rcfile /home/sandbox/.bashrc