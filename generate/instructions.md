# Instructions

Run following command to generate 1 Billion row file

```bash
go run main.go 1_000_000_000 69420
# the verify the hash with:
sha256sum measurements.txt
# the hash should be:
# 573c3c4c8399bdea625d8774ab4dd29855c3696c08cace67c38f2594a5a01ce7  measurements.txt
```