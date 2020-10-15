#!/bin/bash   
rm controls_SMARThome.txt
find ./www/mobile -type d \( ! -iname ".*" \) -print0 | while IFS= read -r -d '' f; 
  do
   out="DIR $f"
   echo ${out//.\//} >> controls_SMARThome.txt
done
find ./www/mobile -type f \( ! -iname ".*" \) -print0 | while IFS= read -r -d '' f; 
  do
   out="UPD "$(date +"%Y-%m-%d_%T" -d "$(/usr/bin/stat -c %y "$f")")" "$(stat -c %s "$f")" "$(stat -f%z $f)" ${f}"
   echo ${out//.\//} >> controls_SMARThome.txt
done
