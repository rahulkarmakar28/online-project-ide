#!/bin/bash
set -e

HOST_UID=${HOST_UID:-1000}
HOST_GID=${HOST_GID:-1000}

# Match sandbox uid/gid to host user so bind-mounted files are writable
groupmod -o -g "$HOST_GID" sandbox 2>/dev/null || true
usermod  -o -u "$HOST_UID" -g "$HOST_GID" sandbox 2>/dev/null || true

# Rewrite /etc/passwd so bash never shows "I have no name!"
sed -i "/^sandbox:/d" /etc/passwd 2>/dev/null || true
echo "sandbox:x:${HOST_UID}:${HOST_GID}:sandbox:/home/sandbox:/bin/bash" >> /etc/passwd
sed -i "/^sandbox:/d" /etc/group 2>/dev/null || true
echo "sandbox:x:${HOST_GID}:" >> /etc/group

# Fix ownership
mkdir -p /home/sandbox /workspace
chown "${HOST_UID}:${HOST_GID}" /home/sandbox
chown -R "${HOST_UID}:${HOST_GID}" /workspace 2>/dev/null || true
chmod -R u+rwX /workspace 2>/dev/null || true

# Write .bashrc via heredoc — backslashes are never interpreted here,
# which fixes the random m/n/r/v prefix caused by Dockerfile echo
cat > /home/sandbox/.bashrc << 'RCEOF'
export TERM=xterm-256color
export COLORTERM=truecolor
export HOME=/home/sandbox
PS1='\001\e[0;32m\002cloudide\001\e[0m\002@\001\e[0;36m\002\W\001\e[0m\002 \$ '
export PS1
alias ls='ls --color=auto'
alias ll='ls -la'
alias grep='grep --color=auto'
RCEOF

chown "${HOST_UID}:${HOST_GID}" /home/sandbox/.bashrc

exec gosu sandbox bash --rcfile /home/sandbox/.bashrc