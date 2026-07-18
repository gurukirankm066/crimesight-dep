#!/bin/sh
if ! ss -tlnp 2>/dev/null | rg -q ":3000 "; then
  cd /home/z/my-project
  npx next dev -p 3000 >> /home/z/my-project/dev.log 2>&1 &
fi
