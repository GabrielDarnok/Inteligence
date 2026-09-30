#!/bin/bash
for file in frontend/src/app/page.tsx frontend/src/app/sources/page.tsx frontend/src/app/indicator/\[value\]/page.tsx; do
  if ! grep -q "export const revalidate" "$file"; then
    # Add export const revalidate = 0; after the last import
    sed -i '' '/^import /!b; :a; n; /^import /ba; i\
export const revalidate = 0;\
' "$file"
  fi
done
