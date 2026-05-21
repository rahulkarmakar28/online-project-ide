FROM golang:1.22-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
    bash curl nano git gosu iproute2 \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -ms /bin/bash sandbox

RUN mkdir -p /workspace

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

RUN echo "export PATH=/usr/local/go/bin:\$PATH" >> /home/sandbox/.bashrc

ENV GOPATH=/workspace/go
ENV PATH="/usr/local/go/bin:${PATH}"

WORKDIR /workspace

ENTRYPOINT ["/entrypoint.sh"]