#!/usr/bin/env bash

if [[ $# -eq 0 ]] ; then
    echo "Missing argument of target directory"
    exit 1
fi
if ! [[ $(which npm) ]]; then
    echo "Missing npm"
    exit 1
fi

if ! [[ $(which tsc) ]]; then
    npm i -g typescript
fi

tsc

n exec 18.18.2 npm run webpack || npm run webpack

DIR="$1"

rm -rf "$DIR"
mkdir -pv "$DIR"

echo "Copying Trilium to build directory $DIR"

mv build/* "$DIR"/

for d in 'images' 'libraries' 'src' 'db'; do
    cp -r "$d" "$DIR"/
done
for f in 'README.md' 'LICENSE' 'config-sample.ini'; do
    cp "$f" "$DIR"/
done
cp webpack-* "$DIR"/      # here warning because there is no 'webpack-*', but webpack.config.ts only

# run in subshell (so we return to original dir)
# (cd $DIR && n exec 18.18.2 npm install --omit=dev && n exec 18.18.2 npm rebuild)
(cd $DIR && npm install --omit=dev && npm rebuild)

if [[ -d "$DIR"/node_modules ]]; then
# cleanup of useless files in dependencies
    for d in 'image-q/demo' 'better-sqlite3/Release' 'better-sqlite3/deps/sqlite3.tar.gz' '@jimp/plugin-print/fonts' 'jimp/browser' 'jimp/fonts'; do
        [[ -e "$DIR"/node_modules/"$d" ]] && rm -rv "$DIR"/node_modules/"$d"
    done

# delete all tests (there are often large images as test file for jimp etc.)
    for d in 'test' 'docs' 'demo'; do
        find "$DIR"/node_modules -name "$d" -exec rm -rf {} \;
    done
fi

find $DIR/libraries -name "*.map" -type f -delete

d="$DIR"/src/public
[[ -d "$d"/app-dist ]] || mkdir -pv "$d"/app-dist
cp "$d"/app/share.js "$d"/app-dist/
cp -r "$d"/app/doc_notes "$d"/app-dist/

rm -rf "$d"/app
rm -rf "$DIR"/*.ts
unset f d DIR
