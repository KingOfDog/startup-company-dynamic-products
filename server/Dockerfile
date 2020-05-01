FROM golang

WORKDIR /app/server
COPY . .

RUN go mod download

RUN go build
RUN ls
ENTRYPOINT [ "./dynamic-products" ]

EXPOSE 8000