#!/bin/bash
cd "$(dirname "$0")/.."
bun scripts/seed-command-center-v3.ts
